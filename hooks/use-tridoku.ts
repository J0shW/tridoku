"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { 
  Cell, 
  CellId,
  getPuzzleNumber,
  loadPuzzle,
  validateBoard,
  isPuzzleComplete,
  EXAMPLE_PUZZLE,
  Difficulty,
  createEmptyBoard
} from "@/lib/tridoku"
import { getDailyPuzzle } from "@/lib/puzzle-service"
import { trackEvent } from "@/lib/analytics"
import { normalizeDateKey, todayKey, type DateKey } from "@/lib/dates"
import { defaultStats, normalizeStats, recordStart, recordWin, type GameStats } from "@/lib/stats"

export type { DifficultyStats, GameStats } from "@/lib/stats"

export type InputMode = 'pen' | 'pencil'

interface GameState {
  cells: Cell[][]
  selectedCellId: CellId | null
  isComplete: boolean
  isPaused: boolean
  elapsedTime: number
  showErrors: boolean
  difficulty: Difficulty | null
  hasStarted: boolean
  isViewMode: boolean
  inputMode: InputMode
  puzzleHash: string | null // Hash of original puzzle to validate saved progress
  puzzleDate: DateKey | null // Date of the loaded puzzle (not necessarily today, e.g. after midnight)
  highlightedValue: number | null // Value to highlight across the board (double-tap feature)
}

const STORAGE_KEY = "tridoku-game-state"
const STATS_KEY = "tridoku-stats"

function getStoredStats(): GameStats {
  if (typeof window === "undefined") return defaultStats()
  try {
    return normalizeStats(JSON.parse(localStorage.getItem(STATS_KEY) || "null"), todayKey())
  } catch (e) {
    console.error('Failed to parse stats:', e)
    return defaultStats()
  }
}

function saveStats(stats: GameStats) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats))
  }
}

interface SavedProgress {
  date: string
  elapsedTime: number
  inputMode: InputMode
  userCells: { row: number; col: number; value: number | null; pencilMarks: number[] }[]
  puzzleHash?: string // Hash of the original puzzle to validate progress matches
}

type SavedProgressByDifficulty = Partial<Record<Difficulty, SavedProgress>>

function saveGameProgress(gameState: GameState) {
  if (typeof window === "undefined" || !gameState.difficulty || !gameState.puzzleHash) return
  const userCells: SavedProgress['userCells'] = []
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 17; col++) {
      const cell = gameState.cells[row][col]
      if (cell.hidden || cell.isGiven) continue
      if (cell.value !== null || (cell.pencilMarks && cell.pencilMarks.length > 0)) {
        userCells.push({ row, col, value: cell.value, pencilMarks: cell.pencilMarks || [] })
      }
    }
  }
  const stored = localStorage.getItem(STORAGE_KEY)
  let allProgress: SavedProgressByDifficulty = {}
  if (stored) {
    try { allProgress = JSON.parse(stored) } catch { /* ignore */ }
  }
  allProgress[gameState.difficulty] = {
    date: gameState.puzzleDate ?? todayKey(),
    elapsedTime: gameState.elapsedTime,
    inputMode: gameState.inputMode,
    userCells,
    puzzleHash: gameState.puzzleHash,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allProgress))
}

function loadGameProgress(difficulty: Difficulty, currentPuzzleHash?: string): SavedProgress | null {
  if (typeof window === "undefined") return null
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return null
  try {
    const allProgress: SavedProgressByDifficulty = JSON.parse(stored)
    const progress = allProgress[difficulty]
    if (!progress || normalizeDateKey(progress.date) !== todayKey()) return null
    // Validate that saved progress matches the current puzzle
    // This prevents loading yesterday's progress onto today's puzzle
    if (currentPuzzleHash && progress.puzzleHash && progress.puzzleHash !== currentPuzzleHash) {
      console.log('[useTridoku] Saved progress puzzle hash mismatch - discarding old progress')
      clearGameProgress(difficulty)
      return null
    }
    return progress
  } catch {
    return null
  }
}

function clearGameProgress(difficulty: Difficulty) {
  if (typeof window === "undefined") return
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return
  try {
    const allProgress: SavedProgressByDifficulty = JSON.parse(stored)
    delete allProgress[difficulty]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allProgress))
  } catch { /* ignore */ }
}

// Generate a simple hash of the puzzle's given cells to validate progress
function getPuzzleHash(puzzleString: string): string {
  // Use a simple hash - just the puzzle string itself since it uniquely identifies the puzzle
  return puzzleString
}

export function useTridoku() {
  const [gameState, setGameState] = useState<GameState>({
    cells: createEmptyBoard(),
    selectedCellId: null,
    isComplete: false,
    isPaused: false,
    elapsedTime: 0,
    showErrors: false,
    difficulty: null,
    hasStarted: false,
    isViewMode: false,
    inputMode: 'pen',
    puzzleHash: null,
    puzzleDate: null,
    highlightedValue: null,
  })
  const [stats, setStats] = useState<GameStats>(defaultStats)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)

  // Keep a ref to the latest game state so callbacks always have current data
  const gameStateRef = useRef(gameState)
  useEffect(() => { gameStateRef.current = gameState }, [gameState])

  // Load stats on mount (client-side only)
  useEffect(() => {
    const loadedStats = getStoredStats()
    setStats(loadedStats)
    setIsLoading(false)
  }, [])

  // Timer
  useEffect(() => {
    if (!gameState.hasStarted || gameState.isComplete || gameState.isPaused) return

    const interval = setInterval(() => {
      setGameState(prev => ({ ...prev, elapsedTime: prev.elapsedTime + 1 }))
    }, 1000)

    return () => clearInterval(interval)
  }, [gameState.hasStarted, gameState.isComplete, gameState.isPaused])

  // Save game progress to localStorage on each cell change
  useEffect(() => {
    if (!gameState.hasStarted || gameState.isComplete || !gameState.difficulty) return
    saveGameProgress(gameState)
  }, [gameState.cells, gameState.hasStarted, gameState.isComplete, gameState.difficulty])

  // Handle puzzle completion
  useEffect(() => {
    if (!gameState.isComplete || !gameState.difficulty) return
    
    // Enter view mode immediately
    if (!gameState.isViewMode) {
      setGameState(prev => ({ ...prev, isViewMode: true, selectedCellId: null }))
    }
    
    // Clear in-progress save for this difficulty
    clearGameProgress(gameState.difficulty)
    
    // Record the win against the puzzle's own date (TRI-006). recordWin returns null
    // if this puzzle was already counted, e.g. when reopening it in view mode.
    const difficulty = gameState.difficulty
    const newDiffStats = recordWin(stats[difficulty], {
      puzzleDate: gameState.puzzleDate ?? todayKey(),
      today: todayKey(),
      time: gameState.elapsedTime,
      solvedBoard: boardToString(gameState.cells),
    })
    if (!newDiffStats) return

    // Track puzzle completion (e.g. easy_completed, medium_completed, hard_completed)
    trackEvent(`${difficulty}_completed`, { time: gameState.elapsedTime })

    const newStats = { ...stats, [difficulty]: newDiffStats }
    setStats(newStats)
    saveStats(newStats)
  }, [gameState.isComplete, gameState.elapsedTime, gameState.difficulty, gameState.cells, gameState.puzzleDate, stats])

  // Select a cell by CellId
  const selectCell = useCallback((cellId: CellId | null) => {
    if (gameState.isViewMode) return
    setGameState(prev => {
      // If clicking on the already selected cell, check if it has a value
      if (cellId && cellId === prev.selectedCellId) {
        const [rowStr, colStr] = cellId.split("-")
        const row = parseInt(rowStr)
        const col = parseInt(colStr)
        const cell = prev.cells[row]?.[col]
        
        if (cell?.value != null) {
          // Toggle highlight: if already highlighting this value, turn it off; otherwise turn it on
          const newHighlightedValue = prev.highlightedValue === cell.value ? null : cell.value
          return { ...prev, highlightedValue: newHighlightedValue }
        }
      }
      
      // Clear highlight when selecting a different cell
      return { ...prev, selectedCellId: cellId, highlightedValue: null }
    })
  }, [gameState.isViewMode])

  // Count the puzzle as played on its first entry (TRI-007)
  const markStarted = useCallback(() => {
    const { difficulty, puzzleDate, isViewMode, selectedCellId, cells } = gameStateRef.current
    if (!difficulty || !puzzleDate || isViewMode || !selectedCellId) return
    const [row, col] = selectedCellId.split("-").map(Number)
    if (cells[row]?.[col]?.isGiven) return
    setStats(prev => {
      const next = recordStart(prev[difficulty], puzzleDate)
      if (!next) return prev
      const all = { ...prev, [difficulty]: next }
      saveStats(all)
      return all
    })
  }, [])

  // Set value on the selected cell (pen mode) or toggle pencil mark (pencil mode)
  const setValue = useCallback((value: number) => {
    if (gameState.isViewMode) return
    markStarted()
    setGameState(prev => {
      if (!prev.selectedCellId) return prev
      const [rowStr, colStr] = prev.selectedCellId.split("-")
      const row = parseInt(rowStr)
      const col = parseInt(colStr)
      const cell = prev.cells[row][col]
      if (cell.hidden || cell.isGiven) return prev

      if (prev.inputMode === 'pencil') {
        // Pencil mode: toggle the pencil mark
        const currentMarks = cell.pencilMarks || []
        let newMarks: number[]
        
        if (currentMarks.includes(value)) {
          // Remove the mark if it exists
          newMarks = currentMarks.filter(m => m !== value)
        } else {
          // Add the mark if we have room (max 3)
          if (currentMarks.length >= 6) {
            // Already at max, don't add
            return prev
          }
          newMarks = [...currentMarks, value].sort((a, b) => a - b)
        }
        
        const updatedCells = prev.cells.map((r, ri) =>
          ri === row
            ? r.map((c, ci) => (ci === col ? { ...c, pencilMarks: newMarks } : c))
            : r
        )
        
        return { ...prev, cells: updatedCells }
      } else {
        // Pen mode: set the value and clear pencil marks (they're hidden but preserved)
        const updatedCells = prev.cells.map((r, ri) =>
          ri === row
            ? r.map((c, ci) => (ci === col ? { ...c, value } : c))
            : r
        )
        const validatedCells = validateBoard(updatedCells)
        const isComplete = isPuzzleComplete(validatedCells)
        
        return { ...prev, cells: validatedCells, isComplete }
      }
    })
  }, [gameState.isViewMode, markStarted])

  // Clear the selected cell (pen mode clears value, pencil mode does nothing - user must toggle marks individually)
  const clearCell = useCallback(() => {
    if (gameState.isViewMode) return
    setGameState(prev => {
      if (!prev.selectedCellId) return prev
      const [rowStr, colStr] = prev.selectedCellId.split("-")
      const row = parseInt(rowStr)
      const col = parseInt(colStr)
      const cell = prev.cells[row][col]
      if (cell.hidden || cell.isGiven) return prev

      // In pencil mode, clear all pencil marks
      if (prev.inputMode === 'pencil') {
        const updatedCells = prev.cells.map((r, ri) =>
          ri === row
            ? r.map((c, ci) => (ci === col ? { ...c, pencilMarks: [] } : c))
            : r
        )
        return { ...prev, cells: updatedCells }
      }

      const updatedCells = prev.cells.map((r, ri) =>
        ri === row
          ? r.map((c, ci) => (ci === col ? { ...c, value: null } : c))
          : r
      )
      return { ...prev, cells: validateBoard(updatedCells) }
    })
  }, [gameState.isViewMode])

  // Toggle input mode between pen and pencil
  const setInputMode = useCallback((mode: InputMode) => {
    setGameState(prev => ({ ...prev, inputMode: mode }))
  }, [])

  // Toggle error highlighting
  const toggleErrors = useCallback(() => {
    setGameState(prev => {
      const enabled = !prev.showErrors
      trackEvent("error_check_toggled", {
        enabled,
        difficulty: prev.difficulty ?? "unknown",
      })
      return { ...prev, showErrors: enabled }
    })
  }, [])

  // Toggle pause
  const togglePause = useCallback(() => {
    setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }))
  }, [])

  // Change difficulty
  const changeDifficulty = useCallback(async (difficulty: Difficulty) => {
    if (difficulty === gameState.difficulty) return
    
    // Save current game progress before switching
    const current = gameStateRef.current
    if (current.hasStarted && !current.isComplete && current.difficulty) {
      saveGameProgress(current)
      // Leaving an in-progress puzzle to switch difficulty counts as abandoning it
      if (!current.isViewMode) {
        trackEvent(`${current.difficulty}_abandoned`, {
          reason: "switch_difficulty",
          time: current.elapsedTime,
        })
      }
    }

    // Track loading this difficulty (e.g. easy_loaded, medium_loaded, hard_loaded)
    trackEvent(`${difficulty}_loaded`)

    setIsGenerating(true)
    
    try {
      const diffStats = stats[difficulty]
      
    // Check if this difficulty was already completed today
    // Today's puzzle already solved: show it in view mode. Compare dates rather than
    // completedToday so a tab left open past midnight doesn't reopen yesterday's board.
    if (diffStats.lastPlayedDate === todayKey() && diffStats.todaysPuzzle && diffStats.todaysTime !== undefined) {
      // Load completed puzzle in view mode
      const puzzleCells = loadPuzzle(diffStats.todaysPuzzle)
      setGameState({
        cells: puzzleCells,
        selectedCellId: null,
        isComplete: true,
        isPaused: false,
        elapsedTime: diffStats.todaysTime,
        showErrors: false,
        difficulty,
        hasStarted: true,
        isViewMode: true,
        inputMode: 'pen',
        puzzleHash: diffStats.todaysPuzzle,
        puzzleDate: diffStats.lastPlayedDate,
        highlightedValue: null,
      })
    } else {
      // Fetch today's puzzle first
      const dailyPuzzle = await getDailyPuzzle(undefined, difficulty)
      const puzzleHash = getPuzzleHash(dailyPuzzle.puzzle)
      
      // Check for saved in-progress game, validating against today's puzzle hash
      const savedProgress = loadGameProgress(difficulty, puzzleHash)
      const puzzleCells = loadPuzzle(dailyPuzzle.puzzle)
      
      if (savedProgress) {
        // Restore saved progress onto the base puzzle
        for (const uc of savedProgress.userCells) {
          const cell = puzzleCells[uc.row][uc.col]
          if (!cell.hidden && !cell.isGiven) {
            puzzleCells[uc.row][uc.col] = { ...cell, value: uc.value, pencilMarks: uc.pencilMarks }
          }
        }
        const validatedCells = validateBoard(puzzleCells)
        setGameState({
          cells: validatedCells,
          selectedCellId: null,
          isComplete: false,
          isPaused: false,
          elapsedTime: savedProgress.elapsedTime,
          showErrors: false,
          difficulty,
          hasStarted: true,
          isViewMode: false,
          inputMode: savedProgress.inputMode,
          puzzleHash,
          puzzleDate: dailyPuzzle.date,
          highlightedValue: null,
        })
      } else {
        setGameState({
          cells: puzzleCells,
          selectedCellId: null,
          isComplete: false,
          isPaused: false,
          elapsedTime: 0,
          showErrors: false,
          difficulty,
          hasStarted: true,
          isViewMode: false,
          inputMode: 'pen',
          puzzleHash,
          puzzleDate: dailyPuzzle.date,
          highlightedValue: null,
        })
      }
    }
    } catch (error) {
      console.error('Failed to fetch puzzle:', error)
    } finally {
      setIsGenerating(false)
    }
  }, [gameState.difficulty, stats])

  // Check if there's an active game in progress
  const isGameActive = useCallback(() => {
    return gameState.hasStarted && !gameState.isComplete && !gameState.isViewMode && gameState.elapsedTime > 0
  }, [gameState.hasStarted, gameState.isComplete, gameState.isViewMode, gameState.elapsedTime])

  // Generate share text
  const getShareText = useCallback(() => {
    if (!gameState.isComplete || !gameState.difficulty) return ""
    
    const puzzleNum = getPuzzleNumber(gameState.puzzleDate ?? todayKey())
    const time = formatTime(gameState.elapsedTime)
    const difficultyEmoji = gameState.difficulty === 'easy' ? '🟢' : gameState.difficulty === 'medium' ? '🟡' : '🔴'
    const diffStats = stats[gameState.difficulty]
    
    return `Daily Tridoku #${puzzleNum} ${difficultyEmoji}\n⏱️ ${time}\n🔥 Streak: ${diffStats.currentStreak}\n\nPlay at: ${typeof window !== 'undefined' ? window.location.href : ''}`
  }, [gameState.isComplete, gameState.elapsedTime, gameState.difficulty, gameState.puzzleDate, stats])

  // Load a puzzle (fetches from pre-generated puzzles)
  const generateNewPuzzle = useCallback(async (difficulty?: Difficulty, customDate?: Date) => {
    const targetDifficulty = difficulty || gameState.difficulty || 'medium'
    setIsGenerating(true)
    
  try {
    // Fetch the daily puzzle from pre-generated puzzles
    const dailyPuzzle = await getDailyPuzzle(customDate, targetDifficulty)
    console.log(`[useTridoku] Loaded ${dailyPuzzle.difficulty} puzzle for ${dailyPuzzle.date}`)

    // Track loading this difficulty (e.g. easy_loaded, medium_loaded, hard_loaded)
    trackEvent(`${targetDifficulty}_loaded`)
    
    const puzzleHash = getPuzzleHash(dailyPuzzle.puzzle)
    const puzzleCells = loadPuzzle(dailyPuzzle.puzzle)
    
    // Check for saved in-progress game, validating against today's puzzle hash
    const savedProgress = loadGameProgress(targetDifficulty, puzzleHash)
    if (savedProgress) {
      for (const uc of savedProgress.userCells) {
        const cell = puzzleCells[uc.row][uc.col]
        if (!cell.hidden && !cell.isGiven) {
          puzzleCells[uc.row][uc.col] = { ...cell, value: uc.value, pencilMarks: uc.pencilMarks }
        }
      }
      const validatedCells = validateBoard(puzzleCells)
      setGameState({
        cells: validatedCells,
        selectedCellId: null,
        isComplete: false,
        isPaused: false,
        elapsedTime: savedProgress.elapsedTime,
        showErrors: false,
        difficulty: targetDifficulty,
        hasStarted: true,
        isViewMode: false,
        inputMode: savedProgress.inputMode,
        puzzleHash,
        puzzleDate: dailyPuzzle.date,
        highlightedValue: null,
      })
    } else {
      setGameState({
        cells: puzzleCells,
        selectedCellId: null,
        isComplete: false,
        isPaused: false,
        elapsedTime: 0,
        showErrors: false,
        difficulty: targetDifficulty,
        hasStarted: true,
        isViewMode: false,
        inputMode: 'pen',
        puzzleHash,
        puzzleDate: dailyPuzzle.date,
        highlightedValue: null,
      })
    }
  } catch (error) {
    console.error('Failed to fetch puzzle:', error)
    // Fall back to example puzzle on error
    setGameState(prev => ({
      ...prev,
      cells: loadPuzzle(EXAMPLE_PUZZLE),
      selectedCellId: null,
      isComplete: false,
      elapsedTime: 0,
      showErrors: false,
      difficulty: 'medium',
      hasStarted: true,
      isViewMode: false,
      inputMode: 'pen',
      puzzleHash: EXAMPLE_PUZZLE,
      puzzleDate: todayKey(),
      highlightedValue: null,
    }))
    } finally {
      setIsGenerating(false)
    }
  }, [gameState.difficulty])

  // Reset puzzle
  const resetPuzzle = useCallback(() => {
    if (gameState.difficulty) {
      // Resetting an in-progress, incomplete puzzle counts as abandoning it
      const current = gameStateRef.current
      if (current.hasStarted && !current.isComplete && !current.isViewMode) {
        trackEvent(`${gameState.difficulty}_abandoned`, {
          reason: "reset",
          time: current.elapsedTime,
        })
      }
      clearGameProgress(gameState.difficulty)
      generateNewPuzzle(gameState.difficulty)
    }
  }, [gameState.difficulty, generateNewPuzzle])

  return {
    cells: gameState.cells,
    selectedCellId: gameState.selectedCellId,
    isComplete: gameState.isComplete,
    isPaused: gameState.isPaused,
    elapsedTime: gameState.elapsedTime,
    showErrors: gameState.showErrors,
    difficulty: gameState.difficulty,
    hasStarted: gameState.hasStarted,
    isViewMode: gameState.isViewMode,
    inputMode: gameState.inputMode,
    highlightedValue: gameState.highlightedValue,
    puzzleDate: gameState.puzzleDate,
    puzzleNumber: getPuzzleNumber(gameState.puzzleDate ?? todayKey()),
    stats,
    isLoading,
    isGenerating,
    selectCell,
    setValue,
    clearCell,
    toggleErrors,
    togglePause,
    resetPuzzle,
    getShareText,
    generateNewPuzzle,
    changeDifficulty,
    isGameActive,
    setInputMode,
  }
}

// Helper function to convert board to string
function boardToString(cells: Cell[][]): string {
  let result = ''
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 17; col++) {
      const cell = cells[row][col]
      if (cell.hidden) continue
      result += cell.value || '0'
    }
  }
  return result
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

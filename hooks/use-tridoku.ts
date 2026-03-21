"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  Cell, 
  CellId,
  TRIDOKU_BOARD,
  getPuzzleNumber,
  loadPuzzle,
  validateBoard,
  isPuzzleComplete,
  EXAMPLE_PUZZLE,
  TEST_NEARLY_SOLVED,
  Difficulty,
  createEmptyBoard,
  InputMode
} from "@/lib/tridoku"
import { getDailyPuzzle } from "@/lib/puzzle-service"

export interface DifficultyStats {
  gamesPlayed: number
  gamesWon: number
  currentStreak: number
  maxStreak: number
  bestTime: number | null
  lastPlayedDate: string | null
  completedToday: boolean
  todaysPuzzle?: string
  todaysTime?: number
}

export interface GameStats {
  easy: DifficultyStats
  medium: DifficultyStats
  hard: DifficultyStats
}

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
}

const STORAGE_KEY = "tridoku-game-state"
const STATS_KEY = "tridoku-stats"

function getDefaultDifficultyStats(): DifficultyStats {
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    bestTime: null,
    lastPlayedDate: null,
    completedToday: false,
  }
}

function getStoredStats(): GameStats {
  if (typeof window === "undefined") {
    return {
      easy: getDefaultDifficultyStats(),
      medium: getDefaultDifficultyStats(),
      hard: getDefaultDifficultyStats(),
    }
  }
  const stored = localStorage.getItem(STATS_KEY)
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      // Migrate old stats format
      if ('gamesPlayed' in parsed && !('easy' in parsed)) {
        return {
          easy: getDefaultDifficultyStats(),
          medium: parsed,
          hard: getDefaultDifficultyStats(),
        }
      }
      // Ensure completedToday is reset for new day
      const today = getTodayString()
      Object.keys(parsed).forEach(key => {
        const diff = key as Difficulty
        if (parsed[diff].lastPlayedDate !== today) {
          parsed[diff].completedToday = false
        }
      })
      return parsed
    } catch (e) {
      console.error('Failed to parse stats:', e)
    }
  }
  return {
    easy: getDefaultDifficultyStats(),
    medium: getDefaultDifficultyStats(),
    hard: getDefaultDifficultyStats(),
  }
}

function saveStats(stats: GameStats) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats))
  }
}

function getTodayString(): string {
  const today = new Date()
  return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`
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
  })
  const [stats, setStats] = useState<GameStats>({
    easy: getDefaultDifficultyStats(),
    medium: getDefaultDifficultyStats(),
    hard: getDefaultDifficultyStats(),
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)

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

  // Handle puzzle completion
  useEffect(() => {
    if (!gameState.isComplete || !gameState.difficulty) return
    
    // Update stats for the current difficulty
    const today = getTodayString()
    const difficulty = gameState.difficulty
    const diffStats = stats[difficulty]
    
    // Check if this is a new win for this difficulty (not already counted today)
    if (diffStats.completedToday) return
    
    const newDiffStats = { ...diffStats }
    newDiffStats.gamesPlayed = (newDiffStats.gamesPlayed || 0) + 1
    newDiffStats.gamesWon = (newDiffStats.gamesWon || 0) + 1
    newDiffStats.completedToday = true
    
    // Update streak
    if (diffStats.lastPlayedDate) {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = `${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()}`
      
      if (diffStats.lastPlayedDate === yesterdayStr) {
        newDiffStats.currentStreak = (diffStats.currentStreak || 0) + 1
      } else {
        newDiffStats.currentStreak = 1
      }
    } else {
      newDiffStats.currentStreak = 1
    }
    
    newDiffStats.maxStreak = Math.max(newDiffStats.maxStreak || 0, newDiffStats.currentStreak)
    
    // Update best time
    if (!newDiffStats.bestTime || gameState.elapsedTime < newDiffStats.bestTime) {
      newDiffStats.bestTime = gameState.elapsedTime
    }
    
    newDiffStats.lastPlayedDate = today
    
    // Store the completed puzzle and time
    newDiffStats.todaysPuzzle = boardToString(gameState.cells)
    newDiffStats.todaysTime = gameState.elapsedTime
    
    const newStats = { ...stats, [difficulty]: newDiffStats }
    setStats(newStats)
    saveStats(newStats)
  }, [gameState.isComplete, gameState.elapsedTime, gameState.difficulty, gameState.cells, stats])

  // Select a cell by CellId
  const selectCell = useCallback((cellId: CellId | null) => {
    if (gameState.isViewMode) return
    setGameState(prev => ({ ...prev, selectedCellId: cellId }))
  }, [gameState.isViewMode])

  // Set value on the selected cell
  const setValue = useCallback((value: number) => {
    if (gameState.isViewMode) return
    setGameState(prev => {
      if (!prev.selectedCellId) return prev
      const [rowStr, colStr] = prev.selectedCellId.split("-")
      const row = parseInt(rowStr)
      const col = parseInt(colStr)
      const cell = prev.cells[row][col]
      if (cell.hidden || cell.isGiven) return prev

      if (prev.inputMode === 'pen') {
        // Pen mode: set the actual value (hides pencil marks)
        const updatedCells = prev.cells.map((r, ri) =>
          ri === row
            ? r.map((c, ci) => (ci === col ? { ...c, value } : c))
            : r
        )
        const validatedCells = validateBoard(updatedCells)
        const isComplete = isPuzzleComplete(validatedCells)
        
        return { ...prev, cells: validatedCells, isComplete }
      } else {
        // Pencil mode: toggle pencil mark (max 3)
        const currentMarks = cell.pencilMarks || []
        let newMarks: number[]
        
        if (currentMarks.includes(value)) {
          // Remove the mark if it exists
          newMarks = currentMarks.filter(m => m !== value)
        } else if (currentMarks.length < 3) {
          // Add the mark if we have room (max 3)
          newMarks = [...currentMarks, value].sort((a, b) => a - b)
        } else {
          // Already at max 3 marks, don't add more
          return prev
        }
        
        const updatedCells = prev.cells.map((r, ri) =>
          ri === row
            ? r.map((c, ci) => (ci === col ? { ...c, pencilMarks: newMarks } : c))
            : r
        )
        
        return { ...prev, cells: updatedCells }
      }
    })
  }, [gameState.isViewMode])

  // Clear the selected cell (only clears pen value, not pencil marks)
  const clearCell = useCallback(() => {
    if (gameState.isViewMode) return
    setGameState(prev => {
      if (!prev.selectedCellId) return prev
      const [rowStr, colStr] = prev.selectedCellId.split("-")
      const row = parseInt(rowStr)
      const col = parseInt(colStr)
      const cell = prev.cells[row][col]
      if (cell.hidden || cell.isGiven) return prev
      // Only clear if there's a value to clear
      if (cell.value === null) return prev

      const updatedCells = prev.cells.map((r, ri) =>
        ri === row
          ? r.map((c, ci) => (ci === col ? { ...c, value: null } : c))
          : r
      )
      return { ...prev, cells: validateBoard(updatedCells) }
    })
  }, [gameState.isViewMode])

  // Set input mode (pen or pencil)
  const setInputMode = useCallback((mode: InputMode) => {
    setGameState(prev => ({ ...prev, inputMode: mode }))
  }, [])

  // Toggle error highlighting
  const toggleErrors = useCallback(() => {
    setGameState(prev => ({ ...prev, showErrors: !prev.showErrors }))
  }, [])

  // Toggle pause
  const togglePause = useCallback(() => {
    setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }))
  }, [])

  // Reset puzzle
  const resetPuzzle = useCallback(() => {
    if (gameState.difficulty) {
      generateNewPuzzle(gameState.difficulty)
    }
  }, [gameState.difficulty])
  
  // Change difficulty
  const changeDifficulty = useCallback(async (difficulty: Difficulty) => {
    if (difficulty === gameState.difficulty) return
    setIsGenerating(true)
    
    try {
      const diffStats = stats[difficulty]
      
      // Check if this difficulty was already completed today
      if (diffStats.completedToday && diffStats.todaysPuzzle && diffStats.todaysTime !== undefined) {
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
        })
      } else {
        // Load new puzzle
        const dailyPuzzle = await getDailyPuzzle(undefined, difficulty)
        const puzzleCells = loadPuzzle(dailyPuzzle.puzzle)
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
        })
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

  // Load nearly-solved puzzle for testing
  const loadTestSolve = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      cells: loadPuzzle(TEST_NEARLY_SOLVED),
      selectedCellId: null,
      isComplete: false,
      showErrors: false,
    }))
  }, [])

  // Generate share text
  const getShareText = useCallback(() => {
    if (!gameState.isComplete || !gameState.difficulty) return ""
    
    const puzzleNum = getPuzzleNumber()
    const time = formatTime(gameState.elapsedTime)
    const difficultyEmoji = gameState.difficulty === 'easy' ? '🟢' : gameState.difficulty === 'medium' ? '🟡' : '🔴'
    const diffStats = stats[gameState.difficulty]
    
    return `Daily Tridoku #${puzzleNum} ${difficultyEmoji}\n⏱️ ${time}\n🔥 Streak: ${diffStats.currentStreak}\n\nPlay at: ${typeof window !== 'undefined' ? window.location.href : ''}`
  }, [gameState.isComplete, gameState.elapsedTime, gameState.difficulty, stats])

  // Load a puzzle (fetches from pre-generated puzzles)
  const generateNewPuzzle = useCallback(async (difficulty?: Difficulty, customDate?: Date) => {
    const targetDifficulty = difficulty || gameState.difficulty || 'medium'
    setIsGenerating(true)
    
    try {
      // Fetch the daily puzzle from pre-generated puzzles
      const dailyPuzzle = await getDailyPuzzle(customDate, targetDifficulty)
      console.log(`[useTridoku] Loaded ${dailyPuzzle.difficulty} puzzle for ${dailyPuzzle.date}`)
      
      const puzzleCells = loadPuzzle(dailyPuzzle.puzzle)
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
      })
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
      }))
    } finally {
      setIsGenerating(false)
    }
  }, [gameState.difficulty])

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
    stats,
    isLoading,
    isGenerating,
    selectCell,
    setValue,
    clearCell,
    toggleErrors,
    togglePause,
    resetPuzzle,
    loadTestSolve,
    getShareText,
    generateNewPuzzle,
    changeDifficulty,
    isGameActive,
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

"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { 
  Cell, 
  CellId,
  getPuzzleNumber,
  loadPuzzle,
  validateBoard,
  isPuzzleComplete,
  Difficulty,
  createEmptyBoard
} from "@/lib/tridoku"
import { getDailyPuzzle, PuzzleLoadError, type DailyPuzzle } from "@/lib/puzzle-service"
import { trackEvent } from "@/lib/analytics"
import { bumpCounter, getCounters } from "@/lib/play-counters"
import { normalizeDateKey, todayKey, type DateKey } from "@/lib/dates"
import { defaultStats, normalizeStats, recordStart, recordWin, type GameStats } from "@/lib/stats"
import { buildShareText } from "@/lib/share"
import { watchDateChange } from "@/lib/date-watch"

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
  fallback: DailyPuzzle["fallback"] | null // Set when today's puzzle wasn't available (TRI-010)
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
  savedAt?: number // ms timestamp, to resume the most recent puzzle (TRI-033)
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
    savedAt: Date.now(),
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

export interface PuzzleInProgress {
  elapsedTime: number
  savedAt: number
}

/** Puzzles started today and not finished, by difficulty (TRI-033). */
function getTodaysProgress(): Partial<Record<Difficulty, PuzzleInProgress>> {
  if (typeof window === "undefined") return {}
  try {
    const all: SavedProgressByDifficulty = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")
    const out: Partial<Record<Difficulty, PuzzleInProgress>> = {}
    for (const d of ["easy", "medium", "hard"] as const) {
      const p = all[d]
      if (p && normalizeDateKey(p.date) === todayKey() && p.userCells.some((c) => c.value != null || c.pencilMarks.length)) {
        out[d] = { elapsedTime: p.elapsedTime, savedAt: p.savedAt ?? 0 }
      }
    }
    return out
  } catch {
    return {}
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

/** Share of the empty cells the player has filled, 0–100. */
function percentFilled(cells: Cell[][]): number {
  let open = 0
  let filled = 0
  for (const row of cells) for (const c of row) {
    if (c.hidden || c.isGiven) continue
    open++
    if (c.value != null) filled++
  }
  return open ? Math.round((filled / open) * 100) : 0
}

/** Whether the player has opened the rules on this browser (set in components/tridoku-game.tsx). */
function hasSeenRules(): boolean {
  try {
    return localStorage.getItem("tridoku-rules-seen") === "true"
  } catch {
    return false
  }
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
    fallback: null,
    highlightedValue: null,
  })
  const [stats, setStats] = useState<GameStats>(defaultStats)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  // Difficulty whose puzzle failed to load, if any (TRI-011)
  const [loadError, setLoadError] = useState<Difficulty | null>(null)
  // Puzzles in progress today, read once on load for the welcome screen (TRI-033)
  const [progressToday, setProgressToday] = useState<Partial<Record<Difficulty, PuzzleInProgress>>>({})
  // Today's Easy puzzle, shown as a preview on the welcome screen (TRI-026)
  const [previewPuzzle, setPreviewPuzzle] = useState<string | null>(null)

  // Keep a ref to the latest game state so callbacks always have current data
  const gameStateRef = useRef(gameState)
  useEffect(() => { gameStateRef.current = gameState }, [gameState])
  const statsRef = useRef(stats)
  useEffect(() => { statsRef.current = stats }, [stats])

  // TRI-017: when the page is hidden with an unfinished puzzle, record where the player
  // stopped. Sent at most once per page load.
  const sessionEndSent = useRef(false)
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState !== "hidden" || sessionEndSent.current) return
      const g = gameStateRef.current
      if (!g.difficulty || !g.hasStarted || g.isComplete || g.isViewMode) return
      const pct = percentFilled(g.cells)
      if (pct === 0) return
      sessionEndSent.current = true
      trackEvent("session_end", { difficulty: g.difficulty, pct_filled: pct, time: g.elapsedTime })
    }
    document.addEventListener("visibilitychange", onHide)
    return () => document.removeEventListener("visibilitychange", onHide)
  }, [])

  // Load stats and today's in-progress puzzles on mount (client-side only)
  useEffect(() => {
    const loadedStats = getStoredStats()
    setStats(loadedStats)
    setProgressToday(getTodaysProgress())
    setIsLoading(false)
  }, [])

  // A tab left open past midnight: re-derive "completed today" and in-progress badges (TRI-086)
  useEffect(
    () =>
      watchDateChange((today) => {
        setStats((prev) => normalizeStats(prev, today))
        setProgressToday(getTodaysProgress())
      }),
    [],
  )

  // Fetch today's Easy puzzle for the welcome-screen preview. Failures just hide it.
  useEffect(() => {
    getDailyPuzzle(undefined, "easy")
      .then((p) => setPreviewPuzzle(p.puzzle))
      .catch(() => {})
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
    setProgressToday(getTodaysProgress())
    
    // Record the win against the puzzle's own date (TRI-006). recordWin returns null
    // if this puzzle was already counted, e.g. when reopening it in view mode.
    const difficulty = gameState.difficulty
    const counters = getCounters(difficulty, gameState.puzzleDate ?? todayKey())
    const newDiffStats = recordWin(stats[difficulty], {
      puzzleDate: gameState.puzzleDate ?? todayKey(),
      today: todayKey(),
      time: gameState.elapsedTime,
      solvedBoard: boardToString(gameState.cells),
      regionErrors: counters.regionErrors,
    })
    if (!newDiffStats) return

    // Track puzzle completion (e.g. easy_completed, medium_completed, hard_completed)
    trackEvent(`${difficulty}_completed`, {
      difficulty,
      time: gameState.elapsedTime,
      errors: counters.errors,
      pencil_marks: counters.notes,
      resets: counters.resets,
    })

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

  // Count the puzzle as played on its first entry (TRI-007) and record the start (TRI-016)
  const markStarted = useCallback(() => {
    const { difficulty, puzzleDate, isViewMode, selectedCellId, cells } = gameStateRef.current
    if (!difficulty || !puzzleDate || isViewMode || !selectedCellId) return
    const [row, col] = selectedCellId.split("-").map(Number)
    if (cells[row]?.[col]?.isGiven) return
    const next = recordStart(statsRef.current[difficulty], puzzleDate)
    if (!next) return
    const all = { ...statsRef.current, [difficulty]: next }
    statsRef.current = all
    setStats(all)
    saveStats(all)
    trackEvent("puzzle_started", {
      difficulty,
      ms_since_load: Math.round(performance.now()),
      rules_seen: hasSeenRules(),
    })
  }, [])

  // Count wrong entries and notes for the completion event (TRI-019)
  const countEntry = useCallback((value: number) => {
    const { difficulty, puzzleDate, selectedCellId, cells, inputMode, isViewMode } = gameStateRef.current
    if (!difficulty || !puzzleDate || !selectedCellId || isViewMode) return
    const [row, col] = selectedCellId.split("-").map(Number)
    const cell = cells[row]?.[col]
    if (!cell || cell.hidden || cell.isGiven) return
    if (inputMode === "pencil") {
      if (!cell.pencilMarks.includes(value)) bumpCounter(difficulty, puzzleDate, "notes")
      return
    }
    if (cell.value === value) return
    const after = validateBoard(cells.map((r, ri) => (ri === row ? r.map((c, ci) => (ci === col ? { ...c, value } : c)) : r)))
    if (after[row][col].hasError) bumpCounter(difficulty, puzzleDate, "errors", cell.boldedRegion)
  }, [])

  // Set value on the selected cell (pen mode) or toggle pencil mark (pencil mode)
  const setValue = useCallback((value: number) => {
    if (gameState.isViewMode) return
    markStarted()
    countEntry(value)
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
  }, [gameState.isViewMode, markStarted, countEntry])

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

  // Load today's puzzle for a difficulty: the solved board in view mode if it's already
  // done today (unless `showSolved` is false), otherwise the puzzle plus any saved progress.
  // On a download failure, keep the current screen and show an error with Retry (TRI-011).
  const loadDifficulty = useCallback(async (difficulty: Difficulty, { showSolved = true } = {}) => {
    setIsGenerating(true)
    setLoadError(null)
    try {
      const diffStats = stats[difficulty]
      // Compare dates rather than completedToday so a tab left open past midnight
      // doesn't reopen yesterday's board.
      if (showSolved && diffStats.lastPlayedDate === todayKey() && diffStats.todaysPuzzle && diffStats.todaysTime !== undefined) {
        setGameState({
          cells: loadPuzzle(diffStats.todaysPuzzle),
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
          fallback: null,
          highlightedValue: null,
        })
        return
      }

      const dailyPuzzle = await getDailyPuzzle(undefined, difficulty)
      const puzzleHash = getPuzzleHash(dailyPuzzle.puzzle)
      const puzzleCells = loadPuzzle(dailyPuzzle.puzzle)
      if (dailyPuzzle.fallback) {
        trackEvent("puzzle_fallback_served", { difficulty, source: dailyPuzzle.fallback.sourceDate ?? "backup" })
      }

      // Restore saved progress for this exact puzzle, if any
      const savedProgress = loadGameProgress(difficulty, puzzleHash)
      if (savedProgress) {
        for (const uc of savedProgress.userCells) {
          const cell = puzzleCells[uc.row][uc.col]
          if (!cell.hidden && !cell.isGiven) {
            puzzleCells[uc.row][uc.col] = { ...cell, value: uc.value, pencilMarks: uc.pencilMarks }
          }
        }
      }

      setGameState({
        cells: savedProgress ? validateBoard(puzzleCells) : puzzleCells,
        selectedCellId: null,
        isComplete: false,
        isPaused: false,
        elapsedTime: savedProgress?.elapsedTime ?? 0,
        showErrors: false,
        difficulty,
        hasStarted: true,
        isViewMode: false,
        inputMode: savedProgress?.inputMode ?? 'pen',
        puzzleHash,
        puzzleDate: dailyPuzzle.date,
        fallback: dailyPuzzle.fallback ?? null,
        highlightedValue: null,
      })
    } catch (error) {
      console.error('Failed to fetch puzzle:', error)
      setLoadError(difficulty)
      trackEvent("puzzle_load_failed", {
        difficulty,
        reason: error instanceof PuzzleLoadError ? error.message : "unknown",
      })
    } finally {
      setIsGenerating(false)
    }
  }, [stats])

  // Switch to a difficulty (from the welcome screen or the difficulty tabs)
  const changeDifficulty = useCallback(async (difficulty: Difficulty) => {
    if (difficulty === gameStateRef.current.difficulty && !loadError) return

    // Save current game progress before switching
    const current = gameStateRef.current
    if (current.hasStarted && !current.isComplete && current.difficulty) {
      saveGameProgress(current)
      setProgressToday(getTodaysProgress()) // keep the tab badges current
      // Leaving an in-progress puzzle to switch difficulty counts as abandoning it
      if (!current.isViewMode && current.difficulty !== difficulty) {
        trackEvent(`${current.difficulty}_abandoned`, {
          difficulty: current.difficulty,
          reason: "switch_difficulty",
          time: current.elapsedTime,
          pct_filled: percentFilled(current.cells),
        })
      }
    }

    // Track loading this difficulty (e.g. easy_loaded, medium_loaded, hard_loaded)
    trackEvent(`${difficulty}_loaded`)
    await loadDifficulty(difficulty)
  }, [loadDifficulty, loadError])

  // Returning players go straight back to the puzzle they were last playing (TRI-033)
  const resumed = useRef(false)
  useEffect(() => {
    if (isLoading || resumed.current) return
    resumed.current = true
    const latest = (Object.entries(progressToday) as [Difficulty, PuzzleInProgress][])
      .sort((a, b) => b[1].savedAt - a[1].savedAt)[0]
    if (latest) changeDifficulty(latest[0])
  }, [isLoading, progressToday, changeDifficulty])

  // Reload a difficulty's puzzle, ignoring a solved board (used by Reset and dev tools)
  const generateNewPuzzle = useCallback(async (difficulty?: Difficulty) => {
    const targetDifficulty = difficulty || gameStateRef.current.difficulty || 'medium'
    await loadDifficulty(targetDifficulty, { showSolved: false })
  }, [loadDifficulty])

  // Try the last failed load again
  const retryLoad = useCallback(() => {
    if (loadError) loadDifficulty(loadError)
  }, [loadError, loadDifficulty])

  // Check if there's an active game in progress
  const isGameActive = useCallback(() => {
    return gameState.hasStarted && !gameState.isComplete && !gameState.isViewMode && gameState.elapsedTime > 0
  }, [gameState.hasStarted, gameState.isComplete, gameState.isViewMode, gameState.elapsedTime])

  // Share text: result, spoiler-free region grid and an attributed link (lib/share.ts)
  const getShareText = useCallback(() => {
    if (!gameState.isComplete || !gameState.difficulty) return ""
    const diffStats = stats[gameState.difficulty]
    return buildShareText({
      puzzleNumber: getPuzzleNumber(gameState.puzzleDate ?? todayKey()),
      difficulty: gameState.difficulty,
      time: gameState.elapsedTime,
      streak: diffStats.currentStreak,
      regionErrors: diffStats.todaysRegionErrors,
    })
  }, [gameState.isComplete, gameState.elapsedTime, gameState.difficulty, gameState.puzzleDate, stats])

  // Reset puzzle
  const resetPuzzle = useCallback(() => {
    if (gameState.difficulty) {
      // Resetting an in-progress, incomplete puzzle counts as abandoning it
      const current = gameStateRef.current
      if (current.hasStarted && !current.isComplete && !current.isViewMode) {
        trackEvent(`${gameState.difficulty}_abandoned`, {
          difficulty: gameState.difficulty,
          reason: "reset",
          time: current.elapsedTime,
          pct_filled: percentFilled(current.cells),
        })
        if (current.puzzleDate) bumpCounter(gameState.difficulty, current.puzzleDate, "resets")
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
    fallback: gameState.fallback,
    progressToday,
    previewPuzzle,
    loadError,
    retryLoad,
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

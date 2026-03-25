"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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
  createEmptyBoard
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
  selectedDate: Date
}

function getDateString(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
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

interface SavedProgress {
  date: string
  elapsedTime: number
  inputMode: InputMode
  userCells: { row: number; col: number; value: number | null; pencilMarks: number[] }[]
}

type SavedProgressByDifficulty = Partial<Record<Difficulty, SavedProgress>>

// Storage format: { "2026-3-24-medium": SavedProgress, ... }
type SavedProgressByDateAndDifficulty = Record<string, SavedProgress>

function getProgressKey(date: Date, difficulty: Difficulty): string {
  return `${getDateString(date)}-${difficulty}`
}

function saveGameProgress(gameState: GameState) {
  if (typeof window === "undefined" || !gameState.difficulty) return
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
  let allProgress: SavedProgressByDateAndDifficulty = {}
  if (stored) {
    try { allProgress = JSON.parse(stored) } catch { /* ignore */ }
  }
  const key = getProgressKey(gameState.selectedDate, gameState.difficulty)
  allProgress[key] = {
    date: getDateString(gameState.selectedDate),
    elapsedTime: gameState.elapsedTime,
    inputMode: gameState.inputMode,
    userCells,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allProgress))
}

function loadGameProgress(date: Date, difficulty: Difficulty): SavedProgress | null {
  if (typeof window === "undefined") return null
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return null
  try {
    const allProgress: SavedProgressByDateAndDifficulty = JSON.parse(stored)
    const key = getProgressKey(date, difficulty)
    const progress = allProgress[key]
    if (!progress || progress.date !== getDateString(date)) return null
    return progress
  } catch {
    return null
  }
}

function clearGameProgress(date: Date, difficulty: Difficulty) {
  if (typeof window === "undefined") return
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return
  try {
    const allProgress: SavedProgressByDateAndDifficulty = JSON.parse(stored)
    const key = getProgressKey(date, difficulty)
    delete allProgress[key]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allProgress))
  } catch { /* ignore */ }
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
    selectedDate: new Date(),
  })
  const [stats, setStats] = useState<GameStats>({
    easy: getDefaultDifficultyStats(),
    medium: getDefaultDifficultyStats(),
    hard: getDefaultDifficultyStats(),
  })
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

  // Derived state: is archive mode (playing a past date's puzzle)
  const isArchiveMode = !isSameDay(gameState.selectedDate, new Date())

  // Handle puzzle completion
  useEffect(() => {
    if (!gameState.isComplete || !gameState.difficulty) return
    
    // Enter view mode immediately
    if (!gameState.isViewMode) {
      setGameState(prev => ({ ...prev, isViewMode: true, selectedCellId: null }))
    }
    
    // Clear in-progress save for this date+difficulty
    clearGameProgress(gameState.selectedDate, gameState.difficulty)
    
    // Only update stats for today's puzzle, not archive puzzles
    if (isArchiveMode) return
    
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

  // Set value on the selected cell (pen mode) or toggle pencil mark (pencil mode)
  const setValue = useCallback((value: number) => {
    if (gameState.isViewMode) return
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
  }, [gameState.isViewMode])

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
    setGameState(prev => ({ ...prev, showErrors: !prev.showErrors }))
  }, [])

  // Toggle pause
  const togglePause = useCallback(() => {
    setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }))
  }, [])

  // Reset puzzle
  const resetPuzzle = useCallback(() => {
    if (gameState.difficulty) {
      clearGameProgress(gameState.selectedDate, gameState.difficulty)
      generateNewPuzzle(gameState.difficulty, gameState.selectedDate)
    }
  }, [gameState.difficulty, gameState.selectedDate])
  
  // Change difficulty (and optionally date)
  const changeDifficulty = useCallback(async (difficulty: Difficulty, date?: Date) => {
    const targetDate = date || gameState.selectedDate
    const isToday = isSameDay(targetDate, new Date())
    
    // Don't reload if same difficulty and same date
    if (difficulty === gameState.difficulty && isSameDay(targetDate, gameState.selectedDate)) return
    
    // Save current game progress before switching
    const current = gameStateRef.current
    if (current.hasStarted && !current.isComplete && current.difficulty) {
      saveGameProgress(current)
    }
    
    setIsGenerating(true)
    
    try {
      const diffStats = stats[difficulty]
      
      // Check if this difficulty was already completed today (only for today's puzzle)
      if (isToday && diffStats.completedToday && diffStats.todaysPuzzle && diffStats.todaysTime !== undefined) {
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
          selectedDate: targetDate,
        })
      } else {
        // Check for saved in-progress game
        const savedProgress = loadGameProgress(targetDate, difficulty)
        const dailyPuzzle = await getDailyPuzzle(targetDate, difficulty)
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
            selectedDate: targetDate,
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
            selectedDate: targetDate,
          })
        }
      }
    } catch (error) {
      console.error('Failed to fetch puzzle:', error)
    } finally {
      setIsGenerating(false)
    }
  }, [gameState.difficulty, gameState.selectedDate, stats])

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
    const targetDate = customDate || gameState.selectedDate
    setIsGenerating(true)
    
    try {
      // Fetch the daily puzzle from pre-generated puzzles
      const dailyPuzzle = await getDailyPuzzle(targetDate, targetDifficulty)
      console.log(`[useTridoku] Loaded ${dailyPuzzle.difficulty} puzzle for ${dailyPuzzle.date}`)
      
      const puzzleCells = loadPuzzle(dailyPuzzle.puzzle)
      
      // Check for saved in-progress game
      const savedProgress = loadGameProgress(targetDate, targetDifficulty)
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
          selectedDate: targetDate,
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
          selectedDate: targetDate,
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
        selectedDate: targetDate,
      }))
    } finally {
      setIsGenerating(false)
    }
  }, [gameState.difficulty, gameState.selectedDate])

  // Go to today's puzzle
  const goToToday = useCallback(() => {
    const today = new Date()
    if (isSameDay(gameState.selectedDate, today)) return
    
    // Use current difficulty or default to medium
    const diff = gameState.difficulty || 'medium'
    changeDifficulty(diff, today)
  }, [gameState.selectedDate, gameState.difficulty, changeDifficulty])

  // Load puzzle for a specific date
  const loadPuzzleForDate = useCallback((date: Date) => {
    // Use current difficulty or default to medium
    const diff = gameState.difficulty || 'medium'
    changeDifficulty(diff, date)
  }, [gameState.difficulty, changeDifficulty])

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
    selectedDate: gameState.selectedDate,
    isArchiveMode,
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
    setInputMode,
    goToToday,
    loadPuzzleForDate,
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

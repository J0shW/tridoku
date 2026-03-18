"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  Cell, 
  CellId,
  TRIDOKU_BOARD,
  getPuzzleNumber
} from "@/lib/tridoku"

export interface GameStats {
  gamesPlayed: number
  gamesWon: number
  currentStreak: number
  maxStreak: number
  bestTime: number | null
  lastPlayedDate: string | null
}

interface GameState {
  cells: Cell[][]
  selectedCellId: CellId | null
  isComplete: boolean
  isPaused: boolean
  elapsedTime: number
  showErrors: boolean
}

const STORAGE_KEY = "tridoku-game-state"
const STATS_KEY = "tridoku-stats"

function getStoredStats(): GameStats {
  if (typeof window === "undefined") {
    return {
      gamesPlayed: 0,
      gamesWon: 0,
      currentStreak: 0,
      maxStreak: 0,
      bestTime: null,
      lastPlayedDate: null,
    }
  }
  const stored = localStorage.getItem(STATS_KEY)
  if (stored) {
    return JSON.parse(stored)
  }
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    bestTime: null,
    lastPlayedDate: null,
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
    cells: TRIDOKU_BOARD,
    selectedCellId: null,
    isComplete: false,
    isPaused: false,
    elapsedTime: 0,
    showErrors: false,
  })
  const [stats, setStats] = useState<GameStats>({
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    bestTime: null,
    lastPlayedDate: null,
  })
  const [isLoading, setIsLoading] = useState(true)

  // Load stats on mount (client-side only)
  useEffect(() => {
    const loadedStats = getStoredStats()
    setStats(loadedStats)
    setIsLoading(false)
  }, [])

  // Timer
  useEffect(() => {
    if (gameState.isComplete || gameState.isPaused) return

    const interval = setInterval(() => {
      setGameState(prev => ({ ...prev, elapsedTime: prev.elapsedTime + 1 }))
    }, 1000)

    return () => clearInterval(interval)
  }, [gameState.isComplete, gameState.isPaused])

  // Select a cell by CellId
  const selectCell = useCallback((cellId: CellId | null) => {
    setGameState(prev => ({ ...prev, selectedCellId: cellId }))
  }, [])

  // Set value on the selected cell
  const setValue = useCallback((value: number) => {
    setGameState(prev => {
      if (!prev.selectedCellId) return prev
      const [rowStr, colStr] = prev.selectedCellId.split("-")
      const row = parseInt(rowStr)
      const col = parseInt(colStr)
      const cell = prev.cells[row][col]
      if (cell.hidden || cell.isGiven) return prev

      const newCells = prev.cells.map((r, ri) =>
        ri === row
          ? r.map((c, ci) => (ci === col ? { ...c, value } : c))
          : r
      )
      return { ...prev, cells: newCells }
    })
  }, [])

  // Clear the selected cell
  const clearCell = useCallback(() => {
    setGameState(prev => {
      if (!prev.selectedCellId) return prev
      const [rowStr, colStr] = prev.selectedCellId.split("-")
      const row = parseInt(rowStr)
      const col = parseInt(colStr)
      const cell = prev.cells[row][col]
      if (cell.hidden || cell.isGiven) return prev

      const newCells = prev.cells.map((r, ri) =>
        ri === row
          ? r.map((c, ci) => (ci === col ? { ...c, value: null } : c))
          : r
      )
      return { ...prev, cells: newCells }
    })
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
    setGameState(prev => ({
      ...prev,
      cells: TRIDOKU_BOARD,
      selectedCellId: null,
      isComplete: false,
      elapsedTime: 0,
      showErrors: false,
    }))
  }, [])

  // Generate share text
  const getShareText = useCallback(() => {
    if (!gameState.isComplete) return ""
    
    const puzzleNum = getPuzzleNumber()
    const time = formatTime(gameState.elapsedTime)
    
    return `Daily Tridoku #${puzzleNum}\n⏱️ ${time}\n🔥 Streak: ${stats.currentStreak}\n\nPlay at: ${typeof window !== 'undefined' ? window.location.href : ''}`
  }, [gameState.isComplete, gameState.elapsedTime, stats.currentStreak])

  return {
    cells: gameState.cells,
    selectedCellId: gameState.selectedCellId,
    isComplete: gameState.isComplete,
    isPaused: gameState.isPaused,
    elapsedTime: gameState.elapsedTime,
    showErrors: gameState.showErrors,
    stats,
    isLoading,
    selectCell,
    setValue,
    clearCell,
    toggleErrors,
    togglePause,
    resetPuzzle,
    getShareText,
  }
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

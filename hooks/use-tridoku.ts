"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  Cell, 
  TridokuPuzzle, 
  generateDailyPuzzle, 
  validateSolution, 
  checkCellConflicts,
  getPuzzleNumber,
  getDailySeed
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
  cells: Cell[]
  solution: number[]
  selectedCell: number | null
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
  const [gameState, setGameState] = useState<GameState | null>(null)
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
  }, [])

  // Initialize or load game
  useEffect(() => {
    try {
      const todaySeed = getDailySeed()
      const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
      
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          // Check if it's the same day's puzzle
          if (parsed.seed === todaySeed) {
            setGameState(parsed.state)
            setIsLoading(false)
            return
          }
        } catch (e) {
          console.log("[v0] Failed to parse stored game state:", e)
        }
      }

      // Generate new puzzle
      console.log("[v0] Generating new puzzle...")
      const puzzle = generateDailyPuzzle()
      console.log("[v0] Puzzle generated with", puzzle.cells.length, "cells")
      
      setGameState({
        cells: puzzle.cells,
        solution: puzzle.solution,
        selectedCell: null,
        isComplete: false,
        isPaused: false,
        elapsedTime: 0,
        showErrors: false,
      })
      setIsLoading(false)
    } catch (error) {
      console.error("[v0] Error initializing game:", error)
      setIsLoading(false)
    }
  }, [])

  // Save game state whenever it changes
  useEffect(() => {
    if (gameState && !isLoading) {
      const todaySeed = getDailySeed()
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        seed: todaySeed,
        state: gameState,
      }))
    }
  }, [gameState, isLoading])

  // Timer
  useEffect(() => {
    if (!gameState || gameState.isComplete || gameState.isPaused) return

    const interval = setInterval(() => {
      setGameState(prev => {
        if (!prev) return prev
        return { ...prev, elapsedTime: prev.elapsedTime + 1 }
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [gameState?.isComplete, gameState?.isPaused])

  // Select a cell
  const selectCell = useCallback((cellId: number | null) => {
    setGameState(prev => {
      if (!prev) return prev
      return {
        ...prev,
        selectedCell: cellId,
        cells: prev.cells.map(cell => ({
          ...cell,
          isSelected: cell.id === cellId,
        })),
      }
    })
  }, [])

  // Set a value in the selected cell
  const setValue = useCallback((value: number | null) => {
    setGameState(prev => {
      if (!prev || prev.selectedCell === null || prev.isComplete) return prev

      const cell = prev.cells[prev.selectedCell]
      if (cell.isGiven) return prev

      const newCells = prev.cells.map(c => {
        if (c.id === prev.selectedCell) {
          return { ...c, value, hasError: false }
        }
        return c
      })

      // Check for conflicts if showErrors is enabled
      if (prev.showErrors && value !== null) {
        const hasConflict = checkCellConflicts(newCells, prev.selectedCell)
        if (hasConflict) {
          newCells[prev.selectedCell] = { ...newCells[prev.selectedCell], hasError: true }
        }
      }

      // Check if puzzle is complete
      const { isComplete, errors } = validateSolution(newCells, prev.solution)

      if (isComplete) {
        // Update stats
        const today = getTodayString()
        const newStats = { ...stats }
        newStats.gamesPlayed++
        newStats.gamesWon++
        
        if (newStats.lastPlayedDate === today) {
          // Already played today, don't update streak
        } else {
          const yesterday = new Date()
          yesterday.setDate(yesterday.getDate() - 1)
          const yesterdayStr = `${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()}`
          
          if (newStats.lastPlayedDate === yesterdayStr) {
            newStats.currentStreak++
          } else {
            newStats.currentStreak = 1
          }
          
          newStats.maxStreak = Math.max(newStats.maxStreak, newStats.currentStreak)
          newStats.lastPlayedDate = today
        }

        if (!newStats.bestTime || prev.elapsedTime < newStats.bestTime) {
          newStats.bestTime = prev.elapsedTime
        }

        setStats(newStats)
        saveStats(newStats)
      }

      return {
        ...prev,
        cells: newCells,
        isComplete,
      }
    })
  }, [stats])

  // Clear the selected cell
  const clearCell = useCallback(() => {
    setValue(null)
  }, [setValue])

  // Toggle error highlighting
  const toggleErrors = useCallback(() => {
    setGameState(prev => {
      if (!prev) return prev

      const showErrors = !prev.showErrors
      
      // Update error states for all cells
      const newCells = prev.cells.map(cell => {
        if (!showErrors || cell.value === null) {
          return { ...cell, hasError: false }
        }
        const hasConflict = checkCellConflicts(prev.cells, cell.id)
        return { ...cell, hasError: hasConflict }
      })

      return { ...prev, showErrors, cells: newCells }
    })
  }, [])

  // Toggle pause
  const togglePause = useCallback(() => {
    setGameState(prev => {
      if (!prev) return prev
      return { ...prev, isPaused: !prev.isPaused }
    })
  }, [])

  // Reset today's puzzle
  const resetPuzzle = useCallback(() => {
    const puzzle = generateDailyPuzzle()
    setGameState({
      cells: puzzle.cells,
      solution: puzzle.solution,
      selectedCell: null,
      isComplete: false,
      isPaused: false,
      elapsedTime: 0,
      showErrors: false,
    })
  }, [])

  // Generate share text
  const getShareText = useCallback(() => {
    if (!gameState?.isComplete) return ""
    
    const puzzleNum = getPuzzleNumber()
    const time = formatTime(gameState.elapsedTime)
    
    return `Daily Tridoku #${puzzleNum}\n⏱️ ${time}\n🔥 Streak: ${stats.currentStreak}\n\nPlay at: ${typeof window !== 'undefined' ? window.location.href : ''}`
  }, [gameState?.isComplete, gameState?.elapsedTime, stats.currentStreak])

  console.log("[v0] useTridoku state:", { isLoading, hasGameState: !!gameState, cellCount: gameState?.cells.length })

  return {
    cells: gameState?.cells ?? [],
    solution: gameState?.solution ?? [],
    selectedCell: gameState?.selectedCell ?? null,
    isComplete: gameState?.isComplete ?? false,
    isPaused: gameState?.isPaused ?? false,
    elapsedTime: gameState?.elapsedTime ?? 0,
    showErrors: gameState?.showErrors ?? false,
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

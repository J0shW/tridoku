"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  Cell, 
  TridokuPuzzle,
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
      // TRY LOAD GAME
      setIsLoading(false)
    } catch (error) {
      console.error("[v0] Error initializing game:", error)
      setIsLoading(false)
    }
  }, [])

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

  // Toggle pause
  const togglePause = useCallback(() => {
    setGameState(prev => {
      if (!prev) return prev
      return { ...prev, isPaused: !prev.isPaused }
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
    togglePause,
    getShareText,
  }
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

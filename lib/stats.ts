// Player statistics: pure functions so streak and win-rate rules can be unit-tested.
// Stored in localStorage under "tridoku-stats" (see hooks/use-tridoku.ts).

import { daysBetween, normalizeDateKey, type DateKey } from "@/lib/dates"
import type { Difficulty } from "@/lib/tridoku"

export const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"]

export interface DifficultyStats {
  /** Puzzles started (first digit or note), counted once per puzzle. */
  gamesPlayed: number
  gamesWon: number
  currentStreak: number
  maxStreak: number
  bestTime: number | null
  /** Date of the last puzzle solved. */
  lastPlayedDate: DateKey | null
  /** Date of the last puzzle started (counted in gamesPlayed). */
  lastStartedDate?: DateKey | null
  /** Derived on load: lastPlayedDate is today. */
  completedToday: boolean
  /** Solved board and time for lastPlayedDate, shown in view mode. */
  todaysPuzzle?: string
  todaysTime?: number
}

export type GameStats = Record<Difficulty, DifficultyStats>

export function defaultDifficultyStats(): DifficultyStats {
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    bestTime: null,
    lastPlayedDate: null,
    lastStartedDate: null,
    completedToday: false,
  }
}

export function defaultStats(): GameStats {
  return { easy: defaultDifficultyStats(), medium: defaultDifficultyStats(), hard: defaultDifficultyStats() }
}

function num(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function normalizeDifficulty(raw: unknown, today: DateKey): DifficultyStats {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>
  const lastPlayedDate = normalizeDateKey(r.lastPlayedDate as string)
  const gamesWon = num(r.gamesWon)
  const stats: DifficultyStats = {
    gamesWon,
    // Older saves only counted wins, so played can't be lower than won.
    gamesPlayed: Math.max(num(r.gamesPlayed), gamesWon),
    currentStreak: num(r.currentStreak),
    maxStreak: num(r.maxStreak),
    bestTime: typeof r.bestTime === "number" ? r.bestTime : null,
    lastPlayedDate,
    lastStartedDate: normalizeDateKey(r.lastStartedDate as string),
    completedToday: lastPlayedDate === today,
  }
  // A streak is broken once a full day has passed with no solve.
  if (!lastPlayedDate || daysBetween(lastPlayedDate, today) > 1) stats.currentStreak = 0
  if (typeof r.todaysPuzzle === "string") stats.todaysPuzzle = r.todaysPuzzle
  if (typeof r.todaysTime === "number") stats.todaysTime = r.todaysTime
  return stats
}

/** Reads stored stats of any past format and brings them up to date for `today`. */
export function normalizeStats(raw: unknown, today: DateKey): GameStats {
  if (!raw || typeof raw !== "object") return defaultStats()
  const r = raw as Record<string, unknown>
  // The first format stored a single difficulty's stats at the top level (it was Medium).
  if ("gamesPlayed" in r && !("easy" in r)) {
    return { easy: defaultDifficultyStats(), medium: normalizeDifficulty(r, today), hard: defaultDifficultyStats() }
  }
  return {
    easy: normalizeDifficulty(r.easy, today),
    medium: normalizeDifficulty(r.medium, today),
    hard: normalizeDifficulty(r.hard, today),
  }
}

/** Counts a puzzle as played on its first entry. Returns null if it was already counted. */
export function recordStart(stats: DifficultyStats, puzzleDate: DateKey): DifficultyStats | null {
  if (stats.lastStartedDate === puzzleDate || stats.lastPlayedDate === puzzleDate) return null
  return { ...stats, gamesPlayed: stats.gamesPlayed + 1, lastStartedDate: puzzleDate }
}

interface Win {
  /** Date of the puzzle that was solved (not the clock time when it was finished). */
  puzzleDate: DateKey
  today: DateKey
  time: number
  solvedBoard: string
}

/** Records a solve. Returns null if this puzzle was already counted. */
export function recordWin(stats: DifficultyStats, { puzzleDate, today, time, solvedBoard }: Win): DifficultyStats | null {
  const gap = stats.lastPlayedDate ? daysBetween(stats.lastPlayedDate, puzzleDate) : null
  if (gap !== null && gap <= 0) return null

  const currentStreak = gap === 1 ? stats.currentStreak + 1 : 1
  return {
    ...stats,
    // A puzzle started before this counting existed still needs counting as played.
    gamesPlayed: stats.lastStartedDate === puzzleDate ? stats.gamesPlayed : stats.gamesPlayed + 1,
    gamesWon: stats.gamesWon + 1,
    currentStreak,
    maxStreak: Math.max(stats.maxStreak, currentStreak),
    bestTime: stats.bestTime == null ? time : Math.min(stats.bestTime, time),
    lastPlayedDate: puzzleDate,
    lastStartedDate: puzzleDate,
    completedToday: puzzleDate === today,
    todaysPuzzle: solvedBoard,
    todaysTime: time,
  }
}

export function winRate(stats: DifficultyStats): number {
  return stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0
}

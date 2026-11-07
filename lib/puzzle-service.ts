// Puzzle fetch service - loads pre-generated puzzles from JSON files in public/puzzles/.
//
// What players get, in order of preference:
// 1. The puzzle for their local date.
// 2. If that date is missing (the daily Action fell behind), the most recent published
//    puzzle, credited to today so streaks survive (TRI-010).
// 3. If no published puzzle can be found at all, a built-in backup puzzle (TRI-009).
// A network or server failure throws PuzzleLoadError so the app can offer Retry (TRI-011).

import { IS_PRODUCTION, PRODUCTION_ORIGIN } from "@/lib/app-env"
import { toDateKey, type DateKey } from "@/lib/dates"

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface DailyPuzzle {
  /** The day this puzzle is played as (today's date, even when a fallback is served). */
  date: DateKey
  difficulty: string
  seed: number
  puzzle: string
  solution?: string
  metadata: {
    generatedAt: string
    generationTime?: number
    givens: number
  }
  /** Set when today's puzzle wasn't available and something else is served instead. */
  fallback?: {
    /** Date of the published puzzle being reused, or null for the built-in backup. */
    sourceDate: DateKey | null
  }
}

interface DailyPuzzleSet {
  easy: DailyPuzzle
  medium: DailyPuzzle
  hard: DailyPuzzle
}

interface PuzzleCache {
  [date: string]: DailyPuzzleSet
}

/** The puzzles couldn't be downloaded (offline, server error). Safe to retry. */
export class PuzzleLoadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PuzzleLoadError"
  }
}

/**
 * Built-in backups, used only when no published puzzle can be found. Taken from
 * 29 Oct 2026, whose puzzles grade at the right difficulty (Easy: singles only;
 * Medium and Hard: power-cell eliminations). tests/fallback-puzzles.test.ts checks
 * each has exactly one solution.
 */
export const BACKUP_PUZZLES: Record<Difficulty, string> = {
  easy: '005030248040190500362004017004060200405090509501307360180007690002001700069051060',
  medium: '015200900050360053002001602060007020004090001007020910002002940701700203470000260',
  hard: '000379040060009200805040020340008100060020004009892000013900002000067300004107100',
}

const cacheByYear = new Map<number, PuzzleCache>()

/** Loads a year's puzzles. A missing file (404) is an empty year, not an error. */
async function fetchPuzzlesForYear(year: number, origin = ""): Promise<PuzzleCache> {
  let response: Response
  try {
    response = await fetch(`${origin}/puzzles/${year}.json`)
  } catch {
    throw new PuzzleLoadError(`Couldn't reach the server for ${year} puzzles`)
  }
  if (response.status === 404) return {}
  if (!response.ok) throw new PuzzleLoadError(`Server returned ${response.status} for ${year} puzzles`)
  try {
    return await response.json()
  } catch {
    throw new PuzzleLoadError(`The ${year} puzzle file is unreadable`)
  }
}

async function loadYear(year: number): Promise<PuzzleCache> {
  const cached = cacheByYear.get(year)
  if (cached) return cached
  const puzzles = await fetchPuzzlesForYear(year)
  cacheByYear.set(year, puzzles)
  return puzzles
}

/** Most recent published puzzle before `dateStr`, looking back into last year if needed. */
async function mostRecentBefore(dateStr: DateKey, year: number, difficulty: Difficulty) {
  for (const y of [year, year - 1]) {
    let puzzles: PuzzleCache
    try {
      puzzles = await loadYear(y)
    } catch {
      continue
    }
    const date = Object.keys(puzzles)
      .filter((d) => d < dateStr && puzzles[d]?.[difficulty])
      .sort()
      .at(-1)
    if (date) return puzzles[date][difficulty]
  }
  return null
}

/**
 * Get the puzzle for a date (default: today) and difficulty.
 * Throws PuzzleLoadError if today's puzzles can't be downloaded.
 */
export async function getDailyPuzzle(date?: Date, difficulty: Difficulty = 'medium'): Promise<DailyPuzzle> {
  const targetDate = date || new Date()
  const year = targetDate.getFullYear()
  const dateStr = toDateKey(targetDate)

  const puzzles = await loadYear(year)

  // Preview and dev builds only have the puzzles that existed when their branch was
  // created. For newer dates, borrow production's file so previews never fall back.
  if (!puzzles[dateStr] && !IS_PRODUCTION) {
    try {
      const production = await fetchPuzzlesForYear(year, PRODUCTION_ORIGIN)
      for (const [d, set] of Object.entries(production)) puzzles[d] ??= set
      console.log(`[PuzzleService] Filled missing dates from production puzzles`)
    } catch (error) {
      console.warn('[PuzzleService] Could not fetch production puzzles:', error)
    }
  }

  const todays = puzzles[dateStr]?.[difficulty]
  if (todays) return todays

  console.warn(`[PuzzleService] No ${difficulty} puzzle for ${dateStr}, using a fallback`)
  const recent = await mostRecentBefore(dateStr, year, difficulty)
  if (recent) {
    return { ...recent, date: dateStr, fallback: { sourceDate: recent.date } }
  }

  const backup = BACKUP_PUZZLES[difficulty]
  return {
    date: dateStr,
    difficulty,
    seed: 0,
    puzzle: backup,
    metadata: { generatedAt: '2026-10-29T00:00:00Z', givens: [...backup].filter((c) => c !== '0').length },
    fallback: { sourceDate: null },
  }
}

/**
 * Preload puzzles for better performance
 */
export async function preloadPuzzles(year: number): Promise<void> {
  await loadYear(year)
}

/**
 * Clear the puzzle cache (useful for testing or year transitions)
 */
export function clearCache(): void {
  cacheByYear.clear()
}

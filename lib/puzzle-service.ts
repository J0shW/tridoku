// Puzzle fetch service - loads pre-generated puzzles from JSON files

import { IS_PRODUCTION, PRODUCTION_ORIGIN } from "@/lib/app-env"
import { toDateKey } from "@/lib/dates"

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface DailyPuzzle {
  date: string
  difficulty: string
  seed: number
  puzzle: string
  solution?: string
  metadata: {
    generatedAt: string
    generationTime?: number
    givens: number
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

let puzzleCache: PuzzleCache | null = null
let cacheLoadedYear: number | null = null

/**
 * Fetch puzzles for a given year
 */
async function fetchPuzzlesForYear(year: number, origin = ""): Promise<PuzzleCache> {
  const response = await fetch(`${origin}/puzzles/${year}.json`)
  if (!response.ok) {
    throw new Error(`Failed to fetch puzzles for ${year}`)
  }
  return await response.json()
}

/**
 * Get the puzzle for a specific date and difficulty
 * Fetches and caches the year's puzzles on first call
 */
export async function getDailyPuzzle(date?: Date, difficulty: Difficulty = 'medium'): Promise<DailyPuzzle> {
  const targetDate = date || new Date()
  const year = targetDate.getFullYear()
  const dateStr = toDateKey(targetDate)

  // Clear cache if year changed (e.g., played past midnight into new year)
  // or if cache is from a different year than requested
  if (puzzleCache && cacheLoadedYear !== year) {
    console.log(`[PuzzleService] Year changed from ${cacheLoadedYear} to ${year}, clearing cache`)
    puzzleCache = null
    cacheLoadedYear = null
  }

  // Fetch and cache puzzles if not already loaded
  if (!puzzleCache) {
    console.log(`[PuzzleService] Fetching puzzles for ${year}...`)
    puzzleCache = await fetchPuzzlesForYear(year)
    cacheLoadedYear = year
    console.log(`[PuzzleService] Loaded ${Object.keys(puzzleCache).length} puzzle sets`)
  }

  // Preview and dev builds only have the puzzles that existed when their branch was
  // created. For newer dates, borrow production's file so previews never fall back.
  if (!puzzleCache[dateStr] && !IS_PRODUCTION) {
    try {
      const production = await fetchPuzzlesForYear(year, PRODUCTION_ORIGIN)
      puzzleCache = { ...production, ...puzzleCache }
      console.log(`[PuzzleService] Filled missing dates from production puzzles`)
    } catch (error) {
      console.warn('[PuzzleService] Could not fetch production puzzles:', error)
    }
  }

  const puzzleSet = puzzleCache[dateStr]
  
  if (!puzzleSet || !puzzleSet[difficulty]) {
    // Fallback to a default puzzle if date not found
    console.warn(`[PuzzleService] No ${difficulty} puzzle found for ${dateStr}, using fallback`)
    return {
      date: dateStr,
      difficulty,
      seed: parseInt(dateStr.replace(/-/g, '')),
      puzzle: '6004020800030721001000050000020008030600500300708005370010065400010400060040200030',
      metadata: {
        generatedAt: new Date().toISOString(),
        givens: 40
      }
    }
  }

  return puzzleSet[difficulty]
}

/**
 * Preload puzzles for better performance
 */
export async function preloadPuzzles(year: number): Promise<void> {
  puzzleCache = await fetchPuzzlesForYear(year)
}

/**
 * Clear the puzzle cache (useful for testing or year transitions)
 */
export function clearCache(): void {
  puzzleCache = null
  cacheLoadedYear = null
}

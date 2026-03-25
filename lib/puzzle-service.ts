// Puzzle fetch service - loads pre-generated puzzles from JSON files

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

// Cache by year to support archive puzzles
const puzzleCacheByYear: { [year: number]: PuzzleCache } = {}

/**
 * Fetch puzzles for a given year
 */
async function fetchPuzzlesForYear(year: number): Promise<PuzzleCache> {
  const response = await fetch(`/puzzles/${year}.json`)
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
  const month = String(targetDate.getMonth() + 1).padStart(2, '0')
  const day = String(targetDate.getDate()).padStart(2, '0')
  const dateStr = `${year}-${month}-${day}`

  // Fetch and cache puzzles for this year if not already loaded
  if (!puzzleCacheByYear[year]) {
    console.log(`[PuzzleService] Fetching puzzles for ${year}...`)
    puzzleCacheByYear[year] = await fetchPuzzlesForYear(year)
    console.log(`[PuzzleService] Loaded ${Object.keys(puzzleCacheByYear[year]).length} puzzle sets for ${year}`)
  }

  const puzzleSet = puzzleCacheByYear[year][dateStr]
  
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
  if (!puzzleCacheByYear[year]) {
    puzzleCacheByYear[year] = await fetchPuzzlesForYear(year)
  }
}

/**
 * Clear the puzzle cache (useful for testing or year transitions)
 */
export function clearCache(): void {
  Object.keys(puzzleCacheByYear).forEach(key => {
    delete puzzleCacheByYear[Number(key)]
  })
}

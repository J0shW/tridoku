// Puzzle fetch service - loads pre-generated puzzles from JSON files

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

interface PuzzleCache {
  [date: string]: DailyPuzzle
}

let puzzleCache: PuzzleCache | null = null

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
 * Get the puzzle for a specific date
 * Fetches and caches the year's puzzles on first call
 */
export async function getDailyPuzzle(date?: Date): Promise<DailyPuzzle> {
  const targetDate = date || new Date()
  const year = targetDate.getFullYear()
  const month = String(targetDate.getMonth() + 1).padStart(2, '0')
  const day = String(targetDate.getDate()).padStart(2, '0')
  const dateStr = `${year}-${month}-${day}`

  // Fetch and cache puzzles if not already loaded
  if (!puzzleCache) {
    console.log(`[PuzzleService] Fetching puzzles for ${year}...`)
    puzzleCache = await fetchPuzzlesForYear(year)
    console.log(`[PuzzleService] Loaded ${Object.keys(puzzleCache).length} puzzles`)
  }

  const puzzle = puzzleCache[dateStr]
  
  if (!puzzle) {
    // Fallback to a default puzzle if date not found
    console.warn(`[PuzzleService] No puzzle found for ${dateStr}, using fallback`)
    return {
      date: dateStr,
      difficulty: 'medium',
      seed: parseInt(dateStr.replace(/-/g, '')),
      puzzle: '6004020800030721001000050000020008030600500300708005370010065400010400060040200030',
      metadata: {
        generatedAt: new Date().toISOString(),
        givens: 40
      }
    }
  }

  return puzzle
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
}

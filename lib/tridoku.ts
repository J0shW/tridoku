// Tridoku puzzle generator and validator
// Uses a simplified triangular grid structure

export interface Cell {
  id: number
  value: number | null
  isGiven: boolean
  isSelected: boolean
  hasError: boolean
  row: number
  col: number
  region: number
  isEdge: boolean
  isInnerEdge: boolean
  colorCategory: 'outer' | 'intersection' | 'inner' | 'white'
}

export interface TridokuPuzzle {
  cells: Cell[]
  solution: number[]
}

// Seeded random number generator for daily puzzles
class SeededRandom {
  private seed: number

  constructor(seed: number) {
    this.seed = seed
  }

  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff
    return this.seed / 0x7fffffff
  }

  shuffle<T>(array: T[]): T[] {
    const result = [...array]
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1))
      ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
  }
}

// Get date-based seed for daily puzzle
export function getDailySeed(): number {
  const today = new Date()
  const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`
  let hash = 0
  for (let i = 0; i < dateString.length; i++) {
    const char = dateString.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

// Tridoku grid structure - triangular grid with alternating up/down triangles
// Row n (0-indexed) has (2n + 1) triangular cells
// Row 0: 1 cell, Row 1: 3 cells, Row 2: 5 cells, ..., Row 8: 17 cells
// Total cells = 1 + 3 + 5 + 7 + 9 + 11 + 13 + 15 + 17 = 81 cells

const GRID_SIZE = 9
const TOTAL_CELLS = 81 // Sum of odd numbers from 1 to 17

// Helper to get cell index from row and col
function getCellIndex(row: number, col: number): number {
  if (row < 0 || row >= GRID_SIZE) return -1
  const colsInRow = 2 * row + 1
  if (col < 0 || col >= colsInRow) return -1
  // Sum of cells in all previous rows + current col
  return row * row + col
}

// Helper to get row and col from cell index
function getRowCol(index: number): { row: number; col: number } {
  const row = Math.floor(Math.sqrt(index))
  const col = index - row * row
  return { row, col }
}

// Define regions (nonets) for the triangular grid
// The triangle is divided into 9 smaller triangular regions
function getRegion(row: number, col: number): number {
  // Normalize column position to center (0 = center of row)
  const colsInRow = 2 * row + 1
  const centerCol = row // middle column index
  const relCol = col - centerCol // -row to +row
  
  // Divide vertically into 3 bands (top, middle, bottom)
  // and horizontally into 3 sections (left, center, right)
  const vertBand = row < 3 ? 0 : row < 6 ? 1 : 2
  
  // Horizontal section based on relative column position
  const thirdWidth = Math.max(1, Math.floor(colsInRow / 3))
  const horizSection = relCol < -thirdWidth ? 0 : relCol > thirdWidth ? 2 : 1
  
  return vertBand * 3 + horizSection
}

// Check if cell is on outer edge of the main triangle
function isOuterEdge(row: number, col: number): boolean {
  const colsInRow = 2 * row + 1
  // Bottom edge (last row)
  if (row === GRID_SIZE - 1) return true
  // Left edge (first upward triangle of each row)
  if (col === 0) return true
  // Right edge (last upward triangle of each row)
  if (col === colsInRow - 1) return true
  return false
}

// Determine the color category for visual display.
//
// The inner triangle is an inverted (downward-pointing) triangle whose:
//   - Top-left vertex  : row 5, col 0  (touches outer left edge)
//   - Top-right vertex : row 5, col 10 (touches outer right edge)
//   - Bottom vertex    : row 8, col 8  (center of the bottom row)
//
// ALL CELLS WITHIN this triangle region are colored 'inner' (light orange).
// The boundary converges as:
//   - Row 5: cols 0-10 (full width)
//   - Row 6: cols 2-8  (shrinks by 1 on each side)
//   - Row 7: cols 4-6  (shrinks by 1 on each side)
//   - Row 8: col 8     (single center cell)
//
// The three corner intersection cells (where the inner triangle corners
// touch/overlap the outer edge) get the medium-orange 'intersection' color.
//
// Returns: 'outer' | 'intersection' | 'inner' | 'white'
export function getCellColorCategory(row: number, col: number): 'outer' | 'intersection' | 'inner' | 'white' {
  const colsInRow = 2 * row + 1

  // ── Outer edge special handling ────────────────────────────────────────────
  if (isOuterEdge(row, col)) {
    // The three inner-triangle corners that land on the outer edge get 'intersection'
    const isInnerCorner =
      (row === 5 && col === 0) ||
      (row === 5 && col === colsInRow - 1) ||
      (row === 8 && col === 8)
    return isInnerCorner ? 'intersection' : 'outer'
  }

  // ── Inside the inverted triangle region ────────────────────────────────────
  // Entire row 5 is the top of the inverted triangle
  if (row === 5) return 'inner'

  // Rows 6-8: fill region between left and right slopes
  if (row >= 6 && row <= 8) {
    const distFromTop = row - 5 // 1, 2, or 3
    
    // Left boundary: col = distFromTop * 2
    // Right boundary: col = 10 - distFromTop * 2
    const leftBound = distFromTop * 2
    const rightBound = 10 - distFromTop * 2
    
    // Cell is inside if col is between bounds (inclusive)
    if (col >= leftBound && col <= rightBound) {
      return 'inner'
    }
  }

  return 'white'
}

// Check if cell is on inner triangle edge (for visual styling)
function isInnerTriangleEdge(row: number, col: number): boolean {
  // Mark cells at region boundaries for visual distinction
  const region = getRegion(row, col)
  // Check if neighboring cells are in different regions
  return region !== getRegion(row, col - 1) || region !== getRegion(row, col + 1)
}

// Get all neighbors of a cell (cells that share an edge or vertex)
function getNeighbors(cellIndex: number, row: number, col: number): number[] {
  const neighbors: number[] = []
  const isUpward = col % 2 === 0
  
  // Same row neighbors (always exist if valid)
  const leftIdx = getCellIndex(row, col - 1)
  const rightIdx = getCellIndex(row, col + 1)
  if (leftIdx >= 0) neighbors.push(leftIdx)
  if (rightIdx >= 0) neighbors.push(rightIdx)
  
  if (isUpward) {
    // Upward triangle touches one cell in row below
    const belowIdx = getCellIndex(row + 1, col + 1)
    if (belowIdx >= 0) neighbors.push(belowIdx)
    // Also touches cells in row above at corners
    const aboveLeftIdx = getCellIndex(row - 1, col - 2)
    const aboveRightIdx = getCellIndex(row - 1, col)
    if (aboveLeftIdx >= 0) neighbors.push(aboveLeftIdx)
    if (aboveRightIdx >= 0) neighbors.push(aboveRightIdx)
  } else {
    // Downward triangle touches one cell in row above
    const aboveIdx = getCellIndex(row - 1, col - 1)
    if (aboveIdx >= 0) neighbors.push(aboveIdx)
    // Also touches cells in row below at corners
    const belowLeftIdx = getCellIndex(row + 1, col)
    const belowRightIdx = getCellIndex(row + 1, col + 2)
    if (belowLeftIdx >= 0) neighbors.push(belowLeftIdx)
    if (belowRightIdx >= 0) neighbors.push(belowRightIdx)
  }

  return neighbors
}

// Validate if a value can be placed at a cell
function isValidPlacement(
  grid: (number | null)[],
  cellIndex: number,
  value: number,
  row: number,
  col: number
): boolean {
  // Check neighbors (no touching same numbers)
  const neighbors = getNeighbors(cellIndex, row, col)
  for (const neighborIdx of neighbors) {
    if (grid[neighborIdx] === value) return false
  }

  // Check region - all cells in same region must have unique values
  const cellRegion = getRegion(row, col)
  for (let r = 0; r < GRID_SIZE; r++) {
    const colsInRow = 2 * r + 1
    for (let c = 0; c < colsInRow; c++) {
      const idx = getCellIndex(r, c)
      if (idx !== cellIndex && getRegion(r, c) === cellRegion) {
        if (grid[idx] === value) return false
      }
    }
  }

  return true
}

// ---------------------------------------------------------------------------
// HARDCODED PUZZLE (puzzle generation temporarily disabled)
// 81 values corresponding to cell indices 0-80 (row*row + col)
// null = player must fill in; number = given clue
// ---------------------------------------------------------------------------

// Full solution for the hardcoded puzzle
const HARDCODED_SOLUTION: number[] = [
  // Row 0 (1 cell)
  5,
  // Row 1 (3 cells)
  3, 8, 1,
  // Row 2 (5 cells)
  7, 2, 4, 6, 9,
  // Row 3 (7 cells)
  1, 5, 9, 3, 7, 2, 4,
  // Row 4 (9 cells)
  6, 4, 2, 8, 1, 5, 3, 9, 7,
  // Row 5 (11 cells)
  9, 7, 6, 1, 4, 2, 8, 3, 5, 1, 6,
  // Row 6 (13 cells)
  2, 3, 5, 7, 9, 1, 4, 6, 8, 2, 7, 3, 5,
  // Row 7 (15 cells)
  8, 1, 4, 2, 6, 3, 5, 7, 9, 4, 1, 8, 2, 6, 3,
  // Row 8 (17 cells)
  4, 9, 7, 5, 2, 8, 1, 4, 6, 3, 9, 7, 5, 2, 8, 1, 6,
]

// Which cell indices are revealed as clues (roughly 45% of 81 = ~37 cells)
const GIVEN_INDICES = new Set<number>([
  0,
  1, 3,
  5, 7, 9,
  10, 12, 14, 16,
  17, 19, 21, 23, 25,
  27, 29, 31, 33, 35, 37,
  39, 41, 43, 45, 47, 49, 51,
  54, 56, 58, 60, 62, 64, 66, 68,
  71, 73, 75, 77, 79,
])

// Main function to load the daily Tridoku puzzle
export function generateDailyPuzzle(_seed?: number): TridokuPuzzle {
  const cells: Cell[] = []

  for (let i = 0; i < TOTAL_CELLS; i++) {
    const { row, col } = getRowCol(i)
    const isGiven = GIVEN_INDICES.has(i)

    cells.push({
      id: i,
      value: isGiven ? HARDCODED_SOLUTION[i] : null,
      isGiven,
      isSelected: false,
      hasError: false,
      row,
      col,
      region: getRegion(row, col),
      isEdge: isOuterEdge(row, col),
      isInnerEdge: isInnerTriangleEdge(row, col),
      colorCategory: getCellColorCategory(row, col),
    })
  }

  return { cells, solution: HARDCODED_SOLUTION }
}

// Validate user's current solution
export function validateSolution(cells: Cell[], solution: number[]): { isComplete: boolean; errors: number[] } {
  const errors: number[] = []
  let isComplete = true

  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i]
    if (cell.value === null) {
      isComplete = false
    } else if (cell.value !== solution[i]) {
      errors.push(i)
    }
  }

  return { isComplete: isComplete && errors.length === 0, errors }
}

// Check if a specific cell value conflicts with neighbors
export function checkCellConflicts(cells: Cell[], cellIndex: number): boolean {
  const cell = cells[cellIndex]
  if (cell.value === null) return false

  const neighbors = getNeighbors(cellIndex, cell.row, cell.col)
  for (const neighborIdx of neighbors) {
    if (cells[neighborIdx]?.value === cell.value) {
      return true
    }
  }

  // Check region
  for (const otherCell of cells) {
    if (otherCell.id !== cellIndex && otherCell.region === cell.region && otherCell.value === cell.value) {
      return true
    }
  }

  return false
}

// Get puzzle number based on days since launch
export function getPuzzleNumber(): number {
  const launchDate = new Date('2026-01-01')
  const today = new Date()
  const diffTime = Math.abs(today.getTime() - launchDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

// Format time in mm:ss
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

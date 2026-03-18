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
  
  // Constraint regions (for validation)
  boldedRegion: number  // 0-8 (one of 9 bolded regions with 1-9 each)
  yellowSide: number | null  // 0=left side, 1=right side, 2=bottom side, null=not in any yellow side
  isInBlueTriangle: boolean  // true if cell is in the blue inverted triangle
  
  // Visual display (derived from constraint membership)
  colorCategory: 'yellow' | 'blue' | 'green' | 'white'
  
  // Legacy properties (kept for compatibility)
  region: number  // Same as boldedRegion
  isEdge: boolean
  isInnerEdge: boolean
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

// Determine which yellow side (if any) the cell belongs to
// Returns: 0=left side, 1=right side, 2=bottom side, null=not in yellow
function getYellowSide(row: number, col: number): number | null {
  const cellKey = `${row}-${col}`
  
  // LEFT SIDE (9 cells total): leftmost cells from top to bottom
  const leftSide = new Set([
    '0-0',   // Row 0: top
    '1-0',   // Row 1
    '2-0', '2-1',  // Row 2 (2 cells)
    '3-0',   // Row 3
    '4-0',   // Row 4
    '5-0',   // Row 5
    '6-0',   // Row 6
    '7-0',   // Row 7
  ])
  
  // RIGHT SIDE (9 cells total): rightmost cells from top to bottom
  const rightSide = new Set([
    '1-2',   // Row 1: top right
    '2-4',   // Row 2
    '3-6',   // Row 3
    '4-8',   // Row 4
    '5-10',  // Row 5
    '6-12',  // Row 6
    '7-14',  // Row 7
    '8-15', '8-16',  // Row 8 (2 cells on right corner)
  ])
  
  // BOTTOM SIDE (9 cells total): bottom row cells
  const bottomSide = new Set([
    '8-0', '8-2', '8-4', '8-6', '8-8', '8-10', '8-12', '8-14', '8-16',
  ])
  
  if (leftSide.has(cellKey)) return 0
  if (rightSide.has(cellKey)) return 1
  if (bottomSide.has(cellKey)) return 2
  return null
}

// Determine if cell is in the blue inverted triangle
function isInBlueTriangle(row: number, col: number): boolean {
  const cellKey = `${row}-${col}`
  
  // BLUE TRIANGLE (9 cells total): inverted triangle in center
  const blueTriangle = new Set([
    // Top edge (row 4): 5 cells
    '4-2', '4-3', '4-4', '4-5', '4-6',
    // Left corner (row 5): 1 cell
    '5-1',
    // Right corner (row 5): 1 cell  
    '5-9',
    // Bottom corners (row 8): 2 cells
    '8-7', '8-9',
  ])
  
  return blueTriangle.has(cellKey)
}

// Determine color category based on constraint membership
// GREEN = in both yellow and blue
// YELLOW = in yellow only
// BLUE = in blue only
// WHITE = in neither
function getCellColorCategory(row: number, col: number): 'yellow' | 'blue' | 'green' | 'white' {
  const yellowSide = getYellowSide(row, col)
  const inBlue = isInBlueTriangle(row, col)
  
  if (yellowSide !== null && inBlue) return 'green'  // Overlap
  if (yellowSide !== null) return 'yellow'
  if (inBlue) return 'blue'
  return 'white'
}

// Define regions (nonets) for the triangular grid
// Uses a systematic 3x3 approach: rows divided into 3 bands, columns into 3 sections
// Each region contains exactly 9 cells
function getRegion(row: number, col: number): number {
  // Vertical bands: 0-2 (top), 3-5 (middle), 6-8 (bottom)
  const vertBand = Math.floor(row / 3)
  
  // For horizontal subdivision, we need to consider the row width
  const colsInRow = 2 * row + 1
  
  // Divide columns into thirds
  let horizSection: number
  const leftBound = Math.floor(colsInRow / 3)
  const rightBound = Math.floor((colsInRow * 2) / 3)
  
  if (col <leftBound) {
    horizSection = 0  // Left third
  } else if (col < rightBound) {
    horizSection = 1  // Middle third
  } else {
    horizSection = 2  // Right third
  }
  
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

// Determine the color category for the reference Tridoku puzzle.
// Traced cell-by-cell from the reference image at Logic Masters.
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
// REFERENCE PUZZLE from Logic Masters (ID: 000DEM)
// 81 values corresponding to cell indices 0-80 (row*row + col)
// null = player must fill in; number = given clue
// ---------------------------------------------------------------------------

// Given clues from the reference puzzle
const REFERENCE_GIVEN_VALUES: (number | null)[] = [
  // Row 0 (1 cell): index 0
  6,
  // Row 1 (3 cells): indices 1-3
  null, 2, 4,
  // Row 2 (5 cells): indices 4-8
  null, 2, null, 8, null,
  // Row 3 (7 cells): indices 9-15
  null, null, 3, null, 7, 2, 1,
  // Row 4 (9 cells): indices 16-24
  null, 1, null, null, null, null, 5, null, null,
  // Row 5 (11 cells): indices 25-35
  null, 2, null, null, null, 3, null, null, 8, null, 3,
  // Row 6 (13 cells): indices 36-48
  6, null, null, 5, null, null, 3, null, null, 7, null, null, 8,
  // Row 7 (15 cells): indices 49-63
  null, 5, null, 3, null, 7, null, 1, null, null, 6, null, 5, null, 4,
  // Row 8 (17 cells): indices 64-80
  1, null, 4, null, null, null, 6, null, null, 4, null, 2, null, null, null, null, 3,
]

// Indices of given cells
const REFERENCE_GIVEN_INDICES = new Set<number>(
  REFERENCE_GIVEN_VALUES
    .map((val, idx) => val !== null ? idx : -1)
    .filter(idx => idx !== -1)
)

// Placeholder solution (to be filled by player)
// For now, we use the given values where available
const REFERENCE_SOLUTION: number[] = REFERENCE_GIVEN_VALUES.map((val, idx) => val ?? 1)

// Main function to load the reference Tridoku puzzle
export function generateDailyPuzzle(_seed?: number): TridokuPuzzle {
  const cells: Cell[] = []

  for (let i = 0; i < TOTAL_CELLS; i++) {
    const { row, col } = getRowCol(i)
    const isGiven = REFERENCE_GIVEN_INDICES.has(i)
    const yellowSide = getYellowSide(row, col)
    const inBlueTriangle = isInBlueTriangle(row, col)

    cells.push({
      id: i,
      value: isGiven ? REFERENCE_SOLUTION[i] : null,
      isGiven,
      isSelected: false,
      hasError: false,
      row,
      col,
      // Constraint regions
      boldedRegion: getRegion(row, col),
      yellowSide: yellowSide,
      isInBlueTriangle: inBlueTriangle,
      // Visual
      colorCategory: getCellColorCategory(row, col),
      // Legacy
      region: getRegion(row, col),
      isEdge: isOuterEdge(row, col),
      isInnerEdge: isInnerTriangleEdge(row, col),
    })
  }

  return { cells, solution: REFERENCE_SOLUTION }
}

// Validate user's current solution
// Validate the Tridoku puzzle according to all constraint rules
export function validateTridoku(cells: Cell[]): { isValid: boolean; errorCells: Set<number> } {
  const errorCells = new Set<number>()
  
  // Rule 1: Each bolded region must have 1-9 (no duplicates)
  for (let region = 0; region < 9; region++) {
    const regionCells = cells.filter(c => c.boldedRegion === region && c.value !== null)
    const values = new Map<number, number[]>()
    
    regionCells.forEach(cell => {
      if (cell.value !== null) {
        if (!values.has(cell.value)) {
          values.set(cell.value, [])
        }
        values.get(cell.value)!.push(cell.id)
      }
    })
    
    // Mark duplicates as errors
    values.forEach((cellIds, value) => {
      if (cellIds.length > 1) {
        cellIds.forEach(id => errorCells.add(id))
      }
    })
  }
  
  // Rule 2: Each yellow side must have 1-9 (no duplicates)
  for (let side = 0; side < 3; side++) {
    const sideCells = cells.filter(c => c.yellowSide === side && c.value !== null)
    const values = new Map<number, number[]>()
    
    sideCells.forEach(cell => {
      if (cell.value !== null) {
        if (!values.has(cell.value)) {
          values.set(cell.value, [])
        }
        values.get(cell.value)!.push(cell.id)
      }
    })
    
    // Mark duplicates as errors
    values.forEach((cellIds, value) => {
      if (cellIds.length > 1) {
        cellIds.forEach(id => errorCells.add(id))
      }
    })
  }
  
  // Rule 3: Blue triangle must have 1-9 (no duplicates)
  const blueCells = cells.filter(c => c.isInBlueTriangle && c.value !== null)
  const blueValues = new Map<number, number[]>()
  
  blueCells.forEach(cell => {
    if (cell.value !== null) {
      if (!blueValues.has(cell.value)) {
        blueValues.set(cell.value, [])
      }
      blueValues.get(cell.value)!.push(cell.id)
    }
  })
  
  // Mark duplicates as errors
  blueValues.forEach((cellIds, value) => {
    if (cellIds.length > 1) {
      cellIds.forEach(id => errorCells.add(id))
    }
  })
  
  // Rule 4: No two same digits may touch (even at a point)
  cells.forEach(cell => {
    if (cell.value === null) return
    
    const neighbors = getNeighbors(cell.id, cell.row, cell.col)
    neighbors.forEach(neighborIdx => {
      if (neighborIdx >= 0 && neighborIdx < cells.length) {
        const neighbor = cells[neighborIdx]
        if (neighbor.value === cell.value) {
          errorCells.add(cell.id)
          errorCells.add(neighborIdx)
        }
      }
    })
  })
  
  return {
    isValid: errorCells.size === 0,
    errorCells
  }
}

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

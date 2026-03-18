// Tridoku puzzle generator and validator
// Uses a simplified triangular grid structure

export type CellId = string // Format: "row-col" (e.g. "0-0", "1-2")

export interface Cell {
  id: CellId
  value: number | null
  isGiven: boolean // Means the cell is pre-filled and cannot be changed by the player
  isSelected: boolean
  hasError: boolean
  row: number
  col: number
  neighbors: CellId[] // IDs of neighboring cells that share an edge or vertex (for validation) (up to 12 neighbors, 1 along each of the 3 sides of the triangle and 3 at each corner)
  
  // Constraint regions (for validation)
  boldedRegion: number  // 0-8 (one of 9 bolded regions with 1-9 each)
  outerEdge: number | null  // 0=left side, 1=right side, 2=bottom side, null=not in any outer yellow edge
  innerEdge: number | null  // 0=top inner, 1=bottom-left inner, 2=bottom-right inner, null=not in any inner blue edge
  
  // Visual display (derived from constraint membership)
  // yellow = outer edge, blue = inner edge, green = outer and inner edge, white = none
  colorCategory: 'yellow' | 'blue' | 'green' | 'white'
}

export interface TridokuPuzzle {
  cells: Cell[]
  solution: number[]
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

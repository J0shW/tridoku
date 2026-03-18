// Tridoku puzzle generator and validator
// Uses a simplified triangular grid structure

export type CellId = string // Format: "row-col" (e.g. "0-0", "1-2")

export interface Cell {
  id: CellId
  hidden: boolean; // some cells are hidden to create the triangular shape, these cannot be filled in by the player and are not part of the solution
  value: number | null
  isGiven: boolean // Means the cell is pre-filled and cannot be changed by the player
  isSelected: boolean
  hasError: boolean
  row: number
  col: number
  direction: 'up' | 'down' // Orientation of the triangle (pointing up or down)
  neighbors: CellId[] // IDs of neighboring cells that share an edge or vertex (for validation) (up to 12 neighbors, 1 along each of the 3 sides of the triangle and 3 at each corner)
  
  // Constraint regions (for validation)
  boldedRegion: number  // 0-8 (one of 9 bolded regions with 1-9 each)
  isOuterLeftEdge: boolean // cells on the left edge of the triangle
  isOuterRightEdge: boolean
  isOuterBottomEdge: boolean
  isInnerLeftEdge: boolean
  isInnerRightEdge: boolean
  isInnerTopEdge: boolean
  
  // Visual display (derived from constraint membership)
  // yellow = outer edge, blue = inner edge, green = outer and inner edge, white = none
  color: 'yellow' | 'blue' | 'green' | 'white'
}

export interface TridokuPuzzle {
  cells: Cell[]
  solution: number[]
}

export type Board = Cell[][]

// Inner left edge lookup: row -> set of non-hidden indices that have isInnerLeftEdge
const INNER_LEFT_EDGE_MAP: Record<number, Set<number>> = {
  5: new Set([1, 2]),
  6: new Set([3, 4]),
  7: new Set([5, 6]),
  8: new Set([7, 8]),
}

export function createEmptyBoard(): Board {
  const board: Board = []

  for (let row = 0; row < 9; row++) {
    const cells: Cell[] = []
    const firstNonHidden = 8 - row
    const lastNonHidden = 8 + row

    for (let col = 0; col < 17; col++) {
      const hidden = col < firstNonHidden || col > lastNonHidden
      const nhIndex = col - firstNonHidden // offset among non-hidden cells
      const direction: 'up' | 'down' = hidden ? 'up' : (nhIndex % 2 === 0 ? 'up' : 'down')

      // Edge booleans (only meaningful for non-hidden cells)
      const isOuterLeftEdge = !hidden && nhIndex === 0
      const isOuterRightEdge = !hidden && nhIndex === 2 * row
      const isOuterBottomEdge = !hidden && row === 8 && direction === 'up'
      const isInnerTopEdge = !hidden && row === 4
      const isInnerLeftEdge = !hidden && (INNER_LEFT_EDGE_MAP[row]?.has(nhIndex) ?? false)
      const isInnerRightEdge = !hidden && row >= 5 && (nhIndex === 8 || nhIndex === 9)

      // Color derivation
      const hasOuter = isOuterLeftEdge || isOuterRightEdge || isOuterBottomEdge
      const hasInner = isInnerLeftEdge || isInnerRightEdge || isInnerTopEdge
      let color: Cell['color'] = 'white'
      if (!hidden) {
        if (hasOuter && hasInner) color = 'green'
        else if (hasOuter) color = 'yellow'
        else if (hasInner) color = 'blue'
      }

      cells.push({
        id: `${row}-${col}`,
        hidden,
        value: null,
        isGiven: false,
        isSelected: false,
        hasError: false,
        row,
        col,
        direction,
        neighbors: [],
        boldedRegion: 0,
        isOuterLeftEdge,
        isOuterRightEdge,
        isOuterBottomEdge,
        isInnerLeftEdge,
        isInnerRightEdge,
        isInnerTopEdge,
        color,
      })
    }

    board.push(cells)
  }

  return board
}

export const TRIDOKU_BOARD: Board = createEmptyBoard()

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

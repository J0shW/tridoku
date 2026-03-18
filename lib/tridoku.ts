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

// The big triangle is a macro-grid of side 3. Each macro-row spans 3 micro-rows.
// Macro-row 0 (rows 0-2): 1 region, macro-row 1 (rows 3-5): 3 regions, macro-row 2 (rows 6-8): 5 regions.
// Within each macro-row, regions alternate upward/downward triangles of 9 cells each.
function getBoldedRegion(row: number, nhIndex: number): number {
  const macroRow = Math.floor(row / 3)
  const localRow = row % 3
  const p = Math.floor(nhIndex / 6)
  const isUpward = nhIndex <= 6 * p + 2 * localRow
  const j = isUpward ? 2 * p : 2 * p + 1
  return macroRow * macroRow + j
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
        boldedRegion: hidden ? -1 : getBoldedRegion(row, nhIndex),
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

  // Compute neighbors: two cells are neighbors if they share any vertex.
  // Build a map from each vertex point to all cell IDs touching it.
  // Vertex key uses integer coordinates: x is the column, y is the row boundary index (0-9).
  const vertexMap = new Map<string, CellId[]>()
  function addVertex(key: string, cellId: CellId) {
    if (!vertexMap.has(key)) vertexMap.set(key, [])
    vertexMap.get(key)!.push(cellId)
  }

  for (const boardRow of board) {
    for (const cell of boardRow) {
      if (cell.hidden) continue
      const { row: r, col: c, direction: dir, id } = cell
      if (dir === 'up') {
        // Vertices: bottom-left (c, r+1), top (c+1, r), bottom-right (c+2, r+1)
        addVertex(`${c},${r + 1}`, id)
        addVertex(`${c + 1},${r}`, id)
        addVertex(`${c + 2},${r + 1}`, id)
      } else {
        // Vertices: top-left (c, r), top-right (c+2, r), bottom (c+1, r+1)
        addVertex(`${c},${r}`, id)
        addVertex(`${c + 2},${r}`, id)
        addVertex(`${c + 1},${r + 1}`, id)
      }
    }
  }

  for (const boardRow of board) {
    for (const cell of boardRow) {
      if (cell.hidden) continue
      const { row: r, col: c, direction: dir, id } = cell
      const vertices = dir === 'up'
        ? [`${c},${r + 1}`, `${c + 1},${r}`, `${c + 2},${r + 1}`]
        : [`${c},${r}`, `${c + 2},${r}`, `${c + 1},${r + 1}`]
      const neighborSet = new Set<CellId>()
      for (const v of vertices) {
        for (const nid of vertexMap.get(v)!) {
          if (nid !== id) neighborSet.add(nid)
        }
      }
      cell.neighbors = Array.from(neighborSet)
    }
  }

  return board
}

export const TRIDOKU_BOARD: Board = createEmptyBoard()

// A puzzle is a string of 81 characters, one per non-hidden cell (row-major, left to right).
// '1'-'9' = given value, '0' = empty.
export function loadPuzzle(data: string): Board {
  const board = createEmptyBoard()
  let i = 0
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 17; col++) {
      if (board[row][col].hidden) continue
      const ch = data[i++]
      const val = parseInt(ch)
      if (val >= 1 && val <= 9) {
        board[row][col] = { ...board[row][col], value: val, isGiven: true }
      }
    }
  }
  return board
}

// Validate adjacency and edge constraints.
// Returns a new board with hasError updated on all cells.
export function validateBoard(board: Board): Board {
  const errorIds = new Set<CellId>()

  // 1. Adjacency: no two neighboring cells may share the same value
  for (const row of board) {
    for (const cell of row) {
      if (cell.hidden || cell.value == null) continue
      for (const nid of cell.neighbors) {
        const [nr, nc] = nid.split('-').map(Number)
        const neighbor = board[nr][nc]
        if (neighbor.value === cell.value) {
          errorIds.add(cell.id)
          errorIds.add(nid)
        }
      }
    }
  }

  // 2. Edges: no duplicate values within the same outer or inner edge
  type EdgeKey = 'isOuterLeftEdge' | 'isOuterRightEdge' | 'isOuterBottomEdge' | 'isInnerLeftEdge' | 'isInnerRightEdge' | 'isInnerTopEdge'
  const edgeGroups: { key: EdgeKey }[] = [
    { key: 'isOuterLeftEdge' },
    { key: 'isOuterRightEdge' },
    { key: 'isOuterBottomEdge' },
    { key: 'isInnerLeftEdge' },
    { key: 'isInnerRightEdge' },
    { key: 'isInnerTopEdge' },
  ]
  for (const { key } of edgeGroups) {
    const byValue = new Map<number, CellId[]>()
    for (const row of board) {
      for (const cell of row) {
        if (cell.hidden || !cell[key] || cell.value == null) continue
        if (!byValue.has(cell.value)) byValue.set(cell.value, [])
        byValue.get(cell.value)!.push(cell.id)
      }
    }
    for (const ids of byValue.values()) {
      if (ids.length > 1) {
        for (const id of ids) errorIds.add(id)
      }
    }
  }

  // Update hasError on all non-hidden cells
  return board.map(row =>
    row.map(cell =>
      cell.hidden ? cell : { ...cell, hasError: errorIds.has(cell.id) }
    )
  )
}

// Example puzzle from the reference image
export const EXAMPLE_PUZZLE =
  '6' +           // row 0
  '004' +         // row 1
  '02080' +       // row 2
  '0030721' +     // row 3
  '001000050' +   // row 4
  '00002000803' + // row 5
  '0600500300708' + // row 6
  '005370010065400' + // row 7
  '01040006004020030'  // row 8

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

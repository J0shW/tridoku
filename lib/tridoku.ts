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
  color: 'outer' | 'inner' | 'overlap' | 'none'
}

export interface TridokuPuzzle {
  cells: Cell[]
  solution: number[]
}

export type Board = Cell[][]

// Inner left edge lookup: row -> set of non-hidden indices that have isInnerLeftEdge
const INNER_LEFT_EDGE_MAP: Record<number, Set<number>> = {
  4: new Set([0]),
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
      const isInnerRightEdge = !hidden && (
        (row === 4 && nhIndex === 8) ||
        (row >= 5 && (nhIndex === 8 || nhIndex === 9))
      )

      // Color derivation
      const hasOuter = isOuterLeftEdge || isOuterRightEdge || isOuterBottomEdge
      const hasInner = isInnerLeftEdge || isInnerRightEdge || isInnerTopEdge
      let color: Cell['color'] = 'none'
      if (!hidden) {
        if (hasOuter && hasInner) color = 'overlap'
        else if (hasOuter) color = 'outer'
        else if (hasInner) color = 'inner'
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

  // 3. Bolded regions: no duplicate values within the same region
  const regionCells = new Map<number, { value: number; id: CellId }[]>()
  for (const row of board) {
    for (const cell of row) {
      if (cell.hidden || cell.value == null) continue
      if (!regionCells.has(cell.boldedRegion)) regionCells.set(cell.boldedRegion, [])
      regionCells.get(cell.boldedRegion)!.push({ value: cell.value, id: cell.id })
    }
  }
  for (const cells of regionCells.values()) {
    const byValue = new Map<number, CellId[]>()
    for (const { value, id } of cells) {
      if (!byValue.has(value)) byValue.set(value, [])
      byValue.get(value)!.push(id)
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

// Check if the puzzle is complete (all cells filled, no errors)
export function isPuzzleComplete(board: Board): boolean {
  for (const row of board) {
    for (const cell of row) {
      // Skip hidden cells
      if (cell.hidden) continue
      
      // If any cell is empty, puzzle is not complete
      if (cell.value === null) return false
      
      // If any cell has an error, puzzle is not complete
      if (cell.hasError) return false
    }
  }
  
  // All cells filled and no errors
  return true
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

// Nearly-solved puzzle for testing (only a few cells empty)
export const TEST_NEARLY_SOLVED =
  '6' +           // row 0
  '134' +         // row 1
  '72589' +       // row 2
  '5431721' +     // row 3
  '371006452' +   // row 4
  '49862500863' + // row 5
  '9621598341728' + // row 6
  '275374215965467' + // row 7
  '81346896734829135'  // row 8

// Get puzzle number based on days since launch
export function getPuzzleNumber(): number {
  const launchDate = new Date('2026-01-01')
  const today = new Date()
  const diffTime = Math.abs(today.getTime() - launchDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

// Arrow key navigation: returns the CellId to move to, or null if at edge.
export function getArrowTarget(
  board: Board,
  currentId: CellId,
  direction: 'up' | 'down' | 'left' | 'right'
): CellId | null {
  const [row, col] = currentId.split('-').map(Number)

  if (direction === 'left') {
    // Move to prev non-hidden cell in same row
    for (let c = col - 1; c >= 0; c--) {
      if (!board[row][c].hidden) return board[row][c].id
    }
    return null
  }
  if (direction === 'right') {
    // Move to next non-hidden cell in same row
    for (let c = col + 1; c < 17; c++) {
      if (!board[row][c].hidden) return board[row][c].id
    }
    return null
  }

  // Up/Down: go to adjacent row, pick the non-hidden cell with closest column
  const targetRow = direction === 'up' ? row - 1 : row + 1
  if (targetRow < 0 || targetRow >= 9) return null

  let best: Cell | null = null
  let bestDist = Infinity
  for (const cell of board[targetRow]) {
    if (cell.hidden) continue
    const dist = Math.abs(cell.col - col)
    if (dist < bestDist) {
      bestDist = dist
      best = cell
    }
  }
  return best?.id ?? null
}

// Format time in mm:ss
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// ============================================================================
// PUZZLE GENERATOR
// ============================================================================

// Seeded random number generator (Mulberry32)
export function createSeededRandom(seed: number) {
  let state = seed
  return {
    next(): number {
      state = (state + 0x6D2B79F5) | 0
      let t = Math.imul(state ^ (state >>> 15), 1 | state)
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
  }
}

// Convert date to seed for daily puzzles
export function getDailySeed(): number {
  const today = new Date()
  return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
}

// Difficulty levels for puzzle generation
export type Difficulty = 'easy' | 'medium' | 'hard'

interface DifficultyConfig {
  minGivens: number
  maxGivens: number
}

const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: { minGivens: 40, maxGivens: 50 },
  medium: { minGivens: 30, maxGivens: 40 },
  hard: { minGivens: 22, maxGivens: 30 }
}

// Check if placing a value at (row, col) violates any constraints
function isValidPlacement(board: Board, row: number, col: number, value: number): boolean {
  const cell = board[row][col]
  if (cell.hidden) return false

  // Check adjacency: no neighbors may have the same value
  for (const nid of cell.neighbors) {
    const [nr, nc] = nid.split('-').map(Number)
    const neighbor = board[nr][nc]
    if (neighbor.value === value) return false
  }

  // Check edge constraints
  type EdgeKey = 'isOuterLeftEdge' | 'isOuterRightEdge' | 'isOuterBottomEdge' | 
                 'isInnerLeftEdge' | 'isInnerRightEdge' | 'isInnerTopEdge'
  const edgeKeys: EdgeKey[] = [
    'isOuterLeftEdge', 'isOuterRightEdge', 'isOuterBottomEdge',
    'isInnerLeftEdge', 'isInnerRightEdge', 'isInnerTopEdge'
  ]
  
  for (const key of edgeKeys) {
    if (!cell[key]) continue
    // Check if any other cell on this edge has the same value
    for (const boardRow of board) {
      for (const otherCell of boardRow) {
        if (otherCell.hidden || otherCell.id === cell.id) continue
        if (otherCell[key] && otherCell.value === value) return false
      }
    }
  }

  // Check bolded region: no duplicate in the same region
  for (const boardRow of board) {
    for (const otherCell of boardRow) {
      if (otherCell.hidden || otherCell.id === cell.id) continue
      if (otherCell.boldedRegion === cell.boldedRegion && otherCell.value === value) {
        return false
      }
    }
  }

  return true
}

// Count solutions using backtracking (limit to avoid checking all solutions)
// Exported for testing purposes
export function countSolutions(board: Board, limit: number = 2): number {
  let count = 0
  let iterations = 0
  const MAX_ITERATIONS = 1000000 // Very high limit for offline generation

  function backtrack(): void {
    if (count >= limit) return // Early exit
    if (iterations++ > MAX_ITERATIONS) return // Timeout protection

    // Find next empty cell (find cell with minimum candidates for efficiency)
    let minCell: { row: number; col: number; candidates: number[] } | null = null
    
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 17; col++) {
        const cell = board[row][col]
        if (cell.hidden || cell.value !== null) continue

        // Count valid candidates for this cell
        const candidates: number[] = []
        for (let val = 1; val <= 9; val++) {
          if (isValidPlacement(board, row, col, val)) {
            candidates.push(val)
          }
        }

        // If no candidates, this path is invalid
        if (candidates.length === 0) return
        
        // Choose cell with fewest candidates (MRV heuristic)
        if (!minCell || candidates.length < minCell.candidates.length) {
          minCell = { row, col, candidates }
          // If only 1 candidate, use it immediately (optimization)
          if (candidates.length === 1) break
        }
      }
      if (minCell && minCell.candidates.length === 1) break
    }

    // No empty cell found - solution is complete
    if (!minCell) {
      count++
      return
    }

    // Try each candidate value
    for (const val of minCell.candidates) {
      board[minCell.row][minCell.col].value = val
      backtrack()
      board[minCell.row][minCell.col].value = null
      if (count >= limit) return // Early exit
    }
  }

  backtrack()
  return count
}

// Solve puzzle and return the solution (or null if unsolvable)
export function solvePuzzle(board: Board): Board | null {
  // Create a deep copy of the board to avoid modifying the original
  const solvedBoard = board.map(row => 
    row.map(cell => ({ ...cell }))
  )

  function backtrack(): boolean {
    // Find next empty cell
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 17; col++) {
        const cell = solvedBoard[row][col]
        if (cell.hidden || cell.value !== null) continue

        // Try each value 1-9
        for (let val = 1; val <= 9; val++) {
          if (isValidPlacement(solvedBoard, row, col, val)) {
            cell.value = val
            if (backtrack()) return true
            cell.value = null
          }
        }
        return false // No valid value found
      }
    }

    // No empty cell found - solution is complete
    return true
  }

  if (backtrack()) {
    return solvedBoard
  }
  return null
}

// Generate a complete valid solution using randomized backtracking
export function generateCompleteSolution(seed?: number): Board {
  console.log('[Generator] Starting complete solution generation with backtracking...')
  const startTime = Date.now()
  
  let attemptNumber = 0
  const MAX_ATTEMPTS = 10
  const ITERATIONS_PER_ATTEMPT = 100000
  
  while (attemptNumber < MAX_ATTEMPTS) {
    // Use a different seed for each attempt
    const attemptSeed = seed !== undefined ? seed + attemptNumber * Math.floor(Math.random() * 999999) : undefined
    const rng = attemptSeed !== undefined ? createSeededRandom(attemptSeed) : null
    
    if (attemptNumber > 0) {
      console.log(`[Generator] Retry ${attemptNumber + 1} with modified seed...`)
    }
    
    const board = createEmptyBoard()
    let iterations = 0
    
    // Start by placing values strategically in first region to create a foundation
    // Region 0 is the top triangle (row 0-2)
    const startValues = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    if (rng) {
      for (let i = startValues.length - 1; i > 0; i--) {
        const j = Math.floor(rng.next() * (i + 1))
        ;[startValues[i], startValues[j]] = [startValues[j], startValues[i]]
      }
    }
    
    // Place initial values in region 0
    let valueIndex = 0
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 17; col++) {
        const cell = board[row][col]
        if (!cell.hidden && cell.boldedRegion === 0) {
          cell.value = startValues[valueIndex++]
        }
      }
    }
    
    function backtrackFill(): boolean {
      iterations++
      
      // Abort this attempt if we've exceeded iterations for this try
      if (iterations > ITERATIONS_PER_ATTEMPT) {
        return false
      }
      
      // Find next empty cell using MRV heuristic
      let minCell: { row: number; col: number; candidates: number[] } | null = null
      
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 17; col++) {
          const cell = board[row][col]
          if (cell.hidden || cell.value !== null) continue

          const candidates: number[] = []
          for (let val = 1; val <= 9; val++) {
            if (isValidPlacement(board, row, col, val)) {
              candidates.push(val)
            }
          }

          if (candidates.length === 0) return false
          
          if (!minCell || candidates.length < minCell.candidates.length) {
            minCell = { row, col, candidates }
          }
        }
      }

      // No empty cell found - solution complete
      if (!minCell) {
        return true
      }

      // Shuffle candidates for randomization
      const candidates = [...minCell.candidates]
      if (rng) {
        for (let i = candidates.length - 1; i > 0; i--) {
          const j = Math.floor(rng.next() * (i + 1))
          ;[candidates[i], candidates[j]] = [candidates[j], candidates[i]]
        }
      }

      // Try each candidate
      for (const val of candidates) {
        board[minCell.row][minCell.col].value = val
        if (backtrackFill()) return true
        board[minCell.row][minCell.col].value = null
      }

      return false
    }

    const success = backtrackFill()
    
    if (success) {
      const duration = Date.now() - startTime
      console.log(`[Generator] Complete solution generated in ${duration}ms (attempt ${attemptNumber + 1}, ${iterations} iterations)`)
      return board
    }
    
    // Move to next attempt
    attemptNumber++
  }
  
  // All attempts failed
  throw new Error('Failed to generate complete solution after ' + MAX_ATTEMPTS + ' attempts')
}

// Remove cells while maintaining unique solution
function removeCellsWithUniqueness(
  board: Board,
  targetGivens: number,
  seed?: number
): Board {
  console.log(`[Generator] Starting cell removal (target: ${targetGivens} givens)...`)
  const rng = seed !== undefined ? createSeededRandom(seed + 1000) : null
  const startTime = Date.now()

  let currentGivens = 81 // Start with all 81 cells filled
  let totalAttempts = 0
  let totalRemovals = 0
  let passNumber = 0
  
  // Keep trying passes until we reach target or make no progress
  while (currentGivens > targetGivens) {
    passNumber++
    
    // Get all non-hidden cells with values
    const positions: { row: number; col: number }[] = []
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 17; col++) {
        if (!board[row][col].hidden && board[row][col].value !== null) {
          positions.push({ row, col })
        }
      }
    }

    // Shuffle positions for this pass
    for (let i = positions.length - 1; i > 0; i--) {
      const rand = rng ? rng.next() : Math.random()
      const j = Math.floor(rand * (i + 1))
      ;[positions[i], positions[j]] = [positions[j], positions[i]]
    }

    let removalThisPass = 0

    for (const { row, col } of positions) {
      if (currentGivens <= targetGivens) break
      totalAttempts++

      if (totalAttempts % 100 === 0) {
        console.log(`[Generator] Pass ${passNumber}, attempt ${totalAttempts}: ${currentGivens} givens`)
      }

      const cell = board[row][col]
      const originalValue = cell.value

      cell.value = null

      const solutions = countSolutions(board, 2)

      if (solutions === 1) {
        currentGivens--
        totalRemovals++
        removalThisPass++
      } else {
        cell.value = originalValue
      }
    }
    
    console.log(`[Generator] Pass ${passNumber}: ${removalThisPass} cells removed, ${currentGivens} givens remaining`)
    
    // If we made no progress this pass, we're done
    if (removalThisPass === 0) {
      console.log(`[Generator] No more cells can be removed while maintaining uniqueness`)
      break
    }
    
    // Safety check: if we've done too many passes, stop
    if (passNumber >= 10) {
      console.log(`[Generator] Maximum passes reached`)
      break
    }
  }
  
  const totalDuration = Date.now() - startTime
  console.log(`[Generator] Cell removal complete in ${totalDuration}ms: ${currentGivens} givens (${totalRemovals} removed)`)

  // Mark remaining filled cells as givens
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 17; col++) {
      const cell = board[row][col]
      if (!cell.hidden && cell.value !== null) {
        cell.isGiven = true
      }
    }
  }

  return board
}

// Main puzzle generation function
export function generatePuzzle(difficulty: Difficulty = 'medium', seed?: number): Board {
  console.log(`[Generator] ========================================`)
  console.log(`[Generator] Starting ${difficulty} puzzle generation`)
  console.log(`[Generator] Seed: ${seed}`)
  const overallStart = Date.now()
  
  const config = DIFFICULTY_CONFIGS[difficulty]
  
  // Use seed or generate random seed
  const generationSeed = seed !== undefined ? seed : Math.floor(Math.random() * 1000000)
  
  // Generate complete solution
  const board = generateCompleteSolution(generationSeed)
  
  // Calculate target givens (random within the difficulty range)
  const rng = createSeededRandom(generationSeed + 500)
  const targetGivens = Math.floor(
    config.minGivens + rng.next() * (config.maxGivens - config.minGivens + 1)
  )
  console.log(`[Generator] Target givens: ${targetGivens}`)
  
  // Remove cells while maintaining unique solution
  const puzzle = removeCellsWithUniqueness(board, targetGivens, generationSeed)
  
  const overallDuration = Date.now() - overallStart
  console.log(`[Generator] TOTAL TIME: ${overallDuration}ms`)
  console.log(`[Generator] ======================================== `)
  
  return puzzle
}

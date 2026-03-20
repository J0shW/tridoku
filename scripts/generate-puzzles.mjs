// Puzzle Generator - Offline Node.js Script
// Generates Tridoku puzzles and saves them to JSON files
// Run with: node scripts/generate-puzzles.mjs

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ============================================================================
// TRIDOKU CORE LOGIC (copied from lib/tridoku.ts)
// ============================================================================

const INNER_LEFT_EDGE_MAP = {
  4: new Set([0]),
  5: new Set([1, 2]),
  6: new Set([3, 4]),
  7: new Set([5, 6]),
  8: new Set([7, 8]),
}

function getBoldedRegion(row, nhIndex) {
  const macroRow = Math.floor(row / 3)
  const localRow = row % 3
  const p = Math.floor(nhIndex / 6)
  const isUpward = nhIndex <= 6 * p + 2 * localRow
  const j = isUpward ? 2 * p : 2 * p + 1
  return macroRow * macroRow + j
}

function createEmptyBoard() {
  const board = []

  for (let row = 0; row < 9; row++) {
    const cells = []
    const firstNonHidden = 8 - row
    const lastNonHidden = 8 + row

    for (let col = 0; col < 17; col++) {
      const hidden = col < firstNonHidden || col > lastNonHidden
      const nhIndex = col - firstNonHidden
      const direction = hidden ? 'up' : (nhIndex % 2 === 0 ? 'up' : 'down')

      const isOuterLeftEdge = !hidden && nhIndex === 0
      const isOuterRightEdge = !hidden && nhIndex === 2 * row
      const isOuterBottomEdge = !hidden && row === 8 && direction === 'up'
      const isInnerTopEdge = !hidden && row === 4
      const isInnerLeftEdge = !hidden && (INNER_LEFT_EDGE_MAP[row]?.has(nhIndex) ?? false)
      const isInnerRightEdge = !hidden && (
        (row === 4 && nhIndex === 8) ||
        (row >= 5 && (nhIndex === 8 || nhIndex === 9))
      )

      const hasOuter = isOuterLeftEdge || isOuterRightEdge || isOuterBottomEdge
      const hasInner = isInnerLeftEdge || isInnerRightEdge || isInnerTopEdge
      let color = 'none'
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

  // Compute neighbors
  const vertexMap = new Map()
  function addVertex(key, cellId) {
    if (!vertexMap.has(key)) vertexMap.set(key, [])
    vertexMap.get(key).push(cellId)
  }

  for (const boardRow of board) {
    for (const cell of boardRow) {
      if (cell.hidden) continue
      const { row: r, col: c, direction: dir, id } = cell
      if (dir === 'up') {
        addVertex(`${c},${r + 1}`, id)
        addVertex(`${c + 1},${r}`, id)
        addVertex(`${c + 2},${r + 1}`, id)
      } else {
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
      const neighborSet = new Set()
      for (const v of vertices) {
        for (const nid of vertexMap.get(v)) {
          if (nid !== id) neighborSet.add(nid)
        }
      }
      cell.neighbors = Array.from(neighborSet)
    }
  }

  return board
}

function loadPuzzle(data) {
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

function boardToString(board) {
  let result = ''
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 17; col++) {
      if (board[row][col].hidden) continue
      result += board[row][col].value || '0'
    }
  }
  return result
}

// Seeded random number generator (Mulberry32)
function createSeededRandom(seed) {
  let state = seed
  return {
    next() {
      state = (state + 0x6D2B79F5) | 0
      let t = Math.imul(state ^ (state >>> 15), 1 | state)
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
  }
}

// Must be multiple of 3 for symmetry removal to maintain 3-way pattern
const DIFFICULTY_CONFIGS = {
  easy: { minGivens: 42, maxGivens: 48 },
  medium: { minGivens: 33, maxGivens: 39 },
  hard: { minGivens: 24, maxGivens: 30 }
}

// ============================================================================
// SYMMETRY GROUPS FOR 3-WAY ROTATIONAL SYMMETRY
// ============================================================================
// Map of region number to its 9 cells' coordinates in order (local index 0-8)
const REGION_CELLS = {
  0: [[0, 8], [1, 7], [1, 8], [1, 9], [2, 6], [2, 7], [2, 8], [2, 9], [2, 10]],
  1: [[3, 5], [4, 4], [4, 5], [4, 6], [5, 3], [5, 4], [5, 5], [5, 6], [5, 7]],
  2: [[3, 6], [3, 7], [3, 8], [3, 9], [3, 10], [4, 7], [4, 8], [4, 9], [5, 8]],
  3: [[3, 11], [4, 10], [4, 11], [4, 12], [5, 9], [5, 10], [5, 11], [5, 12], [5, 13]],
  4: [[6, 2], [7, 1], [7, 2], [7, 3], [8, 0], [8, 1], [8, 2], [8, 3], [8, 4]],
  5: [[6, 3], [6, 4], [6, 5], [6, 6], [6, 7], [7, 4], [7, 5], [7, 6], [8, 5]],
  6: [[6, 8], [7, 7], [7, 8], [7, 9], [8, 6], [8, 7], [8, 8], [8, 9], [8, 10]],
  7: [[6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [7, 10], [7, 11], [7, 12], [8, 11]],
  8: [[6, 14], [7, 13], [7, 14], [7, 15], [8, 12], [8, 13], [8, 14], [8, 15], [8, 16]]
}

// Exact rotational mapping for 120° symmetry
// Maps local index in first region to local indices in second and third regions
// Based on the physical puzzle book's rotational symmetry pattern
const ROTATION_MAP = [
  [4, 8],  // index 0 → 4 → 8
  [6, 3],  // index 1 → 6 → 3
  [5, 7],  // index 2 → 5 → 7
  [1, 6],  // index 3 → 1 → 6
  [8, 0],  // index 4 → 8 → 0
  [7, 2],  // index 5 → 7 → 2
  [3, 1],  // index 6 → 3 → 1
  [2, 5],  // index 7 → 2 → 5
  [0, 4]   // index 8 → 0 → 4
]

// Build symmetry groups with exact 120° rotational mapping
function buildSymmetryGroups() {
  const groups = []
  
  // Group 1: Regions {0, 4, 8}
  const group1 = []
  for (let i = 0; i < 9; i++) {
    group1.push([
      REGION_CELLS[0][i],
      REGION_CELLS[4][ROTATION_MAP[i][0]],
      REGION_CELLS[8][ROTATION_MAP[i][1]]
    ])
  }
  groups.push(group1)
  
  // Group 2: Regions {1, 6, 3} - reordered so region 6 gets first map value
  const group2 = []
  for (let i = 0; i < 9; i++) {
    group2.push([
      REGION_CELLS[1][i],
      REGION_CELLS[6][ROTATION_MAP[i][0]],
      REGION_CELLS[3][ROTATION_MAP[i][1]]
    ])
  }
  groups.push(group2)
  
  // Group 3: Regions {2, 5, 7} - same rotation pattern
  const group3 = []
  for (let i = 0; i < 9; i++) {
    group3.push([
      REGION_CELLS[2][i],
      REGION_CELLS[5][ROTATION_MAP[i][0]],
      REGION_CELLS[7][ROTATION_MAP[i][1]]
    ])
  }
  groups.push(group3)
  
  return groups
}

const SYMMETRY_GROUPS = buildSymmetryGroups()

function isValidPlacement(board, row, col, value) {
  const cell = board[row][col]
  if (cell.hidden) return false

  // Check adjacency
  for (const nid of cell.neighbors) {
    const [nr, nc] = nid.split('-').map(Number)
    const neighbor = board[nr][nc]
    if (neighbor.value === value) return false
  }

  // Check edge constraints
  const edgeKeys = [
    'isOuterLeftEdge', 'isOuterRightEdge', 'isOuterBottomEdge',
    'isInnerLeftEdge', 'isInnerRightEdge', 'isInnerTopEdge'
  ]
  
  for (const key of edgeKeys) {
    if (!cell[key]) continue
    for (const boardRow of board) {
      for (const otherCell of boardRow) {
        if (otherCell.hidden || otherCell.id === cell.id) continue
        if (otherCell[key] && otherCell.value === value) return false
      }
    }
  }

  // Check bolded region
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

function countSolutions(board, limit = 2) {
  let count = 0
  let iterations = 0
  const MAX_ITERATIONS = 1000000 // Very high limit for offline generation

  function backtrack() {
    if (count >= limit) return
    if (iterations++ > MAX_ITERATIONS) return

    let minCell = null
    
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 17; col++) {
        const cell = board[row][col]
        if (cell.hidden || cell.value !== null) continue

        const candidates = []
        for (let val = 1; val <= 9; val++) {
          if (isValidPlacement(board, row, col, val)) {
            candidates.push(val)
          }
        }

        if (candidates.length === 0) return
        
        if (!minCell || candidates.length < minCell.candidates.length) {
          minCell = { row, col, candidates }
          if (candidates.length === 1) break
        }
      }
      if (minCell && minCell.candidates.length === 1) break
    }

    if (!minCell) {
      count++
      return
    }

    for (const val of minCell.candidates) {
      board[minCell.row][minCell.col].value = val
      backtrack()
      board[minCell.row][minCell.col].value = null
      if (count >= limit) return
    }
  }

  backtrack()
  return count
}

function generateCompleteSolution(seed) {
  console.log('  [Generator] Generating complete solution with backtracking...')
  const startTime = Date.now()
  
  let attemptNumber = 0
  const MAX_ATTEMPTS = 10
  const ITERATIONS_PER_ATTEMPT = 100000
  
  while (attemptNumber < MAX_ATTEMPTS) {
    // Use a different seed for each attempt
    const attemptSeed = seed + attemptNumber * Math.floor(Math.random() * 999999)
    const rng = attemptSeed !== undefined ? createSeededRandom(attemptSeed) : null
    
    if (attemptNumber > 0) {
      console.log(`  [Generator] Retry ${attemptNumber + 1} with modified seed...`)
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
    
    function backtrackFill() {
      iterations++
      
      // Abort this attempt if we've exceeded iterations for this try
      if (iterations > ITERATIONS_PER_ATTEMPT) {
        return false
      }
      
      // Find next empty cell using MRV heuristic
      let minCell = null
      
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 17; col++) {
          const cell = board[row][col]
          if (cell.hidden || cell.value !== null) continue

          const candidates = []
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
      console.log(`  [Generator] Complete solution generated in ${duration}ms (attempt ${attemptNumber + 1}, ${iterations} iterations)`)
      return board
    }
    
    // Move to next attempt
    attemptNumber++
  }
  
  // All attempts failed
  throw new Error('Failed to generate complete solution after ' + MAX_ATTEMPTS + ' attempts')
}

// ============================================================================
// SYMMETRY HELPER FUNCTIONS
// ============================================================================

/**
 * Get the three rotationally symmetric cells for a given group and local index
 * @param {Array} board - The game board
 * @param {number} groupIndex - Symmetry group index (0, 1, or 2)
 * @param {number} localIndex - Local cell index within group (0-8)
 * @returns {Array} Array of three cells [cell0, cell1, cell2]
 */
function getSymmetricTriplet(board, groupIndex, localIndex) {
  const coords = SYMMETRY_GROUPS[groupIndex][localIndex]
  return coords.map(([row, col]) => board[row][col])
}

/**
 * Build array of all 27 removal units (group + local index combinations)
 * Each unit represents 3 rotationally symmetric cells
 * @returns {Array} Array of {groupIndex, localIndex} objects
 */
function buildRemovalUnits() {
  const units = []
  for (let groupIndex = 0; groupIndex < 3; groupIndex++) {
    for (let localIndex = 0; localIndex < 9; localIndex++) {
      units.push({ groupIndex, localIndex })
    }
  }
  return units
}

/**
 * Visualize a region's given pattern for debugging
 * @param {Array} board - The game board
 * @param {number} regionNum - Region number (0-8)
 * @param {boolean} showValues - If true, show actual values; if false, show X for givens
 * @returns {string} Visual representation
 */
function visualizeRegion(board, regionNum, showValues = false) {
  const cells = REGION_CELLS[regionNum]
  const pattern = cells.map(([row, col]) => {
    const cell = board[row][col]
    if (showValues) {
      return cell.value !== null ? cell.value.toString() : '.'
    } else {
      return cell.value !== null ? 'X' : '.'
    }
  })
  
  // Format as 3 rows (1 cell, 3 cells, 5 cells)
  return `    ${pattern[0]}\n   ${pattern[1]} ${pattern[2]} ${pattern[3]}\n  ${pattern[4]} ${pattern[5]} ${pattern[6]} ${pattern[7]} ${pattern[8]}`
}

/**
 * Print visual comparison of three rotationally symmetric regions
 * @param {Array} board - The game board
 * @param {number} groupIndex - Symmetry group index (0, 1, or 2)
 */
function printSymmetryGroupVisual(board, groupIndex) {
  const regionNums = [
    [0, 4, 8],  // Group 1
    [1, 6, 3],  // Group 2
    [2, 5, 7]   // Group 3
  ][groupIndex]
  
  console.log(`\n  Symmetry Group ${groupIndex + 1} (Regions ${regionNums.join(', ')}):`)
  console.log(`  (X = given, . = empty | Pattern should be rotationally equivalent)`)
  console.log(`  Region ${regionNums[0]} (first):`)
  console.log(visualizeRegion(board, regionNums[0], false))
  console.log(`  Region ${regionNums[1]} (120° rotation):`)
  console.log(visualizeRegion(board, regionNums[1], false))
  console.log(`  Region ${regionNums[2]} (240° rotation):`)
  console.log(visualizeRegion(board, regionNums[2], false))
  console.log(`  ↑ Using exact rotational mapping: R${regionNums[0]}(i) → R${regionNums[1]}(map[i][0]) → R${regionNums[2]}(map[i][1])`)
}

/**
 * Validate that the puzzle maintains 3-way rotational symmetry
 * Checks that each symmetry group has matching given patterns
 * @param {Array} board - The game board
 * @returns {Object} Validation result with isSymmetric flag and statistics
 */
function validateSymmetry(board) {
  const stats = {
    isSymmetric: true,
    groups: [],
    totalGivens: 0
  }

  // Check each symmetry group
  for (let groupIndex = 0; groupIndex < 3; groupIndex++) {
    const groupStats = {
      groupIndex,
      regions: [],
      isSymmetric: true
    }

    // For each local index, check if all three cells have same state (given or not)
    for (let localIndex = 0; localIndex < 9; localIndex++) {
      const triplet = getSymmetricTriplet(board, groupIndex, localIndex)
      const states = triplet.map(cell => cell.value !== null)
      
      // All three cells should have the same state (all given or all empty)
      const allGiven = states.every(s => s)
      const allEmpty = states.every(s => !s)
      
      if (!allGiven && !allEmpty) {
        groupStats.isSymmetric = false
        stats.isSymmetric = false
      }
      
      if (allGiven) {
        groupStats.regions.forEach((_, i) => {
          if (!groupStats.regions[i]) groupStats.regions[i] = { givens: 0 }
          groupStats.regions[i].givens++
        })
      }
    }

    // Count givens per region in this group
    const regionNums = [
      [0, 4, 8],  // Group 1
      [1, 6, 3],  // Group 2
      [2, 5, 7]   // Group 3
    ][groupIndex]

    regionNums.forEach((regionNum, i) => {
      let givens = 0
      for (let localIndex = 0; localIndex < 9; localIndex++) {
        const triplet = getSymmetricTriplet(board, groupIndex, localIndex)
        if (triplet[i].value !== null) {
          givens++
        }
      }
      groupStats.regions.push({ regionNum, givens })
      stats.totalGivens += givens
    })

    stats.groups.push(groupStats)
  }

  return stats
}

function removeCellsWithUniqueness(board, targetGivens, seed) {
  console.log(`  [Generator] Removing cells with 3-way rotational symmetry (target: ${targetGivens} givens)...`)
  const rng = seed !== undefined ? createSeededRandom(seed + 1000) : null
  const startTime = Date.now()

  let currentGivens = 81 // Start with all 81 cells filled
  let totalAttempts = 0
  let totalRemovals = 0
  
  // Build removal units (27 total: 3 groups × 9 cells per group)
  const removalUnits = buildRemovalUnits()
  
  // Shuffle removal units
  for (let i = removalUnits.length - 1; i > 0; i--) {
    const rand = rng ? rng.next() : Math.random()
    const j = Math.floor(rand * (i + 1))
    ;[removalUnits[i], removalUnits[j]] = [removalUnits[j], removalUnits[i]]
  }

  let removalThisPass = 0

  for (const { groupIndex, localIndex } of removalUnits) {
    // Stop if we've reached target (accounting for removal in groups of 3)
    if (currentGivens - 3 < targetGivens - 2) break
    totalAttempts++

    if (totalAttempts % 20 === 0) {
      console.log(`  [Generator] Attempt ${totalAttempts}: ${currentGivens} givens`)
    }

    // Get the three symmetric cells
    const triplet = getSymmetricTriplet(board, groupIndex, localIndex)
    
    // Skip if any cell in the triplet is already removed
    if (triplet.some(cell => cell.value === null)) continue
    
    // Save original values
    const originalValues = triplet.map(cell => cell.value)

    // Remove all three cells
    triplet.forEach(cell => { cell.value = null })

    // Test uniqueness with all three removed
    const solutions = countSolutions(board, 2)

    if (solutions === 1) {
      // Keep removed - puzzle still unique
      currentGivens -= 3
      totalRemovals += 3
      removalThisPass += 3
    } else {
      // Restore all three cells
      triplet.forEach((cell, i) => { cell.value = originalValues[i] })
    }
  }
  
  const totalDuration = Date.now() - startTime
  console.log(`  [Generator] Removed ${totalRemovals} cells in ${totalDuration}ms: ${currentGivens} givens`)

  // Mark remaining values as givens
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 17; col++) {
      const cell = board[row][col]
      if (!cell.hidden && cell.value !== null) {
        cell.isGiven = true
      }
    }
  }

  // Validate and log symmetry
  const symmetryStats = validateSymmetry(board)
  if (symmetryStats.isSymmetric) {
    console.log(`  [Generator] ✓ Symmetry validated - all groups maintain rotational symmetry`)
  } else {
    console.log(`  [Generator] ✗ WARNING: Symmetry violation detected!`)
  }
  
  // Log givens per region
  console.log(`  [Generator] Givens per region:`)
  symmetryStats.groups.forEach((group, i) => {
    const regionNums = group.regions.map(r => r.regionNum).join(', ')
    const givenCounts = group.regions.map(r => r.givens).join(', ')
    console.log(`    Group ${i + 1} (regions ${regionNums}): ${givenCounts} givens`)
  })
  
  // Print visual verification for the first group to show rotational pattern
  if (process.env.SHOW_SYMMETRY_VISUAL === 'true') {
    console.log(`\n  [Visual Verification] Comparing rotationally equivalent regions:`)
    printSymmetryGroupVisual(board, 0)
    // Only show once per run
    process.env.SHOW_SYMMETRY_VISUAL = 'done'
  }

  return board
}

function generatePuzzle(difficulty = 'medium', seed) {
  const config = DIFFICULTY_CONFIGS[difficulty]
  const generationSeed = seed !== undefined ? seed : Math.floor(Math.random() * 1000000)
  
  const rng = createSeededRandom(generationSeed + 500)
  const targetGivens = Math.floor(
    config.minGivens + rng.next() * (config.maxGivens - config.minGivens + 1)
  )
  console.log(`  [Generator] Target givens: ${targetGivens}`)
  
  const MAX_SOLUTION_ATTEMPTS = difficulty === 'hard' ? 20 : 1
  const ACCEPTABLE_DISTANCE = 6 // Accept if within 3 triplets (9 cells) of target
  
  let bestBoard = null
  let bestGivens = 81
  
  for (let attempt = 1; attempt <= MAX_SOLUTION_ATTEMPTS; attempt++) {
    // Use different seed for each attempt
    const attemptSeed = generationSeed + (attempt - 1) * 123456
    
    if (attempt > 1) {
      console.log(`  [Generator] Retry ${attempt} with modified seed to reach target...`)
    }
    
    const board = generateCompleteSolution(attemptSeed)
    const puzzle = removeCellsWithUniqueness(board, targetGivens, attemptSeed)
    
    // Count current givens
    let currentGivens = 0
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 17; col++) {
        if (!puzzle[row][col].hidden && puzzle[row][col].value !== null) {
          currentGivens++
        }
      }
    }
    
    // Track the best result
    if (Math.abs(currentGivens - targetGivens) < Math.abs(bestGivens - targetGivens)) {
      bestBoard = puzzle
      bestGivens = currentGivens
    }
    
    // If we're within acceptable distance, use this puzzle
    if (currentGivens <= targetGivens + ACCEPTABLE_DISTANCE) {
      if (attempt > 1) {
        console.log(`  [Generator] ✓ Reached acceptable target on attempt ${attempt}: ${currentGivens} givens`)
      }
      return puzzle
    }
    
    // If this is not the last attempt and we're far from target, try again
    if (attempt < MAX_SOLUTION_ATTEMPTS) {
      console.log(`  [Generator] Got ${currentGivens} givens, target is ${targetGivens}. Trying different solution...`)
    }
  }
  
  // Return the best result we found
  if (MAX_SOLUTION_ATTEMPTS > 1) {
    console.log(`  [Generator] Using best result: ${bestGivens} givens (target: ${targetGivens})`)
  }
  return bestBoard
}

// ============================================================================
// PUZZLE GENERATION FOR DATES
// ============================================================================

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'puzzles')

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

function generatePuzzleForDate(year, month, day) {
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const seed = year * 10000 + month * 100 + day
  
  console.log(`\nGenerating puzzles for ${dateStr} (seed: ${seed})...`)
  const startTime = Date.now()
  
  const difficulties = ['easy', 'medium', 'hard']
  const puzzleSet = {}
  
  for (const difficulty of difficulties) {
    console.log(`  [${difficulty.toUpperCase()}]`)
    const board = generatePuzzle(difficulty, seed + difficulties.indexOf(difficulty) * 1000000)
    const puzzleString = boardToString(board)
    
    // Count givens
    let givens = 0
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 17; col++) {
        if (!board[row][col].hidden && board[row][col].value !== null) {
          givens++
        }
      }
    }
    
    puzzleSet[difficulty] = {
      date: dateStr,
      difficulty: difficulty,
      seed: seed + difficulties.indexOf(difficulty) * 1000000,
      puzzle: puzzleString,
      metadata: {
        generatedAt: new Date().toISOString(),
        givens: givens
      }
    }
    
    console.log(`  ✓ ${difficulty}: ${givens} givens`)
  }
  
  const duration = Date.now() - startTime
  console.log(`✓ All difficulties generated in ${duration}ms`)
  
  return puzzleSet
}

function generatePuzzlesForYear(year, startMonth = 1, startDay = 1, endMonth = 12, endDay = null) {
  const puzzles = {}
  const totalStart = Date.now()
  
  let totalCount = 0
  
  for (let month = startMonth; month <= endMonth; month++) {
    const daysInMonth = new Date(year, month, 0).getDate()
    const firstDay = month === startMonth ? startDay : 1
    const lastDay = month === endMonth && endDay !== null ? endDay : daysInMonth
    
    for (let day = firstDay; day <= lastDay; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      puzzles[dateStr] = generatePuzzleForDate(year, month, day)
      totalCount++
    }
  }
  
  const totalDuration = Date.now() - totalStart
  const avgTime = Math.round(totalDuration / totalCount)
  console.log(`\n${'='.repeat(60)}`)
  console.log(`✓ Generated ${totalCount} puzzle sets (${totalCount * 3} total puzzles) in ${Math.round(totalDuration / 1000)}s`)
  console.log(`  Average time per puzzle set: ${avgTime}ms`)
  console.log(`${'='.repeat(60)}`)
  
  return puzzles
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

console.log('Tridoku Puzzle Generator')
console.log('========================\n')

// For testing, generate just a few days worth of puzzles
// Change these parameters to generate more puzzles
const YEAR = 2026
const START_MONTH = 3  // March
const START_DAY = 21
const END_MONTH = 3    // March
const END_DAY = 31

// Set to true to see visual verification of rotational symmetry
const SHOW_VISUAL = false

console.log(`Generating puzzles for ${YEAR}...`)
console.log(`Range: ${START_MONTH}/${START_DAY} to ${END_MONTH}/${END_DAY}`)
if (SHOW_VISUAL) {
  console.log('Visual symmetry verification enabled\n')
  process.env.SHOW_SYMMETRY_VISUAL = 'true'
}

const puzzles = generatePuzzlesForYear(YEAR, START_MONTH, START_DAY, END_MONTH, END_DAY)

// Save to file
const outputFile = path.join(OUTPUT_DIR, `${YEAR}.json`)
fs.writeFileSync(outputFile, JSON.stringify(puzzles, null, 2))

console.log(`\n✓ Saved to ${outputFile}`)
console.log('\nTo generate more puzzles, edit the date range in this script.')
console.log('To generate a full year, set END_MONTH = 12 and END_DAY = null')

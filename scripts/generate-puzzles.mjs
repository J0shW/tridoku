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

const DIFFICULTY_CONFIGS = {
  easy: { minGivens: 40, maxGivens: 50 },
  medium: { minGivens: 30, maxGivens: 40 },
  hard: { minGivens: 22, maxGivens: 30 }
}

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

function removeCellsWithUniqueness(board, targetGivens, seed) {
  console.log(`  [Generator] Removing cells (target: ${targetGivens} givens)...`)
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
    const positions = []
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
        console.log(`  [Generator] Pass ${passNumber}, attempt ${totalAttempts}: ${currentGivens} givens`)
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
    
    console.log(`  [Generator] Pass ${passNumber}: ${removalThisPass} cells removed, ${currentGivens} givens remaining`)
    
    // If we made no progress this pass, we're done
    if (removalThisPass === 0) {
      console.log(`  [Generator] No more cells can be removed while maintaining uniqueness`)
      break
    }
    
    // Safety check: if we've done too many passes, stop
    if (passNumber >= 10) {
      console.log(`  [Generator] Maximum passes reached`)
      break
    }
  }
  
  const totalDuration = Date.now() - startTime
  console.log(`  [Generator] Removed ${totalRemovals} cells in ${totalDuration}ms: ${currentGivens} givens`)

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

function generatePuzzle(difficulty = 'medium', seed) {
  const config = DIFFICULTY_CONFIGS[difficulty]
  const generationSeed = seed !== undefined ? seed : Math.floor(Math.random() * 1000000)
  
  const board = generateCompleteSolution(generationSeed)
  
  const rng = createSeededRandom(generationSeed + 500)
  const targetGivens = Math.floor(
    config.minGivens + rng.next() * (config.maxGivens - config.minGivens + 1)
  )
  console.log(`  [Generator] Target givens: ${targetGivens}`)
  
  const puzzle = removeCellsWithUniqueness(board, targetGivens, generationSeed)
  
  return puzzle
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
const START_DAY = 19
const END_MONTH = 3    // March
const END_DAY = 21     // Generate through March 21

console.log(`Generating puzzles for ${YEAR}...`)
console.log(`Range: ${START_MONTH}/${START_DAY} to ${END_MONTH}/${END_DAY}`)

const puzzles = generatePuzzlesForYear(YEAR, START_MONTH, START_DAY, END_MONTH, END_DAY)

// Save to file
const outputFile = path.join(OUTPUT_DIR, `${YEAR}.json`)
fs.writeFileSync(outputFile, JSON.stringify(puzzles, null, 2))

console.log(`\n✓ Saved to ${outputFile}`)
console.log('\nTo generate more puzzles, edit the date range in this script.')
console.log('To generate a full year, set END_MONTH = 12 and END_DAY = null')

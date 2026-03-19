// Verify if the IS_THIS_SOLVABLE puzzle is actually solvable
// This is a standalone script to test the puzzle

import { loadPuzzle, countSolutions } from './lib/tridoku.ts'

const IS_THIS_SOLVABLE =
  '0' +           // row 0
  '905' +         // row 1
  '62400' +       // row 2
  '4075031' +     // row 3
  '010946050' +   // row 4
  '05008090600' + // row 5
  '0800000581300' + // row 6
  '170650869200800' + // row 7
  '09608000450621540'  // row 8

console.log('Loading puzzle...')
const board = loadPuzzle(IS_THIS_SOLVABLE)

// Count how many givens
let givens = 0
for (const row of board) {
  for (const cell of row) {
    if (!cell.hidden && cell.value !== null) {
      givens++
    }
  }
}

console.log(`\nPuzzle has ${givens} givens (81 total cells)`)
console.log('\nCounting solutions (this may take a few seconds)...\n')

const startTime = Date.now()
const solutions = countSolutions(board, 2)
const endTime = Date.now()

console.log(`Time taken: ${endTime - startTime}ms\n`)

if (solutions === 0) {
  console.log('❌ UNSOLVABLE - This puzzle has NO solutions!')
  console.log('   The puzzle has contradicting constraints.')
} else if (solutions === 1) {
  console.log('✅ SOLVABLE - This puzzle has exactly ONE solution!')
  console.log('   The puzzle is valid and can be solved.')
} else {
  console.log(`⚠️  MULTIPLE SOLUTIONS - This puzzle has ${solutions}+ solutions!`)
  console.log('   The puzzle is ambiguous and not suitable for play.')
}

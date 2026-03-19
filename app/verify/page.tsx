"use client"

import { useEffect, useState } from "react"
import { loadPuzzle, countSolutions, solvePuzzle, Board } from "@/lib/tridoku"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"

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

export default function VerifyPuzzlePage() {
  const [result, setResult] = useState<{
    solutions: number
    givens: number
    time: number
    status: 'unsolvable' | 'solvable' | 'multiple'
    solution: Board | null
  } | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    setIsChecking(true)
    
    // Run the verification in a setTimeout to allow UI to render
    setTimeout(() => {
      const board = loadPuzzle(IS_THIS_SOLVABLE)
      
      // Count givens
      let givens = 0
      for (const row of board) {
        for (const cell of row) {
          if (!cell.hidden && cell.value !== null) {
            givens++
          }
        }
      }

      const startTime = Date.now()
      const solutions = countSolutions(board, 2)
      const solution = solvePuzzle(board)
      const endTime = Date.now()

      let status: 'unsolvable' | 'solvable' | 'multiple'
      if (solutions === 0) {
        status = 'unsolvable'
      } else if (solutions === 1) {
        status = 'solvable'
      } else {
        status = 'multiple'
      }

      setResult({
        solutions,
        givens,
        time: endTime - startTime,
        status,
        solution
      })
      setIsChecking(false)
    }, 100)
  }, [])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Puzzle Verification Test</CardTitle>
          <CardDescription>
            Testing if the IS_THIS_SOLVABLE puzzle is actually solvable
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isChecking ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <Spinner className="h-8 w-8" />
              <p className="text-muted-foreground">Analyzing puzzle...</p>
            </div>
          ) : result ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Givens:</p>
                  <p className="text-2xl font-bold">{result.givens} / 81</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Analysis Time:</p>
                  <p className="text-2xl font-bold">{result.time}ms</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                {result.status === 'unsolvable' && (
                  <div className="space-y-2">
                    <p className="text-2xl font-bold text-red-600">❌ UNSOLVABLE</p>
                    <p className="text-muted-foreground">
                      This puzzle has <strong>NO solutions</strong>. There are contradicting constraints
                      that make it impossible to solve. The generator likely has a bug.
                    </p>
                  </div>
                )}

                {result.status === 'solvable' && (
                  <div className="space-y-2">
                    <p className="text-2xl font-bold text-green-600">✅ SOLVABLE</p>
                    <p className="text-muted-foreground">
                      This puzzle has <strong>exactly ONE solution</strong>. It is valid and can be solved!
                    </p>
                  </div>
                )}

                {result.status === 'multiple' && (
                  <div className="space-y-2">
                    <p className="text-2xl font-bold text-yellow-600">⚠️ MULTIPLE SOLUTIONS</p>
                    <p className="text-muted-foreground">
                      This puzzle has <strong>{result.solutions}+ solutions</strong>. It is ambiguous and
                      not suitable for play. The generator should not produce puzzles like this.
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground font-mono whitespace-pre">
                  {IS_THIS_SOLVABLE}
                </p>
              </div>

              {result.solution && (
                <div className="pt-4 border-t">
                  <h3 className="text-lg font-semibold mb-3">Solution:</h3>
                  <div className="space-y-1 font-mono text-xs">
                    {result.solution.map((row, rowIdx) => (
                      <div key={rowIdx} className="flex gap-1">
                        {row.map((cell, colIdx) => (
                          <div
                            key={colIdx}
                            className={`w-6 h-6 flex items-center justify-center ${
                              cell.hidden
                                ? 'invisible'
                                : cell.isGiven
                                ? 'bg-primary/10 font-bold'
                                : 'bg-secondary'
                            }`}
                          >
                            {!cell.hidden && cell.value}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Bold numbers were givens, regular numbers are the solution.
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

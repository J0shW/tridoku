"use client"

import { useState } from "react"
import { generatePuzzle, Difficulty } from "@/lib/tridoku"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

interface TestResult {
  difficulty: Difficulty
  seed: number
  duration: number
  givens: number
  totalCells: number
  success: boolean
  error?: string
}

export default function PerformanceTestPage() {
  const [results, setResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const runTests = async () => {
    setIsRunning(true)
    setResults([])
    
    // Clear console for clean logs
    console.clear()
    console.log('%c=== TRIDOKU GENERATOR TEST ===', 'color: #00ff00; font-weight: bold; font-size: 16px;')
    
    // Only test easy mode for now
    const difficulties: Difficulty[] = ['easy']
    const newResults: TestResult[] = []
    
    for (let i = 0; i < difficulties.length; i++) {
      const difficulty = difficulties[i]
      const seed = 12345 + i
      
      // Allow UI to update
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const startTime = Date.now()
      
      try {
        const puzzle = generatePuzzle(difficulty, seed)
        const endTime = Date.now()
        const duration = endTime - startTime
        
        // Count givens
        let givens = 0
        let totalCells = 0
        for (const row of puzzle) {
          for (const cell of row) {
            if (cell.hidden) continue
            totalCells++
            if (cell.value !== null) {
              givens++
            }
          }
        }
        
        newResults.push({
          difficulty,
          seed,
          duration,
          givens,
          totalCells,
          success: true
        })
        
        setResults([...newResults])
        
      } catch (error) {
        const endTime = Date.now()
        const duration = endTime - startTime
        
        newResults.push({
          difficulty,
          seed,
          duration,
          givens: 0,
          totalCells: 81,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        })
        
        setResults([...newResults])
      }
    }
    
    setIsRunning(false)
  }

  const getPerformanceColor = (duration: number) => {
    if (duration > 5000) return 'text-red-600'
    if (duration > 2000) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getPerformanceLabel = (duration: number) => {
    if (duration > 5000) return '⚠️ Too Slow'
    if (duration > 2000) return '⚠️ Slow'
    return '✓ Good'
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Puzzle Generator Performance Test</CardTitle>
            <CardDescription>
              Test the speed of easy puzzle generation. Check browser console for detailed logs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <Button 
                onClick={runTests} 
                disabled={isRunning}
                size="lg"
                className="w-full"
              >
                {isRunning ? (
                  <>
                    <Spinner className="h-4 w-4 mr-2" />
                    Running Tests...
                  </>
                ) : (
                  'Run Performance Tests'
                )}
              </Button>

              {results.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Results:</h3>
                  
                  {results.map((result, index) => (
                    <Card key={index} className={!result.success ? 'border-red-500' : ''}>
                      <CardContent className="pt-6">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-lg font-bold capitalize">
                              {result.difficulty}
                            </h4>
                            <span className={`font-bold ${getPerformanceColor(result.duration)}`}>
                              {getPerformanceLabel(result.duration)}
                            </span>
                          </div>
                          
                          {result.success ? (
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Duration:</p>
                                <p className="text-xl font-bold">
                                  {result.duration}ms
                                  <span className="text-sm font-normal text-muted-foreground ml-2">
                                    ({(result.duration / 1000).toFixed(2)}s)
                                  </span>
                                </p>
                              </div>
                              
                              <div>
                                <p className="text-muted-foreground">Seed:</p>
                                <p className="font-mono">{result.seed}</p>
                              </div>
                              
                              <div>
                                <p className="text-muted-foreground">Givens:</p>
                                <p className="font-bold">{result.givens} / {result.totalCells}</p>
                              </div>
                              
                              <div>
                                <p className="text-muted-foreground">Empty Cells:</p>
                                <p className="font-bold">{result.totalCells - result.givens}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="text-red-600">
                              <p className="font-bold">Failed after {result.duration}ms</p>
                              <p className="text-sm mt-2">Error: {result.error}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {results.length === 1 && (
                    <Card className="bg-primary/5">
                      <CardContent className="pt-6">
                        <h4 className="font-semibold mb-2">Test Complete</h4>
                        <div className="space-y-1 text-sm">
                          <p>Generation time: {results[0].duration}ms</p>
                          <p>Success: {results[0].success ? 'Yes' : 'No'}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-4 text-center">
          <Button variant="ghost" onClick={() => window.location.href = '/'}>
            ← Back to Game
          </Button>
        </div>
      </div>
    </div>
  )
}

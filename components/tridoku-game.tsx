"use client"

import { useState, useEffect, useCallback } from "react"
import { useTridoku } from "@/hooks/use-tridoku"
import { TridokuBoard } from "@/components/tridoku-board"
import { NumberPad } from "@/components/number-pad"
import { GameControls } from "@/components/game-controls"
import { TimerDisplay } from "@/components/timer-display"
import { StatsModal } from "@/components/stats-modal"
import { WinModal } from "@/components/win-modal"
import { RulesModal } from "@/components/rules-modal"
import { Button } from "@/components/ui/button"
import { getPuzzleNumber } from "@/lib/tridoku"
import { HelpCircle, BarChart3, Triangle } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"

export function TridokuGame() {
  const {
    cells,
    selectedCell,
    isComplete,
    isPaused,
    elapsedTime,
    showErrors,
    stats,
    isLoading,
    selectCell,
    setValue,
    clearCell,
    toggleErrors,
    togglePause,
    resetPuzzle,
    getShareText,
  } = useTridoku()

  const [showStats, setShowStats] = useState(false)
  const [showWin, setShowWin] = useState(false)
  const [showRules, setShowRules] = useState(false)

  // Show win modal when complete
  useEffect(() => {
    if (isComplete) {
      const timer = setTimeout(() => setShowWin(true), 500)
      return () => clearTimeout(timer)
    }
  }, [isComplete])

  // Keyboard support
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (isComplete || isPaused) return

    const key = e.key
    
    // Number keys
    if (key >= "1" && key <= "9") {
      setValue(parseInt(key))
      return
    }

    // Delete/Backspace
    if (key === "Delete" || key === "Backspace") {
      clearCell()
      return
    }

    // Escape to deselect
    if (key === "Escape") {
      selectCell(null)
      return
    }
  }, [isComplete, isPaused, setValue, clearCell, selectCell])

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="h-8 w-8 text-primary" />
          <p className="text-muted-foreground">Loading today&apos;s puzzle...</p>
        </div>
      </div>
    )
  }

  const puzzleNumber = getPuzzleNumber()

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Triangle className="h-6 w-6 text-primary fill-primary/20" />
            <div>
              <h1 className="text-xl font-bold text-foreground">Daily Tridoku</h1>
              <p className="text-xs text-muted-foreground">Puzzle #{puzzleNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowRules(true)}
              aria-label="How to play"
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowStats(true)}
              aria-label="Statistics"
            >
              <BarChart3 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">
        {/* Timer and controls row */}
        <div className="flex items-center justify-between">
          <TimerDisplay seconds={elapsedTime} isPaused={isPaused} />
          <GameControls
            isPaused={isPaused}
            showErrors={showErrors}
            onTogglePause={togglePause}
            onToggleErrors={toggleErrors}
            onReset={resetPuzzle}
            isComplete={isComplete}
          />
        </div>

        {/* Game board */}
        <div className="flex-1 flex items-center justify-center py-4">
          <div className="w-full max-w-md">
            <TridokuBoard
              cells={cells}
              onCellClick={selectCell}
              isPaused={isPaused}
            />
          </div>
        </div>

        {/* Number pad */}
        <div className="py-4">
          <NumberPad
            onNumberClick={setValue}
            onClear={clearCell}
            disabled={isPaused || isComplete || selectedCell === null}
          />
        </div>

        {/* Streak display */}
        {stats.currentStreak > 0 && (
          <div className="text-center pb-4">
            <p className="text-sm text-muted-foreground">
              Current Streak: <span className="font-bold text-primary">{stats.currentStreak}</span>
            </p>
          </div>
        )}
      </main>

      {/* Modals */}
      <StatsModal
        open={showStats}
        onOpenChange={setShowStats}
        stats={stats}
      />

      <WinModal
        open={showWin}
        onOpenChange={setShowWin}
        stats={stats}
        elapsedTime={elapsedTime}
        getShareText={getShareText}
      />

      <RulesModal
        open={showRules}
        onOpenChange={setShowRules}
      />
    </div>
  )
}

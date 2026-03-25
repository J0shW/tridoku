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
import { DifficultySelector } from "@/components/difficulty-selector"
import { InputModeToggle } from "@/components/input-mode-toggle"
import { ArchiveCalendarModal } from "@/components/archive-calendar-modal"
import { Button } from "@/components/ui/button"
import { Difficulty } from "@/lib/tridoku"
import { getPuzzleNumber, getArrowTarget, TRIDOKU_BOARD } from "@/lib/tridoku"
import { HelpCircle, BarChart3, Triangle, Eye, Moon, Sun, CalendarDays, ArrowRight } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { useTheme } from "next-themes"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function TridokuGame() {
  const {
    cells,
    selectedCellId,
    isComplete,
    isPaused,
    elapsedTime,
    showErrors,
    difficulty,
    hasStarted,
    isViewMode,
    inputMode,
    selectedDate,
    isToday,
    stats,
    isLoading,
    isGenerating,
    selectCell,
    setValue,
    clearCell,
    toggleErrors,
    togglePause,
    resetPuzzle,
    loadTestSolve,
    getShareText,
    generateNewPuzzle,
    changeDifficulty,
    isGameActive,
    setInputMode,
    loadArchivedPuzzle,
    goToToday,
    setSelectedDate,
  } = useTridoku()

  const { theme, setTheme } = useTheme()

  const [showStats, setShowStats] = useState(false)
  const [showWin, setShowWin] = useState(false)
  const [showRules, setShowRules] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [pendingDifficulty, setPendingDifficulty] = useState<Difficulty | null>(null)

  // Handle difficulty change with confirmation if needed
  const handleDifficultyChange = useCallback((newDifficulty: Difficulty) => {
    if (isGameActive()) {
      setPendingDifficulty(newDifficulty)
      setShowConfirm(true)
    } else {
      changeDifficulty(newDifficulty)
    }
  }, [isGameActive, changeDifficulty])

  const confirmDifficultyChange = useCallback(() => {
    if (pendingDifficulty) {
      changeDifficulty(pendingDifficulty)
      setPendingDifficulty(null)
    }
    setShowConfirm(false)
  }, [pendingDifficulty, changeDifficulty])

  const cancelDifficultyChange = useCallback(() => {
    setPendingDifficulty(null)
    setShowConfirm(false)
  }, [])

  // Handle archive date selection - if hasStarted, load for current difficulty; otherwise just update the date
  const handleArchiveDateSelect = useCallback((date: Date) => {
    if (hasStarted && difficulty) {
      loadArchivedPuzzle(date, difficulty)
    } else {
      // Just update the selected date - user will pick difficulty after
      setSelectedDate(date)
    }
  }, [loadArchivedPuzzle, difficulty, hasStarted, setSelectedDate])

  // Format the selected date for display
  const formatDisplayDate = (date: Date) => {
    const today = new Date()
    const isToday = date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    
    if (isToday) {
      return "Today"
    }
    
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

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

    const key = e.key.toLowerCase()
    
    // Toggle pen/pencil mode with 'p' key
    if (key === "p") {
      setInputMode(inputMode === 'pen' ? 'pencil' : 'pen')
      return
    }
    
    // Number keys
    if (e.key >= "1" && e.key <= "9") {
      setValue(parseInt(e.key))
      return
    }

    // Delete/Backspace
    if (key === "delete" || key === "backspace") {
      clearCell()
      return
    }

    // Escape to deselect
    if (key === "escape") {
      selectCell(null)
      return
    }

    // Arrow keys to move selection
    if (selectedCellId && (key === "arrowup" || key === "arrowdown" || key === "arrowleft" || key === "arrowright")) {
      e.preventDefault()
      const dir = key === "arrowup" ? "up" : key === "arrowdown" ? "down" : key === "arrowleft" ? "left" : "right"
      const target = getArrowTarget(TRIDOKU_BOARD, selectedCellId, dir)
      if (target) selectCell(target)
      return
    }
  }, [isComplete, isPaused, setValue, clearCell, selectCell, selectedCellId, inputMode, setInputMode])

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
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
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
        {!hasStarted ? (
          /* Welcome screen - choose difficulty */
          <div className="flex-1 flex items-center justify-center">
            <div className="max-w-md w-full space-y-8 text-center">
              <div className="space-y-4">
                <div className="flex justify-center">
                  <Triangle className="h-20 w-20 text-primary fill-primary/20" />
                </div>
                <h2 className="text-4xl font-bold text-foreground">Welcome to Tridoku</h2>
                
                {/* Date display with calendar button */}
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowCalendar(true)}
                    aria-label="Open puzzle archive"
                    className="h-10 w-10"
                  >
                    <CalendarDays className="h-5 w-5" />
                  </Button>
                  <span className="text-2xl font-semibold text-foreground">
                    {formatDisplayDate(selectedDate)}
                  </span>
                  {!isToday && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={goToToday}
                      className="text-primary hover:text-primary/80 gap-1"
                    >
                      Today
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <p className="text-lg text-muted-foreground">
                  Choose your difficulty level to begin {isToday ? "today's" : "this"} puzzle
                </p>
              </div>

              <div className="space-y-6 pt-4">
                <div className="space-y-3">
                  <button
                    onClick={() => changeDifficulty('easy', selectedDate)}
                    disabled={isGenerating}
                    className="w-full py-6 px-8 rounded-lg border-2 border-[#98ac8b] bg-[#bfdde2] hover:opacity-80 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <h3 className="text-2xl font-bold text-[#2d5a3a] group-hover:text-[#1f4028]">Easy</h3>
                        <p className="text-sm text-[#4a6b56] mt-1">40-50 starting numbers</p>
                      </div>
                      {isToday && stats.easy.completedToday && (
                        <div className="text-[#2d5a3a] text-sm font-semibold">Completed</div>
                      )}
                    </div>
                  </button>

                  <button
                    onClick={() => changeDifficulty('medium', selectedDate)}
                    disabled={isGenerating}
                    className="w-full py-6 px-8 rounded-lg border-2 border-[#e2885b] bg-[#ecbd6c] hover:opacity-80 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <h3 className="text-2xl font-bold text-[#6b4423] group-hover:text-[#4d2f18]">Medium</h3>
                        <p className="text-sm text-[#8a5f3a] mt-1">30-40 starting numbers</p>
                      </div>
                      {isToday && stats.medium.completedToday && (
                        <div className="text-[#6b4423] text-sm font-semibold">Completed</div>
                      )}
                    </div>
                  </button>

                  <button
                    onClick={() => changeDifficulty('hard', selectedDate)}
                    disabled={isGenerating}
                    className="w-full py-6 px-8 rounded-lg border-2 border-[#b47098] bg-[#e26495] hover:opacity-80 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <h3 className="text-2xl font-bold text-[#6b2447] group-hover:text-[#4d1a33]">Hard</h3>
                        <p className="text-sm text-[#8a456b] mt-1">24-30 starting numbers</p>
                      </div>
                      {isToday && stats.hard.completedToday && (
                        <div className="text-[#6b2447] text-sm font-semibold">Completed</div>
                      )}
                    </div>
                  </button>
                </div>

                {isGenerating && (
                  <div className="flex items-center justify-center gap-3 py-4">
                    <Spinner className="h-5 w-5 text-primary" />
                    <p className="text-muted-foreground">Loading puzzle...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Game view - active puzzle */
          <>
            {/* Date display with calendar button */}
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowCalendar(true)}
                aria-label="Open puzzle archive"
                className="h-10 w-10"
              >
                <CalendarDays className="h-5 w-5" />
              </Button>
              <h2 className="text-2xl font-bold text-foreground">
                {formatDisplayDate(selectedDate)}
              </h2>
              {!isToday && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToToday}
                  className="text-primary hover:text-primary/80 gap-1"
                >
                  Today
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Difficulty selector */}
            <div className="flex justify-center">
              <DifficultySelector
                currentDifficulty={difficulty!}
                stats={stats}
                onDifficultyChange={handleDifficultyChange}
                disabled={isGenerating}
              />
            </div>
            
            {/* Timer and controls row */}
            <div className="flex items-center justify-between">
              <TimerDisplay seconds={elapsedTime} isPaused={isPaused} />
              <GameControls
                isPaused={isPaused}
                showErrors={showErrors}
                onTogglePause={togglePause}
                onToggleErrors={toggleErrors}
                onReset={resetPuzzle}
                onTestSolve={loadTestSolve}
                isComplete={isComplete}
                isViewMode={isViewMode}
                isGenerating={isGenerating}
              />
            </div>

            {/* Game board */}
            <div className="flex items-center justify-center py-4">
              <div className="w-full max-w-md">
                <TridokuBoard
                  cells={cells}
                  selectedCellId={selectedCellId}
                  onCellClick={selectCell}
                  isPaused={isPaused}
                  difficulty={difficulty}
                />
              </div>
            </div>

            {/* View mode indicator */}
            {isViewMode && (
              <div className="bg-[#bfdde2]/60 dark:bg-[#bfdde2]/90 border-2 border-[#98ac8b] rounded-lg p-4 flex items-center justify-center gap-2">
                <Eye className="h-5 w-5 text-[#2d5a3a]" />
                <p className="text-[#2d5a3a] font-semibold">
                  View Mode: You completed this puzzle today!
                </p>
              </div>
            )}
            {/* Input mode toggle and number pad */}
            {!isViewMode && (
              <div className="pb-4 space-y-4">
                <div className="flex justify-center">
                  <InputModeToggle
                    mode={inputMode}
                    onModeChange={setInputMode}
                    disabled={isPaused || isComplete}
                  />
                </div>
                <NumberPad
                  onNumberClick={setValue}
                  onClear={clearCell}
                  disabled={isPaused || isComplete || selectedCellId === null || isViewMode}
                />
              </div>
            )}

            {/* Streak display */}
            {difficulty && stats[difficulty].currentStreak > 0 && (
              <div className="text-center pb-4">
                <p className="text-sm text-muted-foreground">
                  Current Streak: <span className="font-bold text-primary">{stats[difficulty].currentStreak}</span>
                </p>
              </div>
            )}
          </>
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
        difficulty={difficulty || 'medium'}
        elapsedTime={elapsedTime}
        getShareText={getShareText}
      />

      <RulesModal
        open={showRules}
        onOpenChange={setShowRules}
      />

      <ArchiveCalendarModal
        open={showCalendar}
        onOpenChange={setShowCalendar}
        selectedDate={selectedDate}
        onDateSelect={handleArchiveDateSelect}
      />

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Abandon Current Game?</AlertDialogTitle>
            <AlertDialogDescription>
              You have a game in progress. Switching difficulty will abandon your current progress and start a new puzzle. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDifficultyChange}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDifficultyChange}>Switch Difficulty</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

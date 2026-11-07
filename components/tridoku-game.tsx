"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useTridoku } from "@/hooks/use-tridoku"
import { TridokuBoard } from "@/components/tridoku-board"
import { NumberPad } from "@/components/number-pad"
import { GameControls } from "@/components/game-controls"
import { TimerDisplay } from "@/components/timer-display"
import { StatsModal } from "@/components/stats-modal"
import { WinModal } from "@/components/win-modal"
import { RulesModal, POWER_CELLS_TIP_INDEX, type RulesTab } from "@/components/rules-modal"
import { DifficultySelector } from "@/components/difficulty-selector"
import { KofiWidget } from "@/components/kofi-widget"
import { TallyWidget } from "@/components/tally-widget"
import { InputModeToggle } from "@/components/input-mode-toggle"
import { WelcomeScreen } from "@/components/welcome-screen"
import { Button } from "@/components/ui/button"
import { getArrowTarget, TRIDOKU_BOARD } from "@/lib/tridoku"
import { HelpCircle, BarChart3, Triangle, Eye, Moon, Sun, X, RotateCw } from "lucide-react"
import { format } from "date-fns"
import { fromDateKey } from "@/lib/dates"
import { Spinner } from "@/components/ui/spinner"
import { useTheme } from "next-themes"
import Link from "next/link"
import { trackEvent } from "@/lib/analytics"
import dynamic from "next/dynamic"
import { IS_PRODUCTION } from "@/lib/app-env"

// Loaded only outside production, so it never ships to players.
const DevTools = dynamic(() => import("@/components/dev-tools").then((m) => m.DevTools), { ssr: false })


function LoadErrorNotice({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-4 text-center">
      <p className="text-sm text-foreground">
        Couldn&apos;t load today&apos;s puzzle. Check your connection and try again.
      </p>
      <Button size="sm" onClick={onRetry} className="gap-2">
        <RotateCw className="h-4 w-4" />
        Retry
      </Button>
    </div>
  )
}

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
    highlightedValue,
    puzzleNumber,
    fallback,
    progressToday,
    previewPuzzle,
    loadError,
    retryLoad,
    stats,
    isLoading,
    isGenerating,
    selectCell,
    setValue,
    clearCell,
    toggleErrors,
    togglePause,
    resetPuzzle,
    getShareText,
    generateNewPuzzle,
    changeDifficulty,
    setInputMode,
  } = useTridoku()

  const { theme, setTheme } = useTheme()

  const [showStats, setShowStats] = useState(false)
  const [showWin, setShowWin] = useState(false)
  const [showRules, setShowRules] = useState(false)
  const [pencilTipDismissed, setPencilTipDismissed] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('tridoku-pencil-tip-dismissed') === 'true'
  })

  const dismissPencilTip = useCallback(() => {
    setPencilTipDismissed(true)
    localStorage.setItem('tridoku-pencil-tip-dismissed', 'true')
  }, [])

  // Which card the rules open at, and whether this is the first-visit intro (TRI-029)
  const [rulesView, setRulesView] = useState<{ tab: RulesTab; step: number; firstTime: boolean }>({
    tab: "rules",
    step: 0,
    firstTime: false,
  })

  const openRulesAt = useCallback((tab: RulesTab, step: number, firstTime = false) => {
    trackEvent("rules_opened", { tab, auto: firstTime })
    try {
      localStorage.setItem("tridoku-rules-seen", "true") // read by puzzle_started (TRI-016)
    } catch {
      /* storage unavailable */
    }
    setRulesView({ tab, step, firstTime })
    setShowRules(true)
  }, [])

  const openRules = useCallback(() => openRulesAt("rules", 0), [openRulesAt])

  // First visit (nothing played, nothing in progress, rules never opened): starting a
  // puzzle also opens the three rule cards over it (TRI-029).
  const playFromWelcome = useCallback(
    (d: Parameters<typeof changeDifficulty>[0]) => {
      let rulesSeen = false
      try {
        rulesSeen = localStorage.getItem("tridoku-rules-seen") === "true"
      } catch {
        /* storage unavailable */
      }
      const firstVisit =
        !rulesSeen &&
        Object.values(stats).every((st) => st.gamesPlayed === 0 && st.gamesWon === 0) &&
        Object.keys(progressToday).length === 0
      if (firstVisit) openRulesAt("rules", 0, true)
      changeDifficulty(d)
    },
    [stats, progressToday, changeDifficulty, openRulesAt],
  )

  // TRI-030: after 60 s without a new rule-abiding entry, offer the Power Cells tip once.
  const POWER_TIP_KEY = "tridoku-tip-power-cells-seen"
  const progressCount = useMemo(
    () => cells.flat().filter((c) => !c.hidden && !c.isGiven && c.value != null && !c.hasError).length,
    [cells],
  )
  const lastProgressAt = useRef(0)
  useEffect(() => {
    lastProgressAt.current = Date.now()
  }, [progressCount, difficulty, isPaused])
  const [showPowerTip, setShowPowerTip] = useState(false)
  useEffect(() => {
    if (!hasStarted || isViewMode || isComplete || isPaused) return
    const timer = setInterval(() => {
      if (Date.now() - lastProgressAt.current < 60_000) return
      try {
        if (localStorage.getItem(POWER_TIP_KEY) === "true") return
        localStorage.setItem(POWER_TIP_KEY, "true")
      } catch {
        return
      }
      setShowPowerTip(true)
      trackEvent("tip_shown", { tip: "power_cells", difficulty: difficulty ?? "unknown" })
    }, 5_000)
    return () => clearInterval(timer)
  }, [hasStarted, isViewMode, isComplete, isPaused, difficulty])


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
    
    // Toggle pen/pencil mode with 'p' key or spacebar
    if (key === "p" || key === " ") {
      e.preventDefault() // Prevent spacebar from scrolling the page
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
              onClick={openRules}
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
          <WelcomeScreen
            stats={stats}
            progressToday={progressToday}
            previewPuzzle={previewPuzzle}
            isGenerating={isGenerating}
            errorNotice={loadError && !isGenerating ? <LoadErrorNotice onRetry={retryLoad} /> : null}
            onPlay={playFromWelcome}
            onOpenRules={openRules}
          />
        ) : (
          /* Game view - active puzzle */
          <>
            {/* Difficulty selector */}
            <div className="flex justify-center">
              <DifficultySelector
                currentDifficulty={difficulty!}
                inProgress={progressToday}
                stats={stats}
                onDifficultyChange={changeDifficulty}
                disabled={isGenerating}
              />
            </div>
            
            {loadError && !isGenerating && <LoadErrorNotice onRetry={retryLoad} />}
            {fallback && !isViewMode && (
              <p role="status" className="rounded-lg border border-border bg-muted/60 px-4 py-2.5 text-center text-sm text-muted-foreground">
                Today&apos;s puzzle isn&apos;t ready yet, so here&apos;s{" "}
                {fallback.sourceDate
                  ? <>the puzzle from {format(fromDateKey(fallback.sourceDate), "d MMMM")}</>
                  : <>a backup puzzle</>}
                . It still counts toward your streak.
              </p>
            )}

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
                  highlightedValue={highlightedValue}
                  showErrors={showErrors}
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
                {showPowerTip && !isComplete && (
                  <div role="status" className="relative bg-muted/60 border border-border rounded-lg px-4 py-2.5 pr-8 text-center text-sm text-muted-foreground">
                    <button
                      onClick={() => setShowPowerTip(false)}
                      className="absolute top-1.5 right-1.5 p-0.5 rounded-sm hover:bg-muted-foreground/20 transition-colors"
                      aria-label="Dismiss tip"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    Stuck? A digit just outside a region rules out every cell it touches inside that region.
                    That often leaves only one place for it.{" "}
                    <button
                      className="font-medium text-foreground underline underline-offset-2"
                      onClick={() => {
                        setShowPowerTip(false)
                        openRulesAt("tips", POWER_CELLS_TIP_INDEX)
                      }}
                    >
                      Show me
                    </button>
                  </div>
                )}
                {inputMode === 'pencil' && !pencilTipDismissed && (
                  <div className="relative bg-muted/60 border border-border rounded-lg px-4 py-2.5 text-center text-sm text-muted-foreground">
                    <button
                      onClick={dismissPencilTip}
                      className="absolute top-1.5 right-1.5 p-0.5 rounded-sm hover:bg-muted-foreground/20 transition-colors"
                      aria-label="Dismiss tip"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    Tap a number to toggle a pencil mark. Tap again to remove it. Press backspace to clear all marks. Press space or &apos;p&apos; to swap modes.
                  </div>
                )}
                <NumberPad
                  onNumberClick={setValue}
                  onClear={clearCell}
                  disabled={isPaused || isComplete || selectedCellId === null || isViewMode}
                  activePencilMarks={
                    inputMode === 'pencil' && selectedCellId
                      ? (() => {
                          const [r, c] = selectedCellId.split('-').map(Number)
                          return cells[r]?.[c]?.pencilMarks || []
                        })()
                      : undefined
                  }
                />
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
        puzzleNumber={puzzleNumber}
        getShareText={getShareText}
      />

      <RulesModal
        open={showRules}
        onOpenChange={setShowRules}
        initialTab={rulesView.tab}
        initialStep={rulesView.step}
        firstTime={rulesView.firstTime}
      />

      {!IS_PRODUCTION && (
        <DevTools
          cells={cells}
          difficulty={difficulty}
          isViewMode={isViewMode}
          onReloadPuzzle={generateNewPuzzle}
        />
      )}

      <footer className="text-center pt-4 pb-24 sm:pb-4 px-4 text-xs text-muted-foreground/60">
        <div className="mb-4 flex flex-wrap items-center justify-center gap-3">
          <KofiWidget />
          <TallyWidget />
        </div>
        <p className="mb-2">No sign-up. We count anonymous play statistics to improve the game.</p>
        <span>© {new Date().getFullYear()} Josh Whitney</span>
        <span className="mx-2">·</span>
        <Link href="/bts" className="hover:text-muted-foreground transition-colors">
          Behind the Scenes
        </Link>
      </footer>

    </div>
  )
}

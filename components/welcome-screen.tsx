"use client"

// The first screen: what Tridoku is, a look at today's board, and how to start.
// TRI-026 (say what it is), TRI-027 (one clear start for first-timers),
// TRI-028 (difficulties described by experience), TRI-033 (continue in-progress puzzles).

import { useMemo } from "react"
import { HelpCircle, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { TridokuBoard } from "@/components/tridoku-board"
import { formatTime, loadPuzzle, type Difficulty } from "@/lib/tridoku"
import type { GameStats, PuzzleInProgress } from "@/hooks/use-tridoku"

interface WelcomeScreenProps {
  stats: GameStats
  progressToday: Partial<Record<Difficulty, PuzzleInProgress>>
  previewPuzzle: string | null
  isGenerating: boolean
  errorNotice: React.ReactNode
  onPlay: (difficulty: Difficulty) => void
  onOpenRules: () => void
}

// Text colors chosen for at least 4.5:1 contrast on each card (TRI-067).
const DIFFICULTIES: {
  value: Difficulty
  label: string
  description: string
  card: string
  title: string
  body: string
}[] = [
  { value: "easy", label: "Easy", description: "Great first puzzle", card: "border-[#98ac8b] bg-[#bfdde2]", title: "text-[#1f4028]", body: "text-[#24442f]" },
  { value: "medium", label: "Medium", description: "Needs one trick", card: "border-[#e2885b] bg-[#ecbd6c]", title: "text-[#4d2f18]", body: "text-[#5a3a1c]" },
  { value: "hard", label: "Hard", description: "For Sudoku regulars", card: "border-[#b47098] bg-[#e26495]", title: "text-[#2e0f1f]", body: "text-[#3d1529]" },
]

export function WelcomeScreen({
  stats,
  progressToday,
  previewPuzzle,
  isGenerating,
  errorNotice,
  onPlay,
  onOpenRules,
}: WelcomeScreenProps) {
  const previewCells = useMemo(() => (previewPuzzle ? loadPuzzle(previewPuzzle) : null), [previewPuzzle])

  // First visit: nothing played on this browser and nothing in progress.
  const isFirstVisit =
    Object.values(stats).every((s) => s.gamesPlayed === 0 && s.gamesWon === 0) &&
    Object.keys(progressToday).length === 0

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="max-w-md w-full space-y-6 text-center">
        {/* Today's board, as a picture of what the game is (TRI-026) */}
        <div className="mx-auto w-full max-w-[15rem] pointer-events-none select-none" aria-hidden="true">
          {previewCells ? (
            <TridokuBoard cells={previewCells} selectedCellId={null} onCellClick={() => {}} isPaused={false} />
          ) : (
            <div className="aspect-[18/16] w-full" />
          )}
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground text-balance">Sudoku on a triangle</h2>
          <p className="text-muted-foreground text-pretty">81 cells, 4 rules, a new puzzle every day.</p>
        </div>

        {errorNotice}

        {isFirstVisit ? (
          <div className="space-y-3">
            <Button size="lg" className="w-full h-14 text-lg gap-2" onClick={() => onPlay("easy")} disabled={isGenerating}>
              <Play className="h-5 w-5" />
              Play today&apos;s puzzle
            </Button>
            <Button variant="ghost" className="gap-2" onClick={onOpenRules}>
              <HelpCircle className="h-4 w-4" />
              How to play
            </Button>
            <p className="pt-2 text-sm text-muted-foreground">Already know the rules? Pick a difficulty:</p>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Today&apos;s puzzles</p>
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={onOpenRules}>
              <HelpCircle className="h-4 w-4" />
              How to play
            </Button>
          </div>
        )}

        <div className={isFirstVisit ? "grid grid-cols-3 gap-2" : "space-y-3"}>
          {DIFFICULTIES.map((d) => {
            const done = stats[d.value].completedToday
            const inProgress = progressToday[d.value]
            return (
              <button
                key={d.value}
                onClick={() => onPlay(d.value)}
                disabled={isGenerating}
                className={`w-full rounded-lg border-2 text-left transition-all hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed ${d.card} ${
                  isFirstVisit ? "px-3 py-3" : "px-6 py-4"
                }`}
              >
                <div className={isFirstVisit ? "" : "flex items-center justify-between gap-3"}>
                  <div>
                    <h3 className={`font-bold ${d.title} ${isFirstVisit ? "text-base" : "text-xl"}`}>{d.label}</h3>
                    {!isFirstVisit && <p className={`text-sm ${d.body}`}>{d.description}</p>}
                  </div>
                  {done ? (
                    <span className={`text-sm font-semibold ${d.title}`}>✓ Completed</span>
                  ) : inProgress ? (
                    <span className={`text-sm font-semibold ${d.title} tabular-nums`}>Continue · {formatTime(inProgress.elapsedTime)}</span>
                  ) : null}
                </div>
              </button>
            )
          })}
        </div>

        {isGenerating && (
          <div className="flex items-center justify-center gap-3">
            <Spinner className="h-5 w-5 text-primary" />
            <p className="text-muted-foreground">Loading puzzle...</p>
          </div>
        )}
      </div>
    </div>
  )
}

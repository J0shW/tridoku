"use client"

import { useEffect, useState } from "react"
import { Share2, Copy, Check, ArrowRight, Trophy } from "lucide-react"
import { GameStats } from "@/hooks/use-tridoku"
import { formatTime, Difficulty } from "@/lib/tridoku"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/legacy-button"
import { StatTile } from "@/components/ui/badge"
import { KofiDialog } from "@/components/kofi-widget"
import { LiftTicketBody } from "@/components/lift-ticket"
import { trackEvent } from "@/lib/analytics"
import { msUntilNextDay, todayKey, type DateKey } from "@/lib/dates"
import {
  compareWithBest,
  DIFFICULTY_EMOJI,
  DIFFICULTY_LABEL,
  formatCountdown,
  nextUnfinished,
  type BestComparison,
} from "@/lib/share"
import { claimKofiPrompt, getRating, RATINGS, saveRating, type Rating } from "@/lib/win-prompts"

export interface WinModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stats: GameStats
  difficulty: Difficulty
  elapsedTime: number
  puzzleNumber: number
  puzzleDate: DateKey | null
  getShareText: () => string
  /** Start another difficulty from the modal (TRI-034). */
  onPlayNext: (difficulty: Difficulty) => void
  /** Mountain theme: the result is a lift ticket (TRI-105) */
  mountain?: boolean
}

export function WinModal({ open, onOpenChange, mountain = false, ...props }: WinModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {mountain ? (
        // The ticket draws its own paper (with notches); the dialog only positions it and casts
        // a shadow that follows the notched outline
        <DialogContent
          showCloseButton={false}
          className="z-60 block gap-0 overflow-visible rounded-none border-0 bg-transparent p-0 shadow-none [filter:drop-shadow(0_24px_28px_rgb(10_18_28/0.35))]"
        >
          <LiftTicketBody {...props} />
        </DialogContent>
      ) : (
        <DialogContent className="gap-3">
          {/* Mounted on each open, so the prompts below are decided once per showing */}
          <WinBody {...props} />
        </DialogContent>
      )}
    </Dialog>
  )
}

/** Share and Copy for a result, tracked by outcome (TRI-018). Used by both win cards and the finished-run card. */
export function useShareResult(difficulty: Difficulty, getShareText: () => string) {
  const [copied, setCopied] = useState(false)
  const flash = () => {
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  const share = async () => {
    const text = getShareText()
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "Daily Tridoku", text })
        trackEvent("result_shared", { difficulty, method: "native_share", outcome: "shared" })
      } catch (error) {
        const cancelled = error instanceof DOMException && error.name === "AbortError"
        trackEvent("result_shared", { difficulty, method: "native_share", outcome: cancelled ? "cancelled" : "failed" })
      }
    } else {
      try {
        await navigator.clipboard.writeText(text)
        trackEvent("result_shared", { difficulty, method: "clipboard", outcome: "copied" })
        flash()
      } catch {
        trackEvent("result_shared", { difficulty, method: "clipboard", outcome: "failed" })
      }
    }
  }
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(getShareText())
      trackEvent("result_copied", { difficulty })
      flash()
    } catch {
      // Clipboard blocked; nothing to undo
    }
  }
  return { share, copy, copied }
}

/** The one-tap difficulty rating (TRI-042), as one segmented row (TRI-094). */
export function RatingRow({ difficulty, date, elapsedTime }: { difficulty: Difficulty; date: DateKey; elapsedTime: number }) {
  const [rating, setRating] = useState<Rating | null>(() => getRating(difficulty, date))
  const rate = (value: Rating) => {
    setRating(value)
    saveRating(difficulty, date, value)
    trackEvent("difficulty_rated", { difficulty, rating: value, time: elapsedTime })
  }
  if (rating) {
    return (
      <p className="text-center text-sm text-muted-foreground" role="status">
        Thanks! You rated this puzzle {RATINGS.find((r) => r.value === rating)?.label.toLowerCase()}.
      </p>
    )
  }
  return (
    <div className="text-center">
      <p className="mb-2 text-sm text-muted-foreground">How did this puzzle feel?</p>
      <div className="flex gap-1 rounded-control border border-border bg-surface-sunken p-1" role="group" aria-label="Rate this puzzle's difficulty">
        {RATINGS.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => rate(r.value)}
            className="h-11 flex-1 rounded-[calc(var(--radius-control)-4px)] text-label font-medium text-fg-muted transition-colors hover:bg-surface-raised hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function BestLine({ comparison, difficulty }: { comparison: BestComparison; difficulty: Difficulty }) {
  const label = DIFFICULTY_LABEL[difficulty]
  switch (comparison.kind) {
    case "first":
      return <>Your first {label} solve. That&apos;s your time to beat.</>
    case "new_best":
      return (
        <span className="inline-flex items-center gap-1 font-semibold text-foreground">
          <Trophy className="h-4 w-4 text-warning" aria-hidden="true" />
          New {label} best, {formatTime(comparison.by)} faster
        </span>
      )
    case "tie":
      return <>Ties your {label} best</>
    case "slower":
      return <>Your {label} best: {formatTime(comparison.best)} (+{formatTime(comparison.by)})</>
  }
}

export function Countdown({ puzzleDate, label = "Next puzzle in" }: { puzzleDate: DateKey | null; label?: string }) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  // Finished yesterday's puzzle after midnight: today's is already out.
  if (puzzleDate && puzzleDate !== todayKey()) {
    return <p className="text-center text-sm text-muted-foreground">Today&apos;s puzzle is ready now.</p>
  }
  return (
    <p className="text-center text-sm text-muted-foreground" role="timer" aria-live="off">
      {label} <span className="font-mono font-semibold text-foreground tabular-nums">{formatCountdown(msUntilNextDay(now))}</span>
    </p>
  )
}

function WinBody(props: Omit<WinModalProps, "open" | "onOpenChange">) {
  // Show the result this card opened with. Without this, "Next: Medium" would switch the
  // closing card to Medium's numbers (and log its prompts) while it fades out.
  const [{ stats, difficulty, elapsedTime, puzzleNumber, puzzleDate, getShareText, onPlayNext }] = useState(props)
  const { share: handleShare, copy: handleCopy, copied } = useShareResult(difficulty, getShareText)
  const diffStats = stats[difficulty]
  const date = puzzleDate ?? todayKey()

  const next = nextUnfinished(difficulty, stats, todayKey())
  // Only compare when the stored stats belong to this solve
  const comparison = diffStats.lastPlayedDate === date ? compareWithBest(elapsedTime, diffStats.previousBestTime) : null

  // Decided once per opening; both are idempotent, so a double call in development is harmless.
  const [showKofi] = useState(() => claimKofiPrompt(difficulty, date, todayKey()))
  const [kofiOpen, setKofiOpen] = useState(false)

  useEffect(() => {
    if (showKofi) trackEvent("kofi_prompt_shown", { difficulty })
  }, [showKofi, difficulty])

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-center text-display-sm">Solved!</DialogTitle>
        <DialogDescription className="text-center text-base">
          Daily Tridoku #{puzzleNumber} · {DIFFICULTY_EMOJI[difficulty]} {DIFFICULTY_LABEL[difficulty]}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        {/* Time, compared with the best before this solve (TRI-034) */}
        <div className="text-center">
          <p className="text-4xl font-bold text-primary tabular-nums">{formatTime(elapsedTime)}</p>
          {comparison && (
            <p className="mt-1 text-sm text-muted-foreground">
              <BestLine comparison={comparison} difficulty={difficulty} />
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <StatTile value={diffStats.currentStreak} label="Streak" />
          <StatTile value={diffStats.maxStreak} label="Best streak" />
          <StatTile value={diffStats.gamesWon} label="Solved" />
        </div>

        <div className="flex gap-3">
          <Button onClick={handleShare} className="flex-1 h-12 text-base font-semibold">
            <Share2 className="mr-2 h-5 w-5" />
            Share
          </Button>
          <Button onClick={handleCopy} variant="outline" className="h-12 w-12" aria-label="Copy results">
            {copied ? <Check className="h-5 w-5 text-success" /> : <Copy className="h-5 w-5" />}
          </Button>
        </div>

        {next && (
          <Button variant="outline" className="w-full h-11 text-base gap-2" onClick={() => onPlayNext(next)}>
            Next: {DIFFICULTY_LABEL[next]}
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}

        {/* One-tap difficulty rating (TRI-042) */}
        <RatingRow difficulty={difficulty} date={date} elapsedTime={elapsedTime} />

        <Countdown puzzleDate={puzzleDate} />

        {/* Ko-fi, at most one puzzle a week (TRI-041) */}
        {showKofi && (
          <p className="text-center text-sm text-muted-foreground">
            Enjoying Tridoku?{" "}
            <button
              type="button"
              className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
              onClick={() => {
                trackEvent("kofi_opened", { source: "win_modal" })
                setKofiOpen(true)
              }}
            >
              Buy me a coffee ☕
            </button>
          </p>
        )}
      </div>

      <KofiDialog open={kofiOpen} onOpenChange={setKofiOpen} />
    </>
  )
}

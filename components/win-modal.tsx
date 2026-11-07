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
import { Button } from "@/components/ui/button"
import { KofiDialog } from "@/components/kofi-widget"
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

interface WinModalProps {
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
}

export function WinModal({ open, onOpenChange, ...props }: WinModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto gap-3">
        {/* Mounted on each open, so the prompts below are decided once per showing */}
        <WinBody {...props} />
      </DialogContent>
    </Dialog>
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
          <Trophy className="h-4 w-4 text-amber-500" aria-hidden="true" />
          New {label} best, {formatTime(comparison.by)} faster
        </span>
      )
    case "tie":
      return <>Ties your {label} best</>
    case "slower":
      return <>Your {label} best: {formatTime(comparison.best)} (+{formatTime(comparison.by)})</>
  }
}

function Countdown({ puzzleDate }: { puzzleDate: DateKey | null }) {
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
      Next puzzle in <span className="font-mono font-semibold text-foreground tabular-nums">{formatCountdown(msUntilNextDay(now))}</span>
    </p>
  )
}

function WinBody(props: Omit<WinModalProps, "open" | "onOpenChange">) {
  // Show the result this card opened with. Without this, "Next: Medium" would switch the
  // closing card to Medium's numbers (and log its prompts) while it fades out.
  const [{ stats, difficulty, elapsedTime, puzzleNumber, puzzleDate, getShareText, onPlayNext }] = useState(props)
  const [copied, setCopied] = useState(false)
  const diffStats = stats[difficulty]
  const date = puzzleDate ?? todayKey()

  const next = nextUnfinished(difficulty, stats, todayKey())
  // Only compare when the stored stats belong to this solve
  const comparison = diffStats.lastPlayedDate === date ? compareWithBest(elapsedTime, diffStats.previousBestTime) : null

  // Decided once per opening; both are idempotent, so a double call in development is harmless.
  const [showKofi] = useState(() => claimKofiPrompt(difficulty, date, todayKey()))
  const [rating, setRating] = useState<Rating | null>(() => getRating(difficulty, date))
  const [kofiOpen, setKofiOpen] = useState(false)

  useEffect(() => {
    if (showKofi) trackEvent("kofi_prompt_shown", { difficulty })
  }, [showKofi, difficulty])

  const rate = (value: Rating) => {
    setRating(value)
    saveRating(difficulty, date, value)
    trackEvent("difficulty_rated", { difficulty, rating: value, time: elapsedTime })
  }

  const handleShare = async () => {
    const text = getShareText()

    // Track the outcome, not the tap, so cancelled shares don't count (TRI-018)
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
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch {
        trackEvent("result_shared", { difficulty, method: "clipboard", outcome: "failed" })
      }
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getShareText())
      trackEvent("result_copied", { difficulty })
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked; nothing to undo
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-center text-3xl font-bold">Solved!</DialogTitle>
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

        <div className="grid grid-cols-3 gap-4 border-t border-border pt-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{diffStats.currentStreak}</p>
            <p className="text-xs text-muted-foreground">Current Streak</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{diffStats.maxStreak}</p>
            <p className="text-xs text-muted-foreground">Max Streak</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{diffStats.gamesWon}</p>
            <p className="text-xs text-muted-foreground">Games Won</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={handleShare} className="flex-1 h-12 text-base font-semibold">
            <Share2 className="mr-2 h-5 w-5" />
            Share
          </Button>
          <Button onClick={handleCopy} variant="outline" className="h-12 w-12" aria-label="Copy results">
            {copied ? <Check className="h-5 w-5 text-accent" /> : <Copy className="h-5 w-5" />}
          </Button>
        </div>

        {next && (
          <Button variant="outline" className="w-full h-11 text-base gap-2" onClick={() => onPlayNext(next)}>
            Next: {DIFFICULTY_LABEL[next]}
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}

        {/* One-tap difficulty rating (TRI-042) */}
        <div className="rounded-lg bg-muted/50 px-3 py-2.5 text-center">
          {rating ? (
            <p className="text-sm text-muted-foreground" role="status">
              Thanks! You rated this puzzle {RATINGS.find((r) => r.value === rating)?.label.toLowerCase()}.
            </p>
          ) : (
            <>
              <p className="mb-2 text-sm text-muted-foreground">How did this puzzle feel?</p>
              <div className="flex justify-center gap-2" role="group" aria-label="Rate this puzzle's difficulty">
                {RATINGS.map((r) => (
                  <Button key={r.value} variant="outline" size="sm" className="flex-1" onClick={() => rate(r.value)}>
                    {r.label}
                  </Button>
                ))}
              </div>
            </>
          )}
        </div>

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

"use client"

// The Mountain theme's finish (TRI-105): the result is a lift ticket, and after it closes
// the solved board stays on screen with a card for your time, Share and Next run.
// Classic keeps the "Solved!" card in win-modal.tsx; both share its logic.

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { format } from "date-fns"
import { ArrowRight, Check, Copy, Share2, Trophy, X } from "lucide-react"
import { DialogClose, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { KofiDialog } from "@/components/kofi-widget"
import { RunShape, RUN_CLASS } from "@/components/mountain"
import { Countdown, RatingRow, useShareResult, type WinModalProps } from "@/components/win-modal"
import { trackEvent } from "@/lib/analytics"
import { addDays, daysBetween, fromDateKey, todayKey, type DateKey } from "@/lib/dates"
import { compareWithBest, DIFFICULTY_LABEL, nextUnfinished } from "@/lib/share"
import { formatTime, type Difficulty } from "@/lib/tridoku"
import { claimKofiPrompt } from "@/lib/win-prompts"
import { PINS, readPins, runId } from "@/lib/pins"
import { themeDayFor } from "@/lib/theme-days"
import { PinBadge } from "@/components/season-pass"
import { cn } from "@/lib/utils"
import type { GameStats } from "@/hooks/use-tridoku"

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"]

/**
 * This week (Monday to Sunday) as hole punches: a day is punched when it's inside the
 * current streak for this run. A streak of 3 solved today punches today and the two days before.
 */
export function weekPunches(date: DateKey, streak: number, solvedOnDate: boolean): boolean[] {
  const monday = addDays(date, -((fromDateKey(date).getDay() + 6) % 7))
  return WEEKDAYS.map((_, i) => {
    const day = addDays(monday, i)
    const back = daysBetween(day, date)
    return solvedOnDate && back >= 0 && back < streak
  })
}

function Punches({ punched }: { punched: boolean[] }) {
  return (
    <div className="flex gap-1.5" aria-label={`Skied ${punched.filter(Boolean).length} of 7 days this week`} role="img">
      {punched.map((p, i) => (
        <span
          key={i}
          className={cn(
            "flex size-6 items-center justify-center rounded-full font-signage text-[11px] font-bold",
            p ? "bg-fg text-surface-raised shadow-[inset_0_2px_3px_rgb(0_0_0/0.35)]" : "border border-border text-fg-muted",
          )}
        >
          {WEEKDAYS[i]}
        </span>
      ))}
    </div>
  )
}

export function LiftTicketBody(props: Omit<WinModalProps, "open" | "onOpenChange" | "mountain">) {
  // The result this ticket opened with (see WinBody)
  const [{ stats, difficulty, elapsedTime, puzzleNumber, puzzleDate, getShareText, onPlayNext }] = useState(props)
  const { share, copy, copied } = useShareResult(difficulty, getShareText, themeDayFor(puzzleDate ?? todayKey())?.id)
  const s = stats[difficulty]
  const date = puzzleDate ?? todayKey()
  const next = nextUnfinished(difficulty, stats, todayKey())
  const solvedOnDate = s.lastPlayedDate === date
  const comparison = solvedOnDate ? compareWithBest(elapsedTime, s.previousBestTime) : null
  const [showKofi] = useState(() => claimKofiPrompt(difficulty, date, todayKey()))
  const [kofiOpen, setKofiOpen] = useState(false)
  // Pins this run just earned (TRI-108)
  const [newPins] = useState(() => {
    const book = readPins()
    return PINS.filter((p) => book[p.id]?.run === runId(difficulty, date))
  })
  useEffect(() => {
    if (showKofi) trackEvent("kofi_prompt_shown", { difficulty })
  }, [showKofi, difficulty])

  // A half-circle notch is cut out of each side at the perforation, like a real ticket.
  // The cut is a mask, so the dimmed page shows through; it follows the perforation when
  // the ticket scrolls on a short screen.
  const paperRef = useRef<HTMLDivElement>(null)
  const perfRef = useRef<HTMLDivElement>(null)
  const placeNotches = useCallback(() => {
    const paper = paperRef.current
    const perf = perfRef.current
    if (!paper || !perf) return
    const y = perf.offsetTop + perf.offsetHeight / 2 - paper.scrollTop
    paper.style.setProperty("--notch-y", `${y}px`)
  }, [])
  useLayoutEffect(() => {
    placeNotches()
    const ro = new ResizeObserver(placeNotches)
    if (paperRef.current) ro.observe(paperRef.current)
    return () => ro.disconnect()
  }, [placeNotches])

  const NOTCH = "radial-gradient(circle 11px at {x} var(--notch-y, -50px), transparent 10.5px, #000 11px)"
  const mask = `${NOTCH.replace("{x}", "0")}, ${NOTCH.replace("{x}", "100%")}`

  return (
    <div
      ref={paperRef}
      onScroll={placeNotches}
      className="relative max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-dialog bg-surface-raised"
      style={{ maskImage: mask, WebkitMaskImage: mask, maskComposite: "intersect", WebkitMaskComposite: "source-in" }}
    >
      {/* The band in the run's colour */}
      <div
        className="flex items-center justify-between gap-3 py-3.5 pl-5 pr-2 font-signage uppercase"
        style={{ background: `var(--run-${difficulty})`, color: "var(--on-run)" }}
      >
        <span className="text-[15px] font-bold tracking-[0.14em]">Day ticket</span>
        <span className="flex items-center gap-1">
          <span className="text-[15px] font-semibold tracking-[0.08em] opacity-90">
            {format(fromDateKey(date), "EEE d MMM")} · No. {puzzleNumber}
          </span>
          <DialogClose className="inline-flex size-11 items-center justify-center rounded-full hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current">
            <X className="size-5" aria-hidden="true" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </span>
      </div>

      <div className="flex flex-col items-center px-5 pt-5 pb-4 text-center">
        <RunShape run={difficulty} className="size-14" />
        <DialogTitle className="mt-2.5 font-signage text-heading font-extrabold uppercase tracking-[0.04em]">
          {DIFFICULTY_LABEL[difficulty]} · {RUN_CLASS[difficulty]}
        </DialogTitle>
        <DialogDescription className="font-signage text-label font-bold uppercase tracking-[0.12em] text-fg-muted">
          Run complete
        </DialogDescription>
        <p className="mt-1 font-signage text-[72px] font-bold leading-none tabular-nums">{formatTime(elapsedTime)}</p>
        {comparison && (
          <p className="mt-1.5 text-label text-fg-muted">
            {comparison.kind === "new_best" ? (
              <span className="inline-flex items-center gap-1 font-semibold text-fg">
                <Trophy className="size-4 text-warning" aria-hidden="true" />
                Your fastest on this run, {formatTime(comparison.by)} quicker
              </span>
            ) : comparison.kind === "first" ? (
              <>Your first {DIFFICULTY_LABEL[difficulty]} run. That&apos;s your time to beat.</>
            ) : comparison.kind === "tie" ? (
              <>Ties your fastest</>
            ) : (
              <>Your fastest: {formatTime(comparison.best)}</>
            )}
          </p>
        )}
        {newPins.length > 0 && (
          <ul className="mt-3 flex flex-wrap justify-center gap-2" aria-label="New pins">
            {newPins.map((pin) => (
              <li key={pin.id} className="flex items-center gap-1.5 rounded-full border-[1.5px] border-border py-1 pl-1 pr-3">
                <PinBadge id={pin.id} earned className="size-7" />
                <span className="font-signage text-[15px] font-bold uppercase tracking-[0.04em]">New pin · {pin.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Perforation, between the two notches */}
      <div ref={perfRef} className="relative h-6" aria-hidden="true">
        <div className="absolute inset-x-5 top-1/2 border-t-2 border-dashed border-border" />
      </div>

      <div className="flex flex-col gap-4 px-5 pt-2 pb-5">
        <div className="flex items-center justify-between gap-3">
          <div className="text-left">
            <p className="font-signage text-label font-bold uppercase tracking-[0.08em]">
              {s.currentStreak}-day streak
            </p>
            <p className="text-caption text-fg-muted">
              Best {s.maxStreak} · {s.gamesWon} solved
            </p>
          </div>
          <Punches punched={weekPunches(date, s.currentStreak, solvedOnDate)} />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={share}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-control bg-action font-signage text-[19px] font-bold uppercase tracking-[0.04em] text-on-action transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          >
            <Share2 className="size-5" aria-hidden="true" />
            Share
          </button>
          <button
            type="button"
            onClick={copy}
            aria-label="Copy results"
            className="inline-flex size-12 items-center justify-center rounded-control border border-border bg-surface-raised hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            {copied ? <Check className="size-5 text-success" aria-hidden="true" /> : <Copy className="size-5" aria-hidden="true" />}
          </button>
        </div>

        {next && (
          <button
            type="button"
            onClick={() => onPlayNext(next)}
            className="inline-flex h-12 items-center justify-between rounded-control border border-border bg-surface-raised px-4 font-signage text-[18px] font-bold uppercase tracking-[0.04em] hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            <span className="inline-flex items-center gap-2">
              <RunShape run={next} className="size-4" />
              Next run · {DIFFICULTY_LABEL[next]}
            </span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        )}

        <RatingRow difficulty={difficulty} date={date} elapsedTime={elapsedTime} />

        <Countdown puzzleDate={puzzleDate} label="Lifts reopen in" />

        {showKofi && (
          <p className="text-center text-sm text-muted-foreground">
            Enjoying Tridoku?{" "}
            <button
              type="button"
              className="font-medium text-foreground underline underline-offset-2"
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
    </div>
  )
}

interface RunCompleteCardProps {
  difficulty: Difficulty
  elapsedTime: number
  stats: GameStats
  puzzleDate: DateKey | null
  getShareText: () => string
  onPlayNext: (difficulty: Difficulty) => void
  onShowTicket: () => void
}

/** In place of the number pad once a run is finished: the board above stays, read only. */
export function RunCompleteCard({ difficulty, elapsedTime, stats, puzzleDate, getShareText, onPlayNext, onShowTicket }: RunCompleteCardProps) {
  const { share, copied } = useShareResult(difficulty, getShareText, themeDayFor(puzzleDate ?? todayKey())?.id)
  const next = nextUnfinished(difficulty, stats, todayKey())
  return (
    <section aria-label="Run complete" className="flex flex-col gap-3 rounded-card border-[1.5px] border-border bg-surface-raised p-4">
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={onShowTicket} className="flex min-w-0 items-center gap-2 text-left hover:underline" aria-label="Show your lift ticket">
          <RunShape run={difficulty} className="size-4" />
          <span className="truncate font-signage text-[19px] font-extrabold uppercase tracking-[0.04em]">
            {DIFFICULTY_LABEL[difficulty]} · Run complete
          </span>
        </button>
        <span className="font-signage text-[24px] font-extrabold tabular-nums">{formatTime(elapsedTime)}</span>
      </div>
      <div className={cn("grid gap-2", next ? "grid-cols-2" : "grid-cols-1")}>
        <button
          type="button"
          onClick={share}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-control bg-action font-signage text-[18px] font-bold uppercase tracking-[0.04em] text-on-action hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        >
          {copied ? <Check className="size-5" aria-hidden="true" /> : <Share2 className="size-5" aria-hidden="true" />}
          {copied ? "Copied" : "Share"}
        </button>
        {next && (
          <button
            type="button"
            onClick={() => onPlayNext(next)}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-control border-[1.5px] border-border bg-surface-raised font-signage text-[18px] font-bold uppercase tracking-[0.04em] hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            <RunShape run={next} className="size-3.5" />
            Next run
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="space-y-0.5 text-center">
        <p className="text-label text-fg-muted">Your board is read only now.</p>
        <Countdown puzzleDate={puzzleDate} label="Lifts reopen in" />
      </div>
    </section>
  )
}

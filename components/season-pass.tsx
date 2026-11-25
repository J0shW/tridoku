"use client"

// The Mountain theme's statistics (TRI-108): a season pass on a lanyard. Your day streak,
// each run's count and best time, this week as a grid of run shapes, and pins to collect.
// Classic keeps the tabbed statistics in stats-modal.tsx. Built only from saved stats
// and the pins kept on this device.

import { useState } from "react"
import { format } from "date-fns"
import { X } from "lucide-react"
import { DialogClose, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { RUN_CLASS, RunShape, SHAPE_PATH } from "@/components/mountain"
import { DIFFICULTY_LABEL } from "@/lib/share"
import { fromDateKey, todayKey } from "@/lib/dates"
import { dayStreak, seasonLabel, weekGrid } from "@/lib/season"
import { pinBoard, type PinId } from "@/lib/pins"
import { DIFFICULTIES, type GameStats } from "@/lib/stats"
import { formatTime } from "@/lib/tridoku"
import { cn } from "@/lib/utils"

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"]
const WEEKDAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

/** Small caps heading for each part of the pass */
function Heading({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-3">
      <h3 className="font-signage text-label font-bold uppercase tracking-[0.12em] text-fg-muted">{children}</h3>
      {aside && <span className="font-signage text-label font-semibold uppercase tracking-[0.08em] text-fg-muted">{aside}</span>}
    </div>
  )
}

// Each pin is an enamel badge: a gold rim, a coloured face and a white mark. Fixed
// colours, like real enamel, so the marks stay crisp in night mode too
const PIN_FACE: Record<PinId, string> = {
  "first-tracks": "#1d7a43",
  "off-piste": "#d9772f",
  "triple-run": "#2563c9",
  "double-black": "#1c2733",
}

function PinMark({ id }: { id: PinId }) {
  switch (id) {
    case "first-tracks":
      // Two fresh tracks curving down the face
      return (
        <g fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
          <path d="M19 12c3 5-4 9-1 14s5 6 3 10" />
          <path d="M24 12c3 5-4 9-1 14s5 6 3 10" />
        </g>
      )
    case "off-piste":
      // Pines and powder: going between the trees
      return (
        <g fill="#fff">
          <path d="M16 13 10.5 24h3.5L9.5 32h13L18 24h3.5Z" />
          <path d="M31 17 26.5 26h3l-3.8 7h10.6l-3.8-7h3Z" />
          <circle cx="24" cy="35" r="1.4" />
          <circle cx="20.5" cy="36.5" r="1" />
        </g>
      )
    case "triple-run":
      // All three runs
      return (
        <g fill="#fff">
          <circle cx="13.5" cy="24" r="4.2" />
          <path d="M20 19.8h8.4v8.4H20Z" />
          <path d="M35 19 40 24 35 29 30 24Z" />
        </g>
      )
    case "double-black":
      return (
        <g fill="#fff">
          <path d="M17.5 15.5 25 24l-7.5 8.5L10 24Z" />
          <path d="M30.5 15.5 38 24l-7.5 8.5L23 24Z" />
        </g>
      )
  }
}

/** A pin, in colour once earned; a pressed-in outline until then. */
export function PinBadge({ id, earned, className }: { id: PinId; earned: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn("size-14 shrink-0", className)} aria-hidden="true">
      {earned ? (
        <>
          <circle cx="24" cy="25.2" r="21" fill="rgb(10 18 28 / 0.22)" />
          <circle cx="24" cy="24" r="21" fill="#d6ad55" />
          <circle cx="24" cy="24" r="18" fill={PIN_FACE[id]} />
          <PinMark id={id} />
          {/* enamel shine */}
          <path d="M11.5 16.5a14.5 14.5 0 0 1 9-7.8" fill="none" stroke="#fff" strokeOpacity="0.45" strokeWidth="2" strokeLinecap="round" />
        </>
      ) : (
        // Not yet: a pressed-in outline of the pin, its mark showing faintly
        <>
          <circle cx="24" cy="24" r="21" fill="none" stroke="var(--border)" strokeWidth="1.5" strokeDasharray="3.2 2.6" />
          <circle cx="24" cy="24" r="17" style={{ fill: "var(--border)" }} opacity="0.55" />
          <g opacity="0.85">
            <PinMark id={id} />
          </g>
        </>
      )}
    </svg>
  )
}

export function SeasonPassBody({ stats }: { stats: GameStats }) {
  // Read once per showing, so the pass doesn't change under you while it's open
  const [today] = useState(todayKey)
  const [pins] = useState(() => pinBoard(stats))
  const streak = dayStreak(stats, today)
  const week = weekGrid(stats, today)
  const todayIndex = (fromDateKey(today).getDay() + 6) % 7
  const earnedCount = pins.filter((p) => p.earned).length

  return (
    <div className="relative max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-dialog bg-surface-raised">
      {/* The band, with the slot for a lanyard */}
      <div className="relative bg-fg pt-5 pb-3.5 pl-5 pr-2 font-signage uppercase text-surface-raised">
        <span className="absolute left-1/2 top-2 h-2 w-14 -translate-x-1/2 rounded-full bg-surface-raised/25 shadow-[inset_0_1px_2px_rgb(0_0_0/0.45)]" aria-hidden="true" />
        <div className="flex items-center justify-between gap-3">
          <DialogTitle className="text-[15px] font-bold tracking-[0.14em]">Season pass</DialogTitle>
          <span className="flex items-center gap-1">
            <span className="text-[15px] font-semibold tracking-[0.08em] opacity-90">{seasonLabel(today)}</span>
            <DialogClose className="inline-flex size-11 items-center justify-center rounded-full hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current">
              <X className="size-5" aria-hidden="true" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </span>
        </div>
      </div>
      <DialogDescription className="sr-only">Your day streak, runs, this week and pins</DialogDescription>

      <div className="flex flex-col gap-5 px-5 pt-5 pb-6">
        {/* Day streak */}
        <div className="grid grid-cols-2 divide-x divide-border text-center">
          <div>
            <p className="font-signage text-[56px] font-bold leading-none tabular-nums">{streak.current}</p>
            <p className="mt-1 font-signage text-label font-bold uppercase tracking-[0.12em] text-fg-muted">Day streak</p>
          </div>
          <div>
            <p className="font-signage text-[56px] font-bold leading-none tabular-nums text-fg-muted">{streak.longest}</p>
            <p className="mt-1 font-signage text-label font-bold uppercase tracking-[0.12em] text-fg-muted">Longest</p>
          </div>
        </div>

        {/* Each run */}
        <section aria-label="Runs">
          <Heading aside="Best">Runs finished</Heading>
          <ul className="divide-y divide-border rounded-card border-[1.5px] border-border">
            {DIFFICULTIES.map((d) => {
              const s = stats[d]
              return (
                <li key={d} className="flex items-center gap-3 px-3.5 py-2.5">
                  <RunShape run={d} className="size-5" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-signage text-[18px] font-bold uppercase leading-tight tracking-[0.03em]">
                      {DIFFICULTY_LABEL[d]} · {RUN_CLASS[d]}
                    </span>
                    <span className="block text-caption text-fg-muted">
                      {s.gamesWon === 1 ? "1 run" : `${s.gamesWon} runs`}
                      {s.currentStreak > 1 && ` · ${s.currentStreak} days in a row`}
                    </span>
                  </span>
                  <span className="font-signage text-[22px] font-bold tabular-nums">{s.bestTime != null ? formatTime(s.bestTime) : "–"}</span>
                </li>
              )
            })}
          </ul>
        </section>

        {/* This week as a grid of run shapes */}
        <section aria-label="This week">
          <Heading>This week</Heading>
          <div className="grid grid-cols-[repeat(7,minmax(0,1fr))] gap-y-2 text-center">
            {WEEKDAYS.map((day, i) => (
              <span
                key={i}
                className={cn(
                  "mx-auto flex size-7 items-center justify-center rounded-full font-signage text-[13px] font-bold",
                  i === todayIndex ? "bg-fg text-surface-raised" : "text-fg-muted",
                )}
                aria-hidden="true"
              >
                {day}
              </span>
            ))}
            {DIFFICULTIES.map((d) =>
              week[d].map((skied, i) => (
                <svg
                  key={`${d}-${i}`}
                  viewBox="0 0 24 24"
                  className="mx-auto size-6"
                  role="img"
                  aria-label={`${WEEKDAY_NAMES[i]}, ${DIFFICULTY_LABEL[d]}: ${skied ? "skied" : "not skied"}`}
                >
                  <path
                    d={SHAPE_PATH[d]}
                    style={skied ? { fill: `var(--run-${d})` } : { fill: "none", stroke: "var(--border)", strokeWidth: 1.6 }}
                  />
                </svg>
              )),
            )}
          </div>
        </section>

        {/* Pins */}
        <section aria-label="Pins">
          <Heading aside={`${earnedCount} of ${pins.length}`}>Pins</Heading>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-4">
            {pins.map(({ pin, earned }) => (
              <li key={pin.id} className="flex items-center gap-2.5">
                <PinBadge id={pin.id} earned={!!earned} />
                <span className="min-w-0">
                  <span className={cn("block font-signage text-[17px] font-bold uppercase leading-tight tracking-[0.03em]", !earned && "text-fg-muted")}>
                    {pin.name}
                  </span>
                  <span className="block text-caption leading-snug text-fg-muted">
                    {earned ? (earned.date ? `Earned ${format(fromDateKey(earned.date), "d MMM")}` : "Earned") : pin.how}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

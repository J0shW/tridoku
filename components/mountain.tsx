"use client"

// The Mountain theme's pieces (TRI-101): run shapes, the trail-sign run picker and the
// scenery behind the board. Classic keeps DifficultySelector and a plain background.
// Rule from the design review (18 Nov): the board is the boldest thing on screen, so signs
// are white with a thin coloured line, and the scenery is pale and flat.

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatTime, type Difficulty } from "@/lib/tridoku"
import type { DifficultyStats, PuzzleInProgress } from "@/hooks/use-tridoku"

const SHAPE_PATH: Record<Difficulty, string> = {
  easy: "M12 3.5a8.5 8.5 0 1 1 0 17a8.5 8.5 0 1 1 0-17Z",
  medium: "M4.5 4.5h15v15h-15Z",
  hard: "M12 2.2 21.8 12 12 21.8 2.2 12Z",
}

/** ● ■ ◆ for Easy, Medium and Hard, in the run's colour. */
export function RunShape({ run, className }: { run: Difficulty; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-3.5 shrink-0", className)} aria-hidden="true">
      <path d={SHAPE_PATH[run]} style={{ fill: `var(--run-${run})` }} />
    </svg>
  )
}

const LABEL: Record<Difficulty, string> = { easy: "Easy", medium: "Medium", hard: "Hard" }

/** The ski-run name for each difficulty, shown with its shape. */
export const RUN_CLASS: Record<Difficulty, string> = {
  easy: "Green circle",
  medium: "Blue square",
  hard: "Black diamond",
}

interface RunSignsProps {
  current: Difficulty
  stats: Record<Difficulty, DifficultyStats>
  inProgress?: Partial<Record<Difficulty, PuzzleInProgress>>
  onChange: (difficulty: Difficulty) => void
  disabled?: boolean
}

/** Three trail signs. The run you're on gets a thin border and underline in its colour. */
export function RunSigns({ current, stats, inProgress = {}, onChange, disabled }: RunSignsProps) {
  return (
    <div role="tablist" aria-label="Runs" className="grid w-full max-w-md grid-cols-3 gap-1.5">
      {(["easy", "medium", "hard"] as const).map((run) => {
        const active = run === current
        const done = stats[run].completedToday
        const progress = !active && !done ? inProgress[run] : undefined
        const status = done ? "completed today" : progress ? `in progress, ${formatTime(progress.elapsedTime)}` : null
        return (
          <button
            key={run}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={`${LABEL[run]}, ${RUN_CLASS[run]}${status ? `, ${status}` : ""}`}
            disabled={disabled}
            onClick={() => !active && onChange(run)}
            style={active ? { borderColor: `var(--run-${run})`, boxShadow: `inset 0 -3px 0 var(--run-${run})` } : undefined}
            className={cn(
              "relative flex h-11 items-center justify-center gap-1.5 rounded-lg border-[1.5px] bg-surface-raised font-signage text-[17px] font-bold uppercase tracking-[0.04em] transition-colors disabled:opacity-50",
              active ? "text-fg" : "border-border text-fg-muted hover:bg-hover",
            )}
          >
            <RunShape run={run} className={active ? undefined : "opacity-60"} />
            {LABEL[run]}
            {done && <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />}
            {progress && <span className="size-1.5 rounded-full bg-fg-muted" aria-hidden="true" />}
          </button>
        )
      })}
    </div>
  )
}

// Little pines along the bottom of the scene
const tree = (x: number, b: number, h: number) =>
  `${x},${b - h} ${x - h * 0.32},${b - h * 0.45} ${x - h * 0.18},${b - h * 0.45} ${x - h * 0.42},${b} ${x + h * 0.42},${b} ${x + h * 0.18},${b - h * 0.45} ${x + h * 0.32},${b - h * 0.45}`
const TREES = [[14, 300, 34], [36, 300, 26], [56, 300, 40], [78, 300, 22], [312, 300, 24], [334, 300, 38], [356, 300, 28], [378, 300, 34]].map(([x, b, h]) => tree(x, b, h))
const STARS = [[24, 30, 1.2], [70, 64, 0.9], [118, 22, 1.4], [160, 52, 0.8], [206, 18, 1], [250, 70, 1.1], [286, 26, 0.9], [372, 96, 1.2], [96, 104, 0.8], [190, 92, 0.9]]

/**
 * Sky, two ranges of hills and pines, drawn behind the board. Pale and flat on purpose
 * (pines 1.5:1 against the sky). Stretches to fill its box; nothing is drawn under the board.
 */
export function MountainScenery({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 390 300" preserveAspectRatio="none" className={cn("pointer-events-none", className)} aria-hidden="true">
      <rect x="0" y="0" width="390" height="300" style={{ fill: "var(--scene-sky)" }} />
      {STARS.map(([x, y, r]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={r} style={{ fill: "var(--scene-star)" }} />
      ))}
      <polygon points="-10,300 -10,190 40,150 85,182 130,128 175,176 175,300" style={{ fill: "var(--scene-far)" }} />
      <polygon points="215,300 215,170 262,120 300,160 345,112 400,168 400,300" style={{ fill: "var(--scene-far)" }} />
      <polygon points="-10,300 -10,236 30,214 70,240 112,200 150,236 150,300" style={{ fill: "var(--scene-near)" }} />
      <polygon points="240,300 240,232 282,206 320,234 360,198 400,226 400,300" style={{ fill: "var(--scene-near)" }} />
      {/* A low ridge across the bottom, so no gap shows below the board */}
      <polygon points="-10,300 -10,262 195,252 400,262 400,300" style={{ fill: "var(--scene-near)" }} />
      {TREES.map((pts) => (
        <polygon key={pts} points={pts} style={{ fill: "var(--scene-tree)" }} />
      ))}
    </svg>
  )
}

const DESCRIPTION: Record<Difficulty, string> = {
  easy: "Great first puzzle",
  medium: "Needs one trick",
  hard: "For Sudoku regulars",
}

interface TrailheadSignsProps {
  stats: Record<Difficulty, DifficultyStats>
  progressToday: Partial<Record<Difficulty, PuzzleInProgress>>
  onPlay: (difficulty: Difficulty) => void
  disabled?: boolean
}

/**
 * The welcome screen's signpost (TRI-101): three arrow signs on a wooden post, one per run.
 * The difficulty leads; the ski-run name and a one-line description sit under it. Solid run colours are fine here:
 * there's no board in play yet.
 */
export function TrailheadSigns({ stats, progressToday, onPlay, disabled }: TrailheadSignsProps) {
  return (
    <div role="list" aria-label="Today's runs" className="relative pl-6 text-left">
      <div className="absolute bottom-[-6px] left-[14px] top-[-6px] w-3 rounded-[3px] bg-[#7a5a40] dark:bg-[#4a3a2c]" aria-hidden="true" />
      <div className="relative space-y-2.5">
        {(["easy", "medium", "hard"] as const).map((run) => {
          const done = stats[run].completedToday
          const progress = !done ? progressToday[run] : undefined
          const status = done ? "✓ Done" : progress ? `On it · ${formatTime(progress.elapsedTime)}` : "Fresh"
          return (
            <div role="listitem" key={run}>
              <button
                type="button"
                onClick={() => onPlay(run)}
                disabled={disabled}
                aria-label={`${LABEL[run]}, ${RUN_CLASS[run]}. ${DESCRIPTION[run]}. ${done ? "Completed today" : progress ? `In progress, ${formatTime(progress.elapsedTime)}` : "Not started"}`}
                style={{
                  background: `var(--run-${run})`,
                  color: "var(--on-run)",
                  clipPath: "polygon(0 0, calc(100% - 22px) 0, 100% 50%, calc(100% - 22px) 100%, 0 100%)",
                }}
                className="flex h-16 w-[calc(100%-8px)] items-center gap-3 rounded-l-[4px] pl-4 pr-8 text-left transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                <svg viewBox="0 0 24 24" className="size-6 shrink-0" aria-hidden="true">
                  <path d={SHAPE_PATH[run]} style={{ fill: "var(--on-run)" }} />
                </svg>
                <span className="flex min-w-0 flex-1 flex-col items-start leading-tight">
                  <span className="flex w-full items-baseline gap-2 font-signage uppercase">
                    <span className="text-[22px] font-extrabold tracking-[0.03em]">{LABEL[run]}</span>
                    <span className="truncate text-[15px] font-bold tracking-[0.05em] opacity-90">{RUN_CLASS[run]}</span>
                  </span>
                  <span className="text-[13px] font-semibold opacity-90">{DESCRIPTION[run]}</span>
                </span>
                {/* "Fresh" is the default, so it gives way first on narrow phones */}
                <span className={cn("shrink-0 font-signage text-base font-bold uppercase tabular-nums", !done && !progress && "max-[359px]:hidden")}>{status}</span>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

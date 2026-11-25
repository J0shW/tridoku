"use client"

// The Mountain theme's pieces (TRI-101): run shapes, the trail-sign run picker and the
// scenery behind the board. Classic keeps DifficultySelector and a plain background.
// Rule from the design review (18 Nov): the board is the boldest thing on screen, so signs
// are white with a thin coloured line, and the scenery is pale and flat.

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatTime, type Difficulty } from "@/lib/tridoku"
import type { ThemeDay } from "@/lib/theme-days"
import type { DifficultyStats, PuzzleInProgress } from "@/hooks/use-tridoku"

export const SHAPE_PATH: Record<Difficulty, string> = {
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

/** The ski-run colour for each difficulty, shown with its shape. Players know the ski
    grades, so the short names (Josh, 20 Nov). */
export const RUN_CLASS: Record<Difficulty, string> = {
  easy: "Green",
  medium: "Blue",
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
              // The hover tint sits over the solid sign, so scenery never shows through
              active ? "text-fg" : "border-border text-fg-muted hover:shadow-[inset_0_0_0_100px_var(--hover)]",
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

// Theme day extras (TRI-100). Snow caps on the far peaks: [peak, left foot, right foot]
const PEAKS: [number, number, number, number, number, number][] = [
  [40, 150, -10, 190, 85, 182],
  [130, 128, 85, 182, 175, 176],
  [262, 120, 215, 170, 300, 160],
  [345, 112, 300, 160, 400, 168],
]
function peakCap([px, py, lx, ly, rx, ry]: (typeof PEAKS)[number], depth = 13) {
  const at = (fx: number, fy: number) => px + (fx - px) * (depth / (fy - py))
  const l = at(lx, ly)
  const r = at(rx, ry)
  const y = py + depth
  const w = r - l
  return `${px},${py} ${r},${y} ${l + w * 0.72},${y - 3} ${l + w * 0.5},${y + 1.5} ${l + w * 0.26},${y - 2.5} ${l},${y}`
}
const PINES: [number, number, number][] = [[14, 300, 34], [36, 300, 26], [56, 300, 40], [78, 300, 22], [312, 300, 24], [334, 300, 38], [356, 300, 28], [378, 300, 34]]
const pineCap = ([x, b, h]: [number, number, number]) =>
  `${x},${b - h} ${x + h * 0.17},${b - h * 0.71} ${x + h * 0.06},${b - h * 0.68} ${x - h * 0.05},${b - h * 0.73} ${x - h * 0.17},${b - h * 0.71}`
const LIGHT_COLOURS = ["#e5484d", "#f2b33d", "#3fae6a", "#4a8fe7"]
const pineLights = ([x, b, h]: [number, number, number], i: number) =>
  [[-0.12, 0.6], [0.14, 0.5], [-0.24, 0.3], [0.08, 0.24], [0.3, 0.1], [-0.32, 0.06]].map(([dx, dy], j) => ({
    cx: x + dx * h,
    cy: b - h * dy - 2,
    fill: LIGHT_COLOURS[(i + j) % LIGHT_COLOURS.length],
  }))
// Falling flakes: left %, size px, seconds to fall, delay (negative: already falling)
const FLAKES = Array.from({ length: 26 }, (_, i) => {
  const r = (n: number) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1
  return { left: r(1) * 100, size: 2 + r(2) * 3.5, dur: 7 + r(3) * 6, delay: -r(4) * 13, sway: (r(5) - 0.5) * 30 }
})
const sparkle = (x: number, y: number, r: number) => {
  const k = r * 3.2
  return `M${x} ${y - k}L${x + k * 0.22} ${y - k * 0.22}L${x + k} ${y}L${x + k * 0.22} ${y + k * 0.22}L${x} ${y + k}L${x - k * 0.22} ${y + k * 0.22}L${x - k} ${y}L${x - k * 0.22} ${y - k * 0.22}Z`
}

/**
 * Sky, two ranges of hills and pines, drawn behind the board. Pale and flat on purpose
 * (pines 1.5:1 against the sky). Stretches to fill its box; nothing is drawn under the board.
 * `shadow` dims it while you play (TRI-104); the colours fade over 600 ms.
 * A theme day (TRI-100) adds snow caps and falling flakes in December, lights on the pines
 * at Christmas and gold sparkles at New Year. The flakes and lights rest while you play.
 */
export function MountainScenery({ className, shadow = false, themeDay = null }: { className?: string; shadow?: boolean; themeDay?: ThemeDay | null }) {
  const snow = !!themeDay?.snow
  const lights = themeDay?.id === "christmas"
  const sparkles = themeDay?.palette === "new-year"
  return (
    <div
      className={cn("mountain-scenery pointer-events-none overflow-hidden", shadow && "scene-shadow", className)}
      data-shadow={shadow || undefined}
      data-theme-day={themeDay?.id}
      aria-hidden="true"
    >
      <svg viewBox="0 0 390 300" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <rect x="0" y="0" width="390" height="300" style={{ fill: "var(--scene-sky)" }} />
        {sparkles
          ? STARS.map(([x, y, r]) => <path key={`${x}-${y}`} d={sparkle(x, y, r)} className="scene-sparkle" />)
          : STARS.map(([x, y, r]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={r} style={{ fill: "var(--scene-star)" }} />)}
        <polygon points="-10,300 -10,190 40,150 85,182 130,128 175,176 230,300" style={{ fill: "var(--scene-far)" }} />
        <polygon points="160,300 215,170 262,120 300,160 345,112 400,168 400,300" style={{ fill: "var(--scene-far)" }} />
        {snow && PEAKS.map((p) => <polygon key={p[0]} points={peakCap(p)} style={{ fill: "var(--scene-snowcap)" }} />)}
        <polygon points="-10,300 -10,236 30,214 70,240 112,200 150,236 200,300" style={{ fill: "var(--scene-near)" }} />
        <polygon points="190,300 240,232 282,206 320,234 360,198 400,226 400,300" style={{ fill: "var(--scene-near)" }} />
        {/* A low ridge across the bottom, so no gap shows below the board; the hills above slope into it */}
        <polygon points="-10,300 -10,262 195,252 400,262 400,300" style={{ fill: "var(--scene-near)" }} />
        {TREES.map((pts) => (
          <polygon key={pts} points={pts} style={{ fill: "var(--scene-tree)" }} />
        ))}
        {snow && PINES.map((t) => <polygon key={`cap-${t[0]}`} points={pineCap(t)} style={{ fill: "var(--scene-snowcap)" }} />)}
        {lights &&
          PINES.flatMap((t, i) => pineLights(t, i)).map((l) => (
            <ellipse key={`${l.cx}-${l.cy}`} cx={l.cx} cy={l.cy} rx="2.3" ry="1.6" className="scene-light" style={{ fill: l.fill }} />
          ))}
      </svg>
      {snow && (
        <div className="scene-flakes absolute inset-0" style={{ containerType: "size" }}>
          {FLAKES.map((f, i) => (
            <span
              key={i}
              className="scene-flake"
              style={{
                left: `${f.left}%`,
                width: f.size,
                height: f.size,
                animationDuration: `${f.dur}s`,
                animationDelay: `${f.delay}s`,
                ["--sway" as string]: `${f.sway}px`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const DESCRIPTION: Record<Difficulty, string> = {
  easy: "Great first puzzle",
  medium: "A step up",
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
          // What tapping the sign does next (Start, Continue), or that it's finished
          const status = done ? "✓ Done" : progress ? "Continue" : "Start"
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
                className="flex h-16 w-[calc(100%-8px)] items-center gap-3 rounded-l-[4px] pl-4 pr-8 text-left max-[389px]:gap-2.5 max-[389px]:pl-3 max-[389px]:pr-7 transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                <svg viewBox="0 0 24 24" className="size-6 shrink-0" aria-hidden="true">
                  <path d={SHAPE_PATH[run]} style={{ fill: "var(--on-run)" }} />
                </svg>
                <span className="flex min-w-0 flex-1 flex-col items-start leading-tight">
                  <span className="flex w-full items-baseline gap-2 font-signage uppercase">
                    <span className="text-[22px] font-extrabold tracking-[0.03em]">{LABEL[run]}</span>
                    <span className="truncate text-[15px] font-bold tracking-[0.05em] opacity-90 max-[389px]:text-[13px] max-[389px]:tracking-[0.03em]">{RUN_CLASS[run]}</span>
                  </span>
                  <span className="text-[13px] font-semibold opacity-90">{DESCRIPTION[run]}</span>
                </span>
                {/* "Start" is the default (the whole sign is the button), so it gives way first on narrow phones */}
                <span className={cn("flex shrink-0 flex-col items-end font-signage text-base font-bold uppercase leading-tight", !done && !progress && "max-[359px]:hidden")}>
                  {status}
                  {/* The time so far sits under "Continue", so the sign stays narrow */}
                  {progress && <span className="text-[13px] font-semibold tabular-nums opacity-90">{formatTime(progress.elapsedTime)}</span>}
                </span>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

"use client"

// The Mountain theme's little story (TRI-107), a first rough pass to approve before polishing.
//   intro: fresh snow covers the board, a skier rides the chair lift to the peak, the snow
//          fades to show today's board.
//   outro: snow settles over the solved board and the skier zigzags down in a spray of powder.
// Drawn over the board in the board's own units (18 wide), so the board never moves.
// A tap skips to the end. With reduced motion there's no ride or zigzag: the snow just fades.

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

export const INTRO_MS = 3200
// The run down: zigzag to the bottom (0.5–2.7 s), a hard stop that kicks up a cloud of snow
// filling the screen (2.7–3.15 s); the ticket opens inside the cloud, which then clears.
export const OUTRO_MS = 3150
const CLOUD_DELAY_MS = 2580
const FADE_MS = 350

const VIEWBOX = "-0.2 -0.2 18.4 15.988"
const SNOW = "-0.3,15.8 9,-0.35 18.3,15.8"
const LIFT_BASE: [number, number] = [19.6, 15.0]
const LIFT_TOP: [number, number] = [10.1, -0.7]
const at = (t: number): [number, number] => [LIFT_BASE[0] + (LIFT_TOP[0] - LIFT_BASE[0]) * t, LIFT_BASE[1] + (LIFT_TOP[1] - LIFT_BASE[1]) * t]
// Down the face, turn by turn
const ZIGZAG: [number, number][] = [[9, 0.9], [6.4, 3.9], [11.4, 6.4], [5.2, 9.5], [12.8, 12.3], [9, 15.3]]
const ZIGZAG_PATH = "M" + ZIGZAG.map(([x, y]) => `${x} ${y}`).join(" L")
const JACKET = "#d6453a"
const DARK = "#1c2733"

function useReducedMotion(): boolean {
  const [reduce] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches)
  return reduce
}

/** Wind ripples in fresh snow */
function Ripples() {
  return (
    <g fill="none" stroke="#d6e2ee" strokeWidth={0.1} strokeLinecap="round">
      {[[7.6, 6, 1.1], [11.4, 8, 1.3], [6, 11, 1.5], [12.4, 12.3, 1.2], [9.4, 3.6, 0.8]].map(([x, y, r]) => (
        <path key={`${x}-${y}`} d={`M${x - r} ${y}q${r} ${-r * 0.35} ${2 * r} 0`} />
      ))}
    </g>
  )
}

/** A skier on a chair, drawn round the cable point (0, 0) */
function Chair() {
  return (
    <g>
      <line x1={0} y1={0} x2={0} y2={0.85} stroke={DARK} strokeWidth={0.07} />
      <rect x={-0.5} y={1.3} width={1} height={0.16} fill={DARK} />
      <rect x={-0.27} y={0.62} width={0.48} height={0.68} rx={0.08} fill={JACKET} />
      <circle cx={-0.03} cy={0.44} r={0.2} fill={DARK} />
      <line x1={-0.62} y1={1.82} x2={0.5} y2={1.66} stroke={DARK} strokeWidth={0.1} strokeLinecap="round" />
    </g>
  )
}

/** A skier mid-turn, drawn round the feet (0, 0) */
function Skier() {
  return (
    <g>
      <line x1={-0.1} y1={-0.1} x2={0} y2={0.15} stroke={DARK} strokeWidth={0.2} strokeLinecap="round" />
      <line x1={0.1} y1={-0.62} x2={-0.1} y2={-0.1} stroke={JACKET} strokeWidth={0.36} strokeLinecap="round" />
      <circle cx={0.15} cy={-0.82} r={0.19} fill={DARK} />
      <line x1={-0.52} y1={0.3} x2={0.56} y2={0.1} stroke={DARK} strokeWidth={0.1} strokeLinecap="round" />
      <line x1={0.22} y1={-0.45} x2={0.66} y2={0.1} stroke={DARK} strokeWidth={0.06} />
    </g>
  )
}

interface MountainStoryProps {
  kind: "intro" | "outro" | "settled"
  /** The animation finished, or was skipped (skipped is true) */
  onDone: (skipped: boolean) => void
}

/** Puffs of the snow cloud: where each drifts to (in vmax) and how big it grows */
const PUFFS: [number, number, number][] = [
  [0, -18, 1.3], [-22, -10, 1.1], [22, -12, 1.15], [-40, -26, 1], [40, -28, 1.05], [-10, -40, 1.2], [14, -46, 1.1],
  [-34, -52, 0.95], [34, -56, 1], [0, -66, 1.25], [-52, -6, 0.9], [52, -4, 0.9], [-18, 6, 0.85], [20, 8, 0.85],
  [-58, -40, 0.9], [58, -44, 0.9], [-26, -78, 1], [28, -80, 1], [0, -92, 1.1], [-60, -80, 0.95], [60, -82, 0.95],
  // Low and wide, so the bottom of the screen fills too
  [-48, 24, 1], [48, 26, 1], [0, 30, 1.1], [-80, -20, 1], [80, -22, 1],
]

/**
 * The cloud of snow from the skier's hard stop: rolls out from the bottom of the board and
 * fills the screen in about half a second, then clears once the ticket is up. It sits above
 * the dialog's dimmed backdrop and below the ticket, so the ticket appears in clean snow.
 */
function SnowCloud({ origin }: { origin: { x: number; y: number } }) {
  return createPortal(
    <div className="snow-cloud" style={{ ["--ox" as string]: `${origin.x}px`, ["--oy" as string]: `${origin.y}px` }} aria-hidden="true">
      {PUFFS.map(([dx, dy, s], i) => (
        <span
          key={i}
          className="snow-puff"
          style={{ ["--dx" as string]: `${dx}vmax`, ["--dy" as string]: `${dy}vmax`, ["--s" as string]: s, animationDelay: `${CLOUD_DELAY_MS + (i % 5) * 25}ms` }}
        />
      ))}
    </div>,
    document.body,
  )
}

export function MountainStory({ kind, onDone }: MountainStoryProps) {
  const reduce = useReducedMotion()
  // The cloud only follows a run down that played through (not a skip, not reduced motion)
  const [skipped, setSkipped] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null)
  useEffect(() => {
    if (kind !== "outro" || reduce) return
    const r = svgRef.current?.getBoundingClientRect()
    // The bottom of the board, where the skier stops
    if (r) setOrigin({ x: r.left + r.width * (9.2 / 18.4), y: r.top + r.height * (15.5 / 15.988) })
  }, [kind, reduce])
  const length = kind === "intro" ? (reduce ? FADE_MS : INTRO_MS) : kind === "outro" ? (reduce ? FADE_MS : OUTRO_MS) : 0
  useEffect(() => {
    if (!length) return
    const t = setTimeout(() => onDone(false), length)
    return () => clearTimeout(t)
  }, [length, onDone])

  const skip = kind === "settled" ? undefined : () => {
    setSkipped(true)
    onDone(true)
  }
  const snowStyle = { fill: "var(--snow-cover)", stroke: "var(--snow-cover)", strokeWidth: 0.3, strokeLinejoin: "round" as const }

  return (
    <button
      type="button"
      onClick={skip}
      tabIndex={-1}
      aria-label={kind === "settled" ? "Run complete" : "Skip animation"}
      className="absolute inset-0 z-20 cursor-pointer"
      style={{ pointerEvents: kind === "settled" ? "none" : undefined }}
    >
      {origin && !skipped && (kind === "outro" || kind === "settled") && <SnowCloud origin={origin} />}
      <svg ref={svgRef} viewBox={VIEWBOX} className="h-full w-full overflow-visible" aria-hidden="true">
        {kind === "intro" && (
          <g>
            {/* Snow and lift, fading out at the end */}
            <g>
              <polygon points={SNOW} style={snowStyle} />
              <Ripples />
              {!reduce && (
                <g>
                  <line x1={LIFT_BASE[0]} y1={LIFT_BASE[1]} x2={LIFT_TOP[0]} y2={LIFT_TOP[1]} stroke="#5d6b7c" strokeWidth={0.08} />
                  {[0.36, 0.7].map((t) => {
                    const [x, y] = at(t)
                    return (
                      <g key={t} stroke="#7a8898">
                        <line x1={x} y1={y - 0.1} x2={x} y2={y + 1.7} strokeWidth={0.16} />
                        <line x1={x - 0.35} y1={y - 0.1} x2={x + 0.35} y2={y - 0.1} strokeWidth={0.1} />
                      </g>
                    )
                  })}
                  <rect x={LIFT_BASE[0] - 0.7} y={LIFT_BASE[1] - 0.2} width={1.4} height={1} fill="#5d6b7c" />
                  <rect x={LIFT_TOP[0] - 0.45} y={LIFT_TOP[1] - 0.2} width={0.9} height={0.6} fill="#5d6b7c" />
                </g>
              )}
              <animate attributeName="opacity" from="1" to="0" begin={reduce ? "0s" : "2.5s"} dur={reduce ? `${FADE_MS}ms` : "0.7s"} fill="freeze" />
            </g>
            {!reduce && (
              <>
                {/* The ride up */}
                <g>
                  <Chair />
                  <animateMotion path={`M${LIFT_BASE[0]} ${LIFT_BASE[1]} L${LIFT_TOP[0]} ${LIFT_TOP[1]}`} dur="2.2s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.45 0 0.25 1" />
                  <animate attributeName="opacity" from="1" to="0" begin="2.2s" dur="0.15s" fill="freeze" />
                </g>
                {/* Steps off at the peak */}
                <g opacity={0} transform="translate(9 -0.15)">
                  <Skier />
                  <animate attributeName="opacity" from="0" to="1" begin="2.2s" dur="0.15s" fill="freeze" />
                  <animate attributeName="opacity" from="1" to="0" begin="2.6s" dur="0.5s" fill="freeze" />
                </g>
              </>
            )}
          </g>
        )}

        {(kind === "outro" || kind === "settled") && (
          <g>
            <g opacity={kind === "settled" ? 1 : 0}>
              <polygon points={SNOW} style={snowStyle} />
              <Ripples />
              {kind === "outro" && <animate attributeName="opacity" from="0" to="1" dur={reduce ? `${FADE_MS}ms` : "0.6s"} fill="freeze" />}
            </g>
            {!reduce && (
              <>
                {/* Two ski tracks drawn behind the skier */}
                {[-0.12, 0.12].map((o) => (
                  <path
                    key={o}
                    d={ZIGZAG_PATH}
                    transform={`translate(${o} 0)`}
                    pathLength={1}
                    fill="none"
                    stroke="#b7c7d9"
                    strokeWidth={0.07}
                    strokeLinejoin="round"
                    strokeDasharray="1"
                    strokeDashoffset={kind === "settled" ? 0 : 1}
                  >
                    {kind === "outro" && <animate attributeName="stroke-dashoffset" from="1" to="0" begin="0.5s" dur="2.2s" fill="freeze" />}
                  </path>
                ))}
                {/* Powder thrown up at each turn */}
                {ZIGZAG.slice(1, -1).map(([x, y], i) => (
                  <g key={i} opacity={kind === "settled" ? 0.7 : 0} fill="#ffffff" stroke="#c9d6e3" strokeWidth={0.05}>
                    <circle cx={x - 0.5} cy={y + 0.1} r={0.36} />
                    <circle cx={x - 0.9} cy={y - 0.25} r={0.24} />
                    <circle cx={x - 0.35} cy={y + 0.5} r={0.28} />
                    {kind === "outro" && <animate attributeName="opacity" values="0;1;0.7" begin={`${0.5 + ((i + 1) / (ZIGZAG.length - 1)) * 2.2}s`} dur="0.5s" fill="freeze" />}
                  </g>
                ))}
                {kind === "outro" && (
                  <>
                    <g opacity={0}>
                      {/* A hard corner at the bottom: the skier swings sideways to stop */}
                      <g>
                        <Skier />
                        <animateTransform attributeName="transform" type="rotate" from="0" to="-80" begin="2.6s" dur="0.14s" fill="freeze" />
                      </g>
                      <animateMotion path={ZIGZAG_PATH} begin="0.5s" dur="2.2s" fill="freeze" />
                      <animate attributeName="opacity" from="0" to="1" begin="0.5s" dur="0.1s" fill="freeze" />
                    </g>
                    {/* The spray off the skis as they stop */}
                    <g fill="#ffffff" stroke="#c9d6e3" strokeWidth={0.05} opacity={0}>
                      {[[-1.4, -0.6, 0.8], [-2.4, -1.6, 0.6], [-0.6, -1.8, 0.7], [-3, -0.2, 0.5], [0.4, -0.8, 0.55]].map(([dx, dy, r]) => (
                        <circle key={`${dx}-${dy}`} cx={ZIGZAG[ZIGZAG.length - 1][0] + dx} cy={ZIGZAG[ZIGZAG.length - 1][1] + dy} r={r}>
                          <animate attributeName="r" from="0.1" to={String(r * 2.2)} begin="2.68s" dur="0.4s" fill="freeze" />
                        </circle>
                      ))}
                      <animate attributeName="opacity" from="0" to="1" begin="2.66s" dur="0.08s" fill="freeze" />
                    </g>
                  </>
                )}
              </>
            )}
          </g>
        )}
      </svg>
    </button>
  )
}

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
// The run down: zigzag to the bottom (0.5–2.7 s), then a hard stop that kicks up a splash of
// snow (from 2.6 s); the ticket opens inside the splash, which then drifts down and fades.
export const OUTRO_MS = 3150
const SPLASH_DELAY_MS = 2600
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

interface Flake {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  born: number
  life: number
  wobble: number
  puff: boolean
  front: boolean
}

/** Simple seeded random, so the splash looks the same each time */
function rng(seed: number) {
  let t = seed
  return () => {
    t = (t + 0x6d2b79f5) | 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * The splash of snow from the skier's hard stop (Josh, 20 Nov): hundreds of flakes and a few
 * soft puffs burst up and out from the stop point, billow across the screen, then slow, drift
 * down and fade. Drawn on two full-screen canvases: most flakes behind the ticket (above the
 * dialog's dimmed backdrop) and some in front, so the ticket pops up inside the splash.
 */
function SnowSplash({ origin }: { origin: { x: number; y: number } }) {
  const backRef = useRef<HTMLCanvasElement>(null)
  const frontRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const back = backRef.current
    const front = frontRef.current
    if (!back || !front) return
    // Soft snow doesn't need to be pin-sharp, and fewer pixels keep it smooth on phones
    const dpr = 1
    const w = window.innerWidth
    const h = window.innerHeight
    for (const c of [back, front]) {
      c.width = w * dpr
      c.height = h * dpr
      c.getContext("2d")!.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    const rand = rng(7)
    const reach = Math.max(w, h)
    const flakes: Flake[] = []
    // Flakes come out over the first quarter second, most of them in a fan upwards
    for (let i = 0; i < 380; i++) {
      const angle = -Math.PI / 2 + (rand() - 0.5) * Math.PI * (rand() < 0.75 ? 0.9 : 1.6)
      const speed = reach * (0.55 + rand() * 1.6)
      flakes.push({
        x: origin.x + (rand() - 0.5) * 30,
        y: origin.y + (rand() - 0.5) * 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: rand() < 0.12 ? 4 + rand() * 5 : 1.2 + rand() * 2.8,
        born: rand() * 0.25,
        life: 1.9 + rand() * 1.4,
        wobble: rand() * Math.PI * 2,
        puff: false,
        front: false,
      })
      // Only small flakes fly in front of the ticket, so its text stays readable
      const last = flakes[flakes.length - 1]
      last.front = last.r < 3 && rand() < 0.3
    }
    // Soft puffs that billow out among the flakes
    for (let i = 0; i < 18; i++) {
      const angle = -Math.PI / 2 + (rand() - 0.5) * Math.PI * 1.2
      const speed = reach * (0.25 + rand() * 0.75)
      flakes.push({
        x: origin.x,
        y: origin.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: reach * (0.05 + rand() * 0.07),
        born: rand() * 0.2,
        life: 1.5 + rand() * 1,
        wobble: rand() * Math.PI * 2,
        puff: true,
        front: false,
      })
    }

    // One soft snowflake, drawn once and stamped for every flake: a white core with a
    // feathered edge and a faint blue-grey rim, so it reads on light snow as well as dark
    const sprite = document.createElement("canvas")
    const S = 64
    sprite.width = sprite.height = S
    const sctx = sprite.getContext("2d")!
    const sg = sctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2)
    sg.addColorStop(0, "rgba(255,255,255,1)")
    sg.addColorStop(0.45, "rgba(255,255,255,0.95)")
    sg.addColorStop(0.7, "rgba(205,218,233,0.55)")
    sg.addColorStop(1, "rgba(205,218,233,0)")
    sctx.fillStyle = sg
    sctx.fillRect(0, 0, S, S)
    // One soft puff, drawn once too
    const puff = document.createElement("canvas")
    const P = 128
    puff.width = puff.height = P
    const pctx = puff.getContext("2d")!
    const pg = pctx.createRadialGradient(P / 2, P / 2, 0, P / 2, P / 2, P / 2)
    pg.addColorStop(0, "rgba(255,255,255,0.55)")
    pg.addColorStop(0.6, "rgba(240,245,251,0.3)")
    pg.addColorStop(1, "rgba(235,242,250,0)")
    pctx.fillStyle = pg
    pctx.fillRect(0, 0, P, P)

    const bctx = back.getContext("2d")!
    const fctx = front.getContext("2d")!
    let frame = 0
    let last = performance.now()
    const start = last
    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const t = (now - start) / 1000
      bctx.clearRect(0, 0, w, h)
      fctx.clearRect(0, 0, w, h)
      let alive = 0
      for (const f of flakes) {
        const age = t - f.born
        if (age < 0) {
          alive++
          continue
        }
        if (age > f.life) continue
        alive++
        // Air drag slows the burst quickly; then the snow floats down and sways
        const drag = Math.exp(-(f.puff ? 3.2 : 2.6) * dt)
        f.vx *= drag
        f.vy = f.vy * drag + (f.puff ? 40 : 160) * dt
        f.x += (f.vx + Math.sin(age * 3 + f.wobble) * (f.puff ? 0 : 22)) * dt
        f.y += f.vy * dt
        const fadeIn = Math.min(1, age / 0.08)
        const fadeOut = Math.min(1, (f.life - age) / 0.7)
        const a = fadeIn * fadeOut
        const ctx = f.front ? fctx : bctx
        if (f.puff) {
          const r = f.r * (0.4 + Math.min(1, age / 0.6) * 0.9)
          ctx.globalAlpha = a
          ctx.drawImage(puff, f.x - r, f.y - r, r * 2, r * 2)
          ctx.globalAlpha = 1
        } else {
          ctx.globalAlpha = a
          const d = f.r * 2.6
          ctx.drawImage(sprite, f.x - d / 2, f.y - d / 2, d, d)
          ctx.globalAlpha = 1
        }
      }
      if (alive > 0) frame = requestAnimationFrame(step)
      else {
        bctx.clearRect(0, 0, w, h)
        fctx.clearRect(0, 0, w, h)
      }
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [origin])

  return createPortal(
    <>
      <canvas ref={backRef} className="snow-splash" style={{ zIndex: 55 }} aria-hidden="true" />
      <canvas ref={frontRef} className="snow-splash" style={{ zIndex: 65 }} aria-hidden="true" />
    </>,
    document.body,
  )
}

export function MountainStory({ kind, onDone }: MountainStoryProps) {
  const reduce = useReducedMotion()
  // The splash only follows a run down that played through (not a skip, not reduced motion)
  const [skipped, setSkipped] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null)
  const [splashReady, setSplashReady] = useState(false)
  useEffect(() => {
    if (kind !== "outro" || reduce) return
    const t = setTimeout(() => setSplashReady(true), SPLASH_DELAY_MS)
    return () => clearTimeout(t)
  }, [kind, reduce])
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
      {origin && splashReady && !skipped && (kind === "outro" || kind === "settled") && <SnowSplash origin={origin} />}
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

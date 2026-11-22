"use client"

// The Mountain finish (TRI-107, second take, Josh 22 Nov). When you solve a run:
//   0.00 s  the board turns into a snowy mountain: a lit face, a shaded face and a ridge
//   0.35 s  a skier drops from the peak and accelerates hard down the face, carving a track
//   1.15 s  a short, sharp turn to the right near the bottom, then off the right of the screen
//   1.20 s  the turn throws a burst of big round snowballs that fills the screen
//   1.60 s  the lift ticket springs up in front of the snow, which settles and clears
// Everything moves with transform and opacity only (the Web Animations API), so phones run
// it on the compositor. A tap skips straight to the ticket. Reduced motion never mounts this.

import { useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import type { Difficulty } from "@/lib/tridoku"

const T = {
  mountainIn: 420,
  skierStart: 350,
  descent: 780, // peak to the turn, accelerating
  turn: 160, // the short, sharp turn to the right
  exit: 240, // a fast whip off the right of the screen
  ticket: 1600,
}
const BURST_AT = T.skierStart + T.descent + 40

// Board units: the board is 18 wide, the triangle's base is at y = 15.588
const VB = { x: -0.2, y: -0.2, w: 18.4, h: 15.988 }
type Pt = [number, number]
const bez = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt => {
  const u = 1 - t
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ]
}
// The line down: a long, gently curving drop to the left of centre, then a tight hook right
const PEAK: Pt = [9, 0.55]
const DROP: [Pt, Pt, Pt, Pt] = [PEAK, [8.7, 4.2], [6.5, 8.6], [7.2, 12.6]]
const HOOK: [Pt, Pt, Pt, Pt] = [[7.2, 12.6], [7.6, 14.2], [9.2, 14.5], [11.2, 14.1]]
const TURN_POINT: Pt = [7.6, 13.6]

const SNOWBALLS = 56

function seeded(seed: number) {
  let t = seed
  return () => {
    t = (t + 0x6d2b79f5) | 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

/** A skier in a tuck, about 34 px tall, drawn round the feet (17, 30). Faces right. */
function SkierFigure({ skisRef, bodyRef }: { skisRef: React.Ref<SVGGElement>; bodyRef: React.Ref<SVGGElement> }) {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" overflow="visible" aria-hidden="true" style={{ transform: "scale(1.35)", transformOrigin: "17px 30px" }}>
      <g ref={skisRef} style={{ transformOrigin: "17px 30px", transformBox: "view-box" }}>
        <path d="M3 30.5h26.5c1.4 0 2.5-.7 3-1.6" fill="none" stroke="#1c2733" strokeWidth="2" strokeLinecap="round" />
      </g>
      <g ref={bodyRef} style={{ transformOrigin: "17px 30px", transformBox: "view-box" }}>
        {/* legs bent in a tuck */}
        <path d="M13 29.5 16.5 23.5 13.5 19" fill="none" stroke="#24364d" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M19.5 29.5 21.5 23.5 17.5 19" fill="none" stroke="#2c425d" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
        {/* jacket, leaning forward */}
        <path d="M12.5 19.5c1-4.4 4.6-7.6 9-8.2l1.6 4.1c-3 1-5.2 3.2-6.2 6.1Z" fill="#d6453a" />
        <path d="M15.2 17.1c1.6-2.2 3.8-3.6 6.4-4.1" fill="none" stroke="#f2f4f7" strokeWidth="1.1" strokeLinecap="round" />
        {/* arm and pole */}
        <path d="M20.5 14.5 25 18.5" fill="none" stroke="#b9372e" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M25 18.5 11 25.5" fill="none" stroke="#5d6b7c" strokeWidth="1" strokeLinecap="round" />
        {/* helmet and goggles */}
        <circle cx="24.6" cy="9.6" r="3.9" fill="#1c2733" />
        <path d="M24.3 9.4h4.3a1 1 0 0 1 1 1v.6a1 1 0 0 1-1 1h-4.3Z" fill="#f2b33d" />
      </g>
    </svg>
  )
}

interface MountainFinishProps {
  run: Difficulty
  /** Open the ticket; `skipped` when the player tapped to skip */
  onTicket: (skipped: boolean) => void
}

export function MountainFinish({ run, onTicket }: MountainFinishProps) {
  const rootRef = useRef<HTMLButtonElement>(null)
  const mountainRef = useRef<SVGGElement>(null)
  const trackRefs = useRef<(SVGPathElement | null)[]>([])
  const skierRef = useRef<HTMLDivElement>(null)
  const skisRef = useRef<SVGGElement>(null)
  const bodyRef = useRef<SVGGElement>(null)
  const burstRef = useRef<HTMLDivElement>(null)
  const done = useRef(false)
  const anims = useRef<Animation[]>([])
  const onTicketRef = useRef(onTicket)
  useEffect(() => {
    onTicketRef.current = onTicket
  }, [onTicket])

  useEffect(() => {
    const root = rootRef.current
    const skier = skierRef.current
    const burst = burstRef.current
    if (!root || !skier || !burst) return
    const box = root.getBoundingClientRect()
    // The skier's layer is fixed to the screen; line it up with the board
    skier.style.left = `${box.left}px`
    skier.style.top = `${box.top}px`
    const toPx = ([x, y]: Pt): Pt => [((x - VB.x) / VB.w) * box.width, ((y - VB.y) / VB.h) * box.height]
    const play = (el: Element | null | undefined, frames: Keyframe[], opts: KeyframeAnimationOptions) => {
      if (!el) return
      anims.current.push(el.animate(frames, { fill: "both", ...opts }))
    }

    // 1. The board becomes a mountain
    play(mountainRef.current, [
      { opacity: 0, transform: "scale(1.035)" },
      { opacity: 1, transform: "scale(1)" },
    ], { duration: T.mountainIn, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" })

    // 2. The skier's line, sampled so speed and lean can be shaped frame by frame
    const exitX = window.innerWidth - box.left + 60
    const frames: Keyframe[] = []
    const skis: Keyframe[] = []
    const body: Keyframe[] = []
    const total = T.descent + T.turn + T.exit
    const push = (p: Pt, at: number, skiDeg: number, leanDeg: number, flip: number, scale = 1) => {
      frames.push({ offset: at, transform: `translate(${p[0] - 17}px, ${p[1] - 30}px) scale(${flip * scale}, ${scale})` })
      skis.push({ offset: at, transform: `rotate(${skiDeg}deg)` })
      body.push({ offset: at, transform: `rotate(${leanDeg}deg)` })
    }
    // Drop: from the peak, accelerating (t² timing), heading down and left, so the skier
    // faces left (flip) with skis along the fall line
    const N = 16
    for (let i = 0; i <= N; i++) {
      const s = i / N
      const p = toPx(bez(...DROP, s * s))
      const q = toPx(bez(...DROP, Math.min(1, s * s + 0.02)))
      const dirDeg = (Math.atan2(q[1] - p[1], Math.abs(q[0] - p[0]) + 0.001) * 180) / Math.PI
      push(p, (s * T.descent) / total, Math.min(55, dirDeg * 0.75), 8 + s * 6, -1, 0.92 + 0.08 * s)
    }
    // Hook: a tight turn to the right. The skier swings round (no flip), leaning hard into it
    for (let i = 1; i <= 8; i++) {
      const s = i / 8
      const p = toPx(bez(...HOOK, s))
      const lean = -34 * Math.sin(Math.PI * Math.min(1, s * 1.1))
      const ski = 40 * (1 - s) - 8 * s
      push(p, (T.descent + s * T.turn) / total, ski, lean, s < 0.35 ? -1 : 1)
    }
    // Exit: off the right of the screen, still accelerating
    const end = toPx(HOOK[3])
    for (let i = 1; i <= 5; i++) {
      const s = i / 5
      const k = Math.pow(s, 1.35)
      push([end[0] + (exitX - end[0]) * k, end[1] - 8 * k], (T.descent + T.turn + s * T.exit) / total, -6, -14 * (1 - s), 1)
    }
    play(skier, [{ opacity: 0, offset: 0 }, { opacity: 1, offset: 0.04 }], { duration: total, delay: T.skierStart })
    play(skier.firstElementChild, frames, { duration: total, delay: T.skierStart })
    play(skisRef.current, skis, { duration: total, delay: T.skierStart })
    play(bodyRef.current, body, { duration: total, delay: T.skierStart })

    // The track carves in behind the skier
    for (const path of trackRefs.current) {
      play(path, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: T.descent + T.turn, delay: T.skierStart, easing: "cubic-bezier(0.55, 0, 0.9, 0.55)" })
    }

    // 3. The burst of snowballs from the turn, filling the screen
    const origin = toPx(TURN_POINT)
    const ox = box.left + origin[0]
    const oy = box.top + origin[1]
    const W = window.innerWidth
    const H = window.innerHeight
    const rand = seeded(11)
    const balls = Array.from(burst.children) as HTMLElement[]
    balls.forEach((ball) => {
      // Spread over the whole screen, a little denser near the turn
      const tx = rand() * (W + 120) - 60
      const ty = rand() < 0.3 ? oy + (rand() - 0.5) * H * 0.5 : rand() * (H + 120) - 60
      const size = Math.max(W, H) * (0.07 + rand() * 0.13)
      ball.style.width = ball.style.height = `${size}px`
      ball.style.left = `${ox - size / 2}px`
      ball.style.top = `${oy - size / 2}px`
      const dx = tx - ox
      const dy = ty - oy
      const delay = BURST_AT + rand() * 90
      const fly = 420 + rand() * 180
      play(ball, [
        { transform: "translate(0, 0) scale(0.12)", opacity: 0 },
        { transform: `translate(${dx * 0.18}px, ${dy * 0.18}px) scale(0.6)`, opacity: 1, offset: 0.12 },
        { transform: `translate(${dx}px, ${dy}px) scale(1)`, opacity: 1 },
      ], { duration: fly, delay, easing: "cubic-bezier(0.12, 0.75, 0.25, 1)" })
      // Then it settles: drifts down, shrinks a touch and melts away behind the ticket
      anims.current.push(
        ball.animate(
          [
            { transform: `translate(${dx}px, ${dy}px) scale(1)`, opacity: 1 },
            { transform: `translate(${dx + (rand() - 0.5) * 30}px, ${dy + 50 + rand() * 60}px) scale(0.82)`, opacity: 0 },
          ],
          { duration: 700 + rand() * 300, delay: T.ticket + 150 + rand() * 250, easing: "cubic-bezier(0.4, 0, 0.7, 0.2)", fill: "forwards" },
        ),
      )
    })

    const t = setTimeout(() => {
      if (done.current) return
      done.current = true
      onTicketRef.current(false)
    }, T.ticket)
    const all = anims.current
    return () => {
      clearTimeout(t)
      all.forEach((a) => a.cancel())
    }
  }, [])

  const skip = () => {
    if (done.current) return
    done.current = true
    // Jump everything to its end: the mountain stays, the skier and snow are gone
    anims.current.forEach((a) => a.finish())
    if (burstRef.current) burstRef.current.style.display = "none"
    if (skierRef.current) skierRef.current.style.display = "none"
    onTicketRef.current(true)
  }

  return (
    <button
      ref={rootRef}
      type="button"
      onClick={skip}
      tabIndex={-1}
      aria-label="Skip to your result"
      className="mountain-finish absolute inset-0 z-20 cursor-pointer"
      data-run={run}
    >
      <svg viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
        <defs>
          <linearGradient id="mf-lit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--mf-snow-top)" />
            <stop offset="1" stopColor="var(--mf-snow-base)" />
          </linearGradient>
          <linearGradient id="mf-shade" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--mf-shade-top)" />
            <stop offset="1" stopColor="var(--mf-shade-base)" />
          </linearGradient>
        </defs>
        <g ref={mountainRef} style={{ transformOrigin: "9px 15.6px", transformBox: "view-box" }}>
          {/* Lit face, shaded face, and the ridge between */}
          <polygon points="-0.15,15.7 9,-0.25 10.9,15.7" fill="url(#mf-lit)" />
          <polygon points="9,-0.25 18.15,15.7 10.9,15.7" fill="url(#mf-shade)" />
          <path d="M9 -0.25 9.6 3.4 9.3 6.2 10.1 9.6 9.9 12.4 10.9 15.7" fill="none" stroke="var(--mf-ridge)" strokeWidth="0.09" strokeLinejoin="round" />
          {/* A crisp outline, so the peak stands clear of the hills behind */}
          <polygon points="-0.15,15.7 9,-0.25 18.15,15.7" fill="none" stroke="var(--mf-edge)" strokeWidth="0.1" strokeLinejoin="round" />
          {/* Wind-carved snow, catching the light */}
          <g fill="none" stroke="var(--mf-ridge)" strokeWidth="0.07" strokeLinecap="round" opacity="0.55">
            <path d="M5.4 9.4q1.4-.5 2.8-.1" />
            <path d="M3.2 13q1.8-.6 3.6-.1" />
            <path d="M11.8 7.2q1.2-.4 2.2 0" />
            <path d="M13.2 11.6q1.6-.5 3 .1" />
            <path d="M8.2 4.6q.9-.3 1.6 0" />
          </g>
          {/* Two ski tracks, carved in as the skier passes */}
          {[-0.1, 0.1].map((o, i) => (
            <path
              key={o}
              ref={(el) => {
                trackRefs.current[i] = el
              }}
              d={`M${DROP[0][0] + o} ${DROP[0][1]} C${DROP[1][0] + o} ${DROP[1][1]} ${DROP[2][0] + o} ${DROP[2][1]} ${DROP[3][0] + o} ${DROP[3][1]} C${HOOK[1][0] + o} ${HOOK[1][1] + o} ${HOOK[2][0]} ${HOOK[2][1] + o} ${HOOK[3][0]} ${HOOK[3][1] + o}`}
              pathLength={1}
              fill="none"
              stroke="var(--mf-track)"
              strokeWidth="0.075"
              strokeLinecap="round"
              strokeDasharray="1"
              strokeDashoffset="1"
            />
          ))}
        </g>
      </svg>
      {typeof document !== "undefined" &&
        createPortal(
          <>
            <div ref={burstRef} className="snow-burst" aria-hidden="true">
              {Array.from({ length: SNOWBALLS }, (_, i) => (
                <span key={i} className="snowball" />
              ))}
            </div>
            {/* The skier rides in front of the snow, so the turn and the exit stay visible */}
            <div ref={skierRef} className="finish-skier" style={{ opacity: 0 }} aria-hidden="true">
              <div style={{ willChange: "transform", transformOrigin: "17px 30px" }}>
                <SkierFigure skisRef={skisRef} bodyRef={bodyRef} />
              </div>
            </div>
          </>,
          document.body,
        )}
    </button>
  )
}

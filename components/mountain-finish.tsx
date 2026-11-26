"use client"

// The Mountain finish (TRI-107, second take, Josh 22 Nov). When you solve a run:
//   0.00 s  the board turns into a snowy mountain: a lit face, a shaded face and a ridge
//   0.35 s  a skier drops from the peak and accelerates hard down the face in a tuck
//   1.11 s  the turn: they sink and set their edges, carve hard right leaning into the hill,
//           then rise and push off the right of the screen. Snow sprays off the ski tails,
//           building into big round snowballs that fly off the left of the screen
//   1.59 s  the snow swoops back in from the left, a wave across the whole screen
//   2.04 s  the lift ticket springs up as the wave sweeps past it and off to the right
// Everything moves with transform and opacity only (the Web Animations API), so phones run
// it on the compositor. A tap skips straight to the ticket. Reduced motion never mounts this.

import { useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import type { Difficulty } from "@/lib/tridoku"
import type { ThemeDay } from "@/lib/theme-days"

const T = {
  mountainIn: 420,
  skierStart: 350,
  descent: 760, // peak to the turn, accelerating
  turn: 360, // sink, carve hard right on edge, rise out
  exit: 220, // a fast push off the right of the screen
  spray: 440, // snow flung off the left of the screen
  swoopAfter: 480, // from the start of the turn: the wave comes back as the last spray leaves
  swoop: 1000, // the wave across the screen, left to right
}
const TURN_AT = T.skierStart + T.descent
const SWOOP_AT = TURN_AT + T.swoopAfter
// The ticket springs in while the wave covers the screen, so its tail reveals it
const TICKET_AT = SWOOP_AT + T.swoop * 0.45

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
// Through the turn the skier slows into the apex as the edges bite, then shoots out
const turnProgress = (s: number) => s + 0.1 * Math.sin(2 * Math.PI * s)

const SNOWBALLS = 80
const FLAKES = 48 // the spray off the skis

function seeded(seed: number) {
  let t = seed
  return () => {
    t = (t + 0x6d2b79f5) | 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

interface SkierRefs {
  tuckRef: React.Ref<SVGGElement>
  skisRef: React.Ref<SVGGElement>
  bodyRef: React.Ref<SVGGElement>
  carveRef: React.Ref<SVGGElement>
}

/**
 * A skier about 34 px tall, drawn round the feet (17, 30), in two poses. The tuck faces
 * right (flipped to face left). The carve is the turn itself: skis on edge heading down
 * and right toward us, knees and hips driven into the turn, shoulders countered back over
 * the outside ski and the inside pole planting.
 */
function SkierFigure({ tuckRef, skisRef, bodyRef, carveRef }: SkierRefs) {
  const pivot = { transformOrigin: "17px 30px", transformBox: "view-box" } as const
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" overflow="visible" aria-hidden="true" style={{ transform: "scale(1.35)", transformOrigin: "17px 30px" }}>
      <g ref={tuckRef}>
        <g ref={skisRef} style={pivot}>
          <path d="M3 30.5h26.5c1.4 0 2.5-.7 3-1.6" fill="none" stroke="#1c2733" strokeWidth="2" strokeLinecap="round" />
        </g>
        <g ref={bodyRef} style={pivot}>
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
      </g>
      <g ref={carveRef} style={{ ...pivot, opacity: 0 }}>
        {/* skis, foreshortened and on edge: tails up and left, tips down and right */}
        <path d="M6.5 27.2 26 31.6c1.3.3 2.2 0 2.7-.8" fill="none" stroke="#1c2733" strokeWidth="1.9" strokeLinecap="round" />
        <path d="M3.8 29.6 22.8 34.2c1.3.3 2.2 0 2.7-.8" fill="none" stroke="#1c2733" strokeWidth="1.9" strokeLinecap="round" />
        {/* inside leg, deeply bent; outside leg long and strong */}
        <path d="M16.8 29.3 21.6 24.4 18.6 19.6" fill="none" stroke="#2c425d" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12.6 31.9 18.4 25.2 16.6 19.6" fill="none" stroke="#24364d" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
        {/* torso countered back over the outside ski */}
        <path d="M14.2 20.6c-.6-3.6.4-7 3.2-8.8l3.4 1.4c.8 2.6.4 5.4-1.2 7.6Z" fill="#d6453a" />
        <path d="M15.6 18.6c-.2-2.4.4-4.4 1.8-5.6" fill="none" stroke="#f2f4f7" strokeWidth="1.1" strokeLinecap="round" />
        {/* outside arm out for balance, inside arm planting the pole */}
        <path d="M16.8 13.6 12.4 16.4" fill="none" stroke="#b9372e" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M12.4 16.4 5.4 20.4" fill="none" stroke="#5d6b7c" strokeWidth="1" strokeLinecap="round" />
        <path d="M20.2 13.8 24.4 17.6" fill="none" stroke="#b9372e" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M24.4 17.6 28.6 27.4" fill="none" stroke="#5d6b7c" strokeWidth="1" strokeLinecap="round" />
        {/* looking down the turn */}
        <circle cx="19.4" cy="8.8" r="3.7" fill="#1c2733" />
        <path d="M19.6 8.8h3.4a1 1 0 0 1 1 1v.5a1 1 0 0 1-1 1h-3.4Z" fill="#f2b33d" />
      </g>
    </svg>
  )
}

const FIREWORK_COLOURS = ["#f2b33d", "#ec6fa4", "#2fb8b0"]

/** Santa's sleigh and two reindeer, flying left: a silhouette with a red coat. */
function SantaSleigh() {
  return (
    <svg width="132" height="44" viewBox="0 0 132 44" aria-hidden="true" className="text-fg">
      <g fill="currentColor">
        {/* reindeer: body, legs mid-leap, head and antlers */}
        {[0, 34].map((x) => (
          <g key={x} transform={`translate(${x} ${x ? 3 : 0})`}>
            <path d="M8 18c2-3 8-4 14-3l5 1c2 0 3 2 2 4l-3 1c-4 1-10 1-14 0l-3 5-2-1 2-5c-1 0-2-1-1-2Z" />
            <path d="M24 20l5 6-1 1-6-5ZM11 21l-5 5 1 1 6-4Z" />
            <path d="M7 18c-2-1-4-3-4-6l2-1c0 2 1 4 3 5Z" />
            <path d="M4 11 2 6M4 11 6 6.5M4 11 0.5 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          </g>
        ))}
        {/* reins */}
        <path d="M27 20 C45 22 55 24 74 25" stroke="currentColor" strokeWidth="0.8" fill="none" />
        {/* sleigh with a curled runner */}
        <path d="M72 24h40c4 0 6-3 6-7l1-3h3l-1 4c0 7-4 11-10 11H76c-3 0-4-2-4-5Z" />
        <path d="M70 33h42c4 0 6-1 8-3l1 1c-2 3-5 4-9 4H72c-2 0-3-1-2-2Z" />
        <path d="M80 29v4M106 29v4" stroke="currentColor" strokeWidth="1.4" />
      </g>
      {/* Santa: red coat and hat, white trim, and his sack */}
      <circle cx="108" cy="14" r="7" fill="#7a5a40" />
      <path d="M88 24c0-7 3-12 8-12s8 5 8 12Z" fill="#d6453a" />
      <path d="M88 23h16" stroke="#f2f4f7" strokeWidth="2" />
      <circle cx="96" cy="9" r="3.4" fill="#f1c9a5" />
      <path d="M92.5 7.5c1-4 5-5.5 8-3.5l1.5 3Z" fill="#d6453a" />
      <circle cx="102.4" cy="7.2" r="1.3" fill="#f2f4f7" />
      <path d="M93 10.5c1 3 5 3 6 0Z" fill="#f2f4f7" />
    </svg>
  )
}

interface MountainFinishProps {
  run: Difficulty
  /** TRI-100: Christmas puts a star on the peak and sends Santa past; New Year sets off fireworks */
  themeDay?: ThemeDay | null
  /** Open the ticket; `skipped` when the player tapped to skip */
  onTicket: (skipped: boolean) => void
}

export function MountainFinish({ run, themeDay = null, onTicket }: MountainFinishProps) {
  const christmas = themeDay?.id === "christmas"
  const newYear = themeDay?.palette === "new-year"
  const rootRef = useRef<HTMLButtonElement>(null)
  const mountainRef = useRef<SVGGElement>(null)
  const trackRefs = useRef<(SVGPathElement | null)[]>([])
  const skierRef = useRef<HTMLDivElement>(null)
  const tuckRef = useRef<SVGGElement>(null)
  const skisRef = useRef<SVGGElement>(null)
  const bodyRef = useRef<SVGGElement>(null)
  const carveRef = useRef<SVGGElement>(null)
  const burstRef = useRef<HTMLDivElement>(null)
  const sprayRef = useRef<HTMLDivElement>(null)
  const starRef = useRef<SVGGElement>(null)
  const santaRef = useRef<HTMLDivElement>(null)
  const fireworksRef = useRef<HTMLDivElement>(null)
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
    const sprayLayer = sprayRef.current
    if (!root || !skier || !burst || !sprayLayer) return
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

    // 2. The skier's line, sampled so speed, pose and lean can be shaped frame by frame
    const exitX = window.innerWidth - box.left + 60
    const total = T.descent + T.turn + T.exit
    type Pose = { tuck: number; ski: number; lean: number; sink: number; carveLean: number; carveSink: number }
    const states: { at: number; p: Pt; flip: number; scale: number; pose: Pose }[] = []
    const tuck = (ski: number, lean: number, sink = 1): Pose => ({ tuck: 1, ski, lean, sink, carveLean: 0, carveSink: 1 })
    const carve = (lean: number, sink: number): Pose => ({ tuck: 0, ski: 0, lean: 0, sink: 1, carveLean: lean, carveSink: sink })
    // Drop: from the peak, accelerating (t² timing), heading down and left, so the skier
    // faces left (flip) in a tuck with skis along the fall line
    const N = 16
    let lastSki = 0
    for (let i = 0; i <= N; i++) {
      const s = i / N
      const p = toPx(bez(...DROP, s * s))
      const q = toPx(bez(...DROP, Math.min(1, s * s + 0.02)))
      lastSki = Math.min(55, ((Math.atan2(q[1] - p[1], Math.abs(q[0] - p[0]) + 0.001) * 180) / Math.PI) * 0.75)
      states.push({ at: s * T.descent, p, flip: -1, scale: 0.92 + 0.08 * s, pose: tuck(lastSki, 8 + s * 6) })
    }
    // The turn. First the skier sinks and sets the edges (still facing left), then carves
    // round on edge, leaning in, then rises and points the skis off to the right.
    const footAt = (s: number): Pt => {
      const p = toPx(bez(...HOOK, turnProgress(s)))
      return [box.left + p[0], box.top + p[1]]
    }
    const TN = 14
    for (let i = 1; i <= TN; i++) {
      const s = i / TN
      const p = toPx(bez(...HOOK, turnProgress(s)))
      const at = T.descent + s * T.turn
      let flip = 1
      let pose: Pose
      if (s < 0.2) {
        const k = s / 0.2
        flip = -1
        pose = tuck(lastSki + 8 * k, 14 + 8 * k, 1 - 0.12 * k)
      } else if (s < 0.78) {
        const k = (s - 0.2) / 0.58
        const bite = Math.sin(Math.PI * k)
        pose = carve(4 + 14 * bite, 0.94 - 0.1 * bite)
      } else {
        const k = (s - 0.78) / 0.22
        pose = tuck(-4 * k, -12 + 6 * k, 0.9 + 0.1 * k)
      }
      states.push({ at, p, flip, scale: 1, pose })
    }
    // Exit: off the right of the screen in a tuck, still accelerating
    const end = toPx(HOOK[3])
    for (let i = 1; i <= 5; i++) {
      const s = i / 5
      const k = Math.pow(s, 1.1)
      states.push({ at: T.descent + T.turn + s * T.exit, p: [end[0] + (exitX - end[0]) * k, end[1] - 8 * k], flip: 1, scale: 1, pose: tuck(-4, -6 + 4 * s) })
    }
    // Pose changes and flips are instant: hold the old pose until just before the new one
    const frames: Keyframe[] = []
    const tuckF: Keyframe[] = []
    const skis: Keyframe[] = []
    const body: Keyframe[] = []
    const carveF: Keyframe[] = []
    const emit = (st: (typeof states)[number], at: number) => {
      const o = at / total
      frames.push({ offset: o, transform: `translate(${st.p[0] - 17}px, ${st.p[1] - 30}px) scale(${st.flip * st.scale}, ${st.scale})` })
      tuckF.push({ offset: o, opacity: st.pose.tuck })
      carveF.push({ offset: o, opacity: 1 - st.pose.tuck, transform: `rotate(${st.pose.carveLean}deg) scale(1, ${st.pose.carveSink})` })
      skis.push({ offset: o, transform: `rotate(${st.pose.ski}deg)` })
      body.push({ offset: o, transform: `rotate(${st.pose.lean}deg) scale(1, ${st.pose.sink})` })
    }
    states.forEach((st, i) => {
      const prev = states[i - 1]
      if (prev && (prev.flip !== st.flip || prev.pose.tuck !== st.pose.tuck)) emit({ ...prev, p: st.p }, st.at - 6)
      emit(st, st.at)
    })
    const timing = { duration: total, delay: T.skierStart }
    play(skier, [{ opacity: 0, offset: 0 }, { opacity: 1, offset: 0.04 }], timing)
    play(skier.firstElementChild, frames, timing)
    play(tuckRef.current, tuckF, timing)
    play(carveRef.current, carveF, timing)
    play(skisRef.current, skis, timing)
    play(bodyRef.current, body, timing)

    // The track carves in behind the skier
    for (const path of trackRefs.current) {
      play(path, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: T.descent + T.turn, delay: T.skierStart, easing: "cubic-bezier(0.55, 0, 0.9, 0.55)" })
    }

    // 3. The snow. As the edges bite, snow sprays off the tails of the skis, away from the
    // turn: up and to the left. Through the carve it builds into big snowballs that fly off
    // the left of the screen. Then they swoop back in as one wave, left to right, in front
    // of everything, and the ticket appears behind its tail.
    const W = window.innerWidth
    const H = window.innerHeight
    const rand = seeded(11)
    const at = (x: number, y: number, size: number, scale: number) =>
      `translate(${x - size / 2}px, ${y - size / 2}px) scale(${scale})`
    // Where the spray leaves the skis at a point in the turn, and which way it flies: back
    // against the direction of travel, and out to the left
    const unit = box.width / 360
    const sprayFrom = (s: number) => {
      const [fx, fy] = footAt(s)
      const [nx, ny] = footAt(Math.min(1, s + 0.03))
      const len = Math.hypot(nx - fx, ny - fy) || 1
      const back: Pt = [-(nx - fx) / len, -(ny - fy) / len]
      const dir: Pt = [back[0] * 0.45 - 0.85, back[1] * 0.45 - 0.55]
      const dl = Math.hypot(dir[0], dir[1])
      // From the tails: a little behind and below the feet
      return { x: fx + back[0] * 14 * unit, y: fy + 4 * unit, dir: [dir[0] / dl, dir[1] / dl] as Pt }
    }
    const turnAt = (s: number) => TURN_AT + s * T.turn

    // The spray off the skis: small, fast and short-lived, the most at the apex
    const flakes = Array.from(sprayLayer.children) as HTMLElement[]
    flakes.forEach((flake) => {
      const s = 0.14 + 0.86 * ((rand() + rand()) / 2)
      const { x, y, dir } = sprayFrom(s)
      const size = (5 + rand() * 12) * unit
      flake.style.width = flake.style.height = `${size}px`
      const angle = Math.atan2(dir[1], dir[0]) + (rand() - 0.5) * 0.9
      const speed = (260 + rand() * 420) * unit // px per second
      const life = 0.32 + rand() * 0.26
      const gravity = 1100 * unit
      const kf: Keyframe[] = []
      for (let i = 0; i <= 5; i++) {
        const k = i / 5
        const t = k * life
        kf.push({
          offset: k,
          transform: at(x + Math.cos(angle) * speed * t, y + Math.sin(angle) * speed * t + 0.5 * gravity * t * t, size, 0.5 + 0.8 * k),
          opacity: k === 0 ? 0.95 : 0.95 * (1 - k * k),
        })
      }
      // Hidden until it's thrown (no backwards fill)
      anims.current.push(flake.animate(kf, { duration: life * 1000, delay: turnAt(s), easing: "cubic-bezier(0.2, 0.6, 0.4, 1)", fill: "forwards" }))
    })

    const balls = Array.from(burst.children) as HTMLElement[]
    const band = W * 1.5 // how deep the wave is, front to tail
    balls.forEach((ball) => {
      const size = Math.max(W, H) * (0.08 + rand() * 0.13)
      ball.style.width = ball.style.height = `${size}px`

      // Spray: thrown off the skis from the apex of the turn on, a fast fling up and to the
      // left, arcing off screen and growing as it nears us
      const from = 0.3 + 0.62 * rand()
      const { x: ox, y: oy, dir } = sprayFrom(from)
      const ex = -size * 0.6 - rand() * W * 0.3
      const ey = oy - H * (rand() * 0.7 - 0.1)
      const reach = Math.min(ox - ex, W * 0.5) * (0.25 + rand() * 0.2)
      const cx = ox + dir[0] * reach
      const cy = Math.min(oy + dir[1] * reach, ey) - H * (0.05 + rand() * 0.15)
      const spray: Keyframe[] = []
      for (let i = 0; i <= 6; i++) {
        const s = i / 6
        const u = 1 - s
        const x = u * u * ox + 2 * u * s * cx + s * s * ex
        const y = u * u * oy + 2 * u * s * cy + s * s * ey
        spray.push({ offset: s, transform: at(x, y, size, 0.05 + 0.77 * s), opacity: s === 0 ? 0 : 1 })
      }
      const sprayDelay = turnAt(from)
      const sprayFor = T.spray - rand() * 120
      play(ball, spray, { duration: sprayFor, delay: sprayDelay, easing: "cubic-bezier(0.15, 0.7, 0.4, 1)" })

      // Swoop: back in from the left as a wave that fills the screen, then away to the right.
      // Every ball travels the same distance, so the wave holds its shape; the middle leads,
      // giving the front a bow, and the whole wave rises in a gentle arc as it crosses.
      const lane = -0.06 * H + rand() * 1.12 * H
      const depth = rand() * band
      const x0 = -size / 2 - depth - 10
      const x1 = x0 + W + band + size + 60
      const lead = (Math.abs(lane - H / 2) / H) * 140
      const swoop: Keyframe[] = []
      for (let i = 0; i <= 10; i++) {
        const s = i / 10
        const x = x0 + (x1 - x0) * s
        const y = lane - H * 0.07 * Math.sin(Math.PI * s)
        swoop.push({ offset: s, transform: at(x, y, size, 0.9 + 0.15 * Math.sin(Math.PI * s)), opacity: 1 })
      }
      anims.current.push(
        // Never before this ball's own spray has left the screen
        ball.animate(swoop, { duration: T.swoop, delay: Math.max(SWOOP_AT + lead, sprayDelay + sprayFor + 16), easing: "cubic-bezier(0.3, 0.15, 0.4, 1)", fill: "forwards" }),
      )
    })

    // 4. Theme day extras (TRI-100), while the skier comes down and before the snow
    // Christmas: a star drops onto the peak (the board is the tree) and Santa crosses the sky
    play(starRef.current, [
      { transform: "translateY(-2.6px) scale(0)", opacity: 0 },
      { transform: "translateY(0.2px) scale(1.25)", opacity: 1, offset: 0.6 },
      { transform: "translateY(0) scale(1)", opacity: 1 },
    ], { duration: 520, delay: 180, easing: "cubic-bezier(0.3, 1.4, 0.5, 1)" })
    const santa = santaRef.current
    if (santa) {
      const y = Math.max(56, box.top + box.height * 0.04)
      const sf: Keyframe[] = []
      for (let i = 0; i <= 8; i++) {
        const k = i / 8
        const x = window.innerWidth + 30 - k * (window.innerWidth + 200)
        sf.push({ offset: k, transform: `translate(${x}px, ${y - Math.sin(Math.PI * k) * 26 - k * 10}px) rotate(${-4 + 8 * k}deg)` })
      }
      play(santa, sf, { duration: 1500, delay: 250 })
    }
    // New Year: three bursts of fireworks over the peak
    const fw = fireworksRef.current
    if (fw) {
      const bursts = Array.from(fw.children) as HTMLElement[]
      const spots: [number, number, number][] = [[0.5, -0.02, 380], [0.22, 0.14, 680], [0.8, 0.08, 940]]
      bursts.forEach((burstEl, b) => {
        const [fx, fy, at] = spots[b]
        const cx = box.left + box.width * fx
        const cy = box.top + box.height * fy
        const sparks = Array.from(burstEl.children) as HTMLElement[]
        const reach = Math.min(window.innerWidth, 480) * 0.18
        const fwRand = seeded(40 + b)
        sparks.forEach((spark, i) => {
          // Uneven, like a real shell: each spark flies its own distance, then droops and fades
          const a = (i / sparks.length) * Math.PI * 2 + fwRand() * 0.5
          const r = reach * (0.5 + fwRand() * 0.5)
          const dx = Math.cos(a) * r
          const dy = Math.sin(a) * r
          const life = 950 + fwRand() * 350
          play(spark, [
            { transform: `translate(${cx}px, ${cy}px) scale(0.4)`, opacity: 0 },
            { transform: `translate(${cx + dx * 0.7}px, ${cy + dy * 0.7}px) scale(1.1)`, opacity: 1, offset: 0.18 },
            { transform: `translate(${cx + dx}px, ${cy + dy + reach * 0.12}px) scale(0.8)`, opacity: 0.9, offset: 0.45 },
            { transform: `translate(${cx + dx * 1.08}px, ${cy + dy + reach * 0.55}px) scale(0.3)`, opacity: 0 },
          ], { duration: life, delay: at + fwRand() * 40, easing: "cubic-bezier(0.1, 0.7, 0.4, 1)" })
        })
      })
    }

    const t = setTimeout(() => {
      if (done.current) return
      done.current = true
      onTicketRef.current(false)
    }, TICKET_AT)
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
    if (sprayRef.current) sprayRef.current.style.display = "none"
    if (santaRef.current) santaRef.current.style.display = "none"
    if (fireworksRef.current) fireworksRef.current.style.display = "none"
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
          {christmas && (
            // A star on top of the tree, landing at the peak
            <g ref={starRef} style={{ transformOrigin: "9px -0.25px", transformBox: "view-box", opacity: 0 }}>
              <path
                d="M9 -1.55 9.36 -0.62 10.35 -0.58 9.58 0.04 9.84 1 9 0.45 8.16 1 8.42 0.04 7.65 -0.58 8.64 -0.62Z"
                fill="#f2b33d"
                stroke="#b8801f"
                strokeWidth="0.08"
                strokeLinejoin="round"
              />
            </g>
          )}
        </g>
      </svg>
      {typeof document !== "undefined" &&
        createPortal(
          <>
            {christmas && (
              <div ref={santaRef} className="finish-santa" aria-hidden="true">
                <SantaSleigh />
              </div>
            )}
            {newYear && (
              <div ref={fireworksRef} className="finish-fireworks" aria-hidden="true">
                {FIREWORK_COLOURS.map((colour) => (
                  <div key={colour}>
                    {Array.from({ length: 24 }, (_, i) => (
                      <span key={i} className="firework-spark" style={{ background: colour, color: colour }} />
                    ))}
                  </div>
                ))}
              </div>
            )}
            <div ref={sprayRef} className="snow-burst" aria-hidden="true">
              {Array.from({ length: FLAKES }, (_, i) => (
                <span key={i} className="snowball ski-spray" />
              ))}
            </div>
            <div ref={burstRef} className="snow-burst" aria-hidden="true">
              {Array.from({ length: SNOWBALLS }, (_, i) => (
                <span key={i} className="snowball" />
              ))}
            </div>
            {/* The skier rides in front of the snow, so the turn and the exit stay visible */}
            <div ref={skierRef} className="finish-skier" style={{ opacity: 0 }} aria-hidden="true">
              <div style={{ willChange: "transform", transformOrigin: "17px 30px" }}>
                <SkierFigure tuckRef={tuckRef} skisRef={skisRef} bodyRef={bodyRef} carveRef={carveRef} />
              </div>
            </div>
          </>,
          document.body,
        )}
    </button>
  )
}

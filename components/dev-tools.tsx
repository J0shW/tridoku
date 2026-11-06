"use client"

// Testing tools for preview and development builds. Never rendered in production
// (see components/tridoku-game.tsx). Everything here works on this browser's
// localStorage only; nothing is sent anywhere.

import { useEffect, useState } from "react"
import { Wrench, X } from "lucide-react"
import { TRIDOKU_BOARD, type Board, type Difficulty } from "@/lib/tridoku"
import { APP_ENV, BUILD_BRANCH, BUILD_COMMIT, DEV_TIME_OFFSET_KEY } from "@/lib/app-env"

const DAY_MS = 24 * 60 * 60 * 1000
const STORAGE_PREFIX = "tridoku-"

// ── Solver (used by "Fill all but 3 cells") ───────────────────────────────────

const CELLS = TRIDOKU_BOARD.flat().filter((c) => !c.hidden)
const INDEX = new Map(CELLS.map((c, i) => [c.id, i]))
const EDGE_KEYS = [
  "isOuterLeftEdge",
  "isOuterRightEdge",
  "isOuterBottomEdge",
  "isInnerLeftEdge",
  "isInnerRightEdge",
  "isInnerTopEdge",
] as const

// Every cell that may not share a digit with cell i: touching cells, its region and its edges.
const PEERS: number[][] = CELLS.map((cell, i) => {
  const peers = new Set<number>(cell.neighbors.map((id) => INDEX.get(id)!))
  CELLS.forEach((other, j) => {
    if (j === i) return
    if (other.boldedRegion === cell.boldedRegion) peers.add(j)
    if (EDGE_KEYS.some((k) => cell[k] && other[k])) peers.add(j)
  })
  return [...peers]
})

function solve(grid: number[]): boolean {
  let best = -1
  let bestCandidates: number[] = []
  for (let i = 0; i < grid.length; i++) {
    if (grid[i]) continue
    const used = new Set(PEERS[i].map((p) => grid[p]))
    const candidates = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((v) => !used.has(v))
    if (candidates.length === 0) return false
    if (best === -1 || candidates.length < bestCandidates.length) {
      best = i
      bestCandidates = candidates
    }
  }
  if (best === -1) return true
  for (const v of bestCandidates) {
    grid[best] = v
    if (solve(grid)) return true
  }
  grid[best] = 0
  return false
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function dateKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${m}-${day}`
}

function readOffset(): number {
  try {
    return Number(localStorage.getItem(DEV_TIME_OFFSET_KEY)) || 0
  } catch {
    return 0
  }
}

function setOffsetAndReload(offset: number) {
  try {
    if (offset) localStorage.setItem(DEV_TIME_OFFSET_KEY, String(Math.round(offset)))
    else localStorage.removeItem(DEV_TIME_OFFSET_KEY)
  } catch {
    /* storage unavailable */
  }
  window.location.reload()
}

// ── Component ─────────────────────────────────────────────────────────────────

interface DevToolsProps {
  cells: Board
  difficulty: Difficulty | null
  isViewMode: boolean
  onReloadPuzzle: (difficulty: Difficulty) => void
}

export function DevTools({ cells, difficulty, isViewMode, onReloadPuzzle }: DevToolsProps) {
  const [open, setOpen] = useState(false)
  const [now, setNow] = useState<Date | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const offset = now ? readOffset() : 0

  useEffect(() => {
    setNow(new Date())
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const envLabel = APP_ENV === "preview" ? "Preview" : "Development"
  const buildLabel = [BUILD_BRANCH, BUILD_COMMIT].filter(Boolean).join(" · ")

  const jumpToTonight = () => {
    const target = new Date()
    target.setHours(23, 58, 0, 0)
    setOffsetAndReload(offset + (target.getTime() - Date.now()))
  }

  const fillAllButThree = () => {
    if (!difficulty) return
    const givens = CELLS.map((c) => {
      const cell = cells[c.row][c.col]
      return cell.isGiven && cell.value ? cell.value : 0
    })
    const solution = [...givens]
    if (!solve(solution)) {
      setMessage("Couldn't solve this puzzle.")
      return
    }
    const empties = CELLS.map((_, i) => i).filter((i) => !givens[i])
    const leave = new Set(empties.slice(-3))
    const userCells = empties
      .filter((i) => !leave.has(i))
      .map((i) => ({ row: CELLS[i].row, col: CELLS[i].col, value: solution[i], pencilMarks: [] as number[] }))
    try {
      const key = "tridoku-game-state"
      const all = JSON.parse(localStorage.getItem(key) || "{}")
      all[difficulty] = {
        date: dateKey(new Date()),
        elapsedTime: 0,
        inputMode: "pen",
        userCells,
        puzzleHash: givens.join(""),
      }
      localStorage.setItem(key, JSON.stringify(all))
    } catch {
      setMessage("Couldn't write to storage.")
      return
    }
    onReloadPuzzle(difficulty)
    setMessage("Filled. 3 cells left, at the bottom of the board.")
  }

  const seedStreak = () => {
    const target = difficulty ?? "medium"
    const yesterday = new Date(Date.now() - DAY_MS)
    try {
      const key = "tridoku-stats"
      const blank = {
        gamesPlayed: 0, gamesWon: 0, currentStreak: 0, maxStreak: 0,
        bestTime: null, lastPlayedDate: null, completedToday: false,
      }
      const stats = JSON.parse(localStorage.getItem(key) || "null") ?? { easy: blank, medium: blank, hard: blank }
      stats[target] = {
        gamesPlayed: 5, gamesWon: 5, currentStreak: 5, maxStreak: 5,
        bestTime: 300, lastPlayedDate: dateKey(yesterday), completedToday: false,
      }
      const progress = JSON.parse(localStorage.getItem("tridoku-game-state") || "{}")
      delete progress[target]
      localStorage.setItem("tridoku-game-state", JSON.stringify(progress))
      localStorage.setItem(key, JSON.stringify(stats))
    } catch {
      setMessage("Couldn't write to storage.")
      return
    }
    window.location.reload()
  }

  const clearAll = () => {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(STORAGE_PREFIX))
        .forEach((k) => localStorage.removeItem(k))
    } catch {
      /* storage unavailable */
    }
    window.location.reload()
  }

  const btn =
    "rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none"

  return (
    <div
      className="fixed z-50 flex flex-col items-start gap-2"
      style={{
        left: "calc(12px + env(safe-area-inset-left, 0px))",
        bottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
      }}
    >
      {open && (
        <div
          role="dialog"
          aria-label="Dev tools"
          className="w-[min(320px,calc(100vw-24px))] rounded-xl border border-border bg-card p-4 text-sm shadow-2xl space-y-4"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold">Dev tools</p>
              <p className="text-xs text-muted-foreground">
                {envLabel}
                {buildLabel ? ` · ${buildLabel}` : ""}. Not shown in production.
              </p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close dev tools" className="p-1 rounded hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </div>

          <section className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Clock</p>
            <p className="text-xs">
              App time: <span className="font-mono">{now ? now.toLocaleString() : "…"}</span>
              {offset !== 0 && <span className="ml-1 rounded bg-amber-200 px-1 text-amber-900">shifted</span>}
            </p>
            <div className="flex flex-wrap gap-1.5">
              <button className={btn} onClick={() => setOffsetAndReload(offset - DAY_MS)}>−1 day</button>
              <button className={btn} onClick={() => setOffsetAndReload(offset + DAY_MS)}>+1 day</button>
              <button className={btn} onClick={jumpToTonight}>Tonight 23:58</button>
              <button className={btn} onClick={() => setOffsetAndReload(0)} disabled={offset === 0}>Real time</button>
            </div>
          </section>

          <section className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Puzzle</p>
            <div className="flex flex-wrap gap-1.5">
              <button className={btn} onClick={fillAllButThree} disabled={!difficulty || isViewMode}>
                Fill all but 3 cells
              </button>
              <button className={btn} onClick={seedStreak}>
                Seed 5-day streak ({difficulty ?? "medium"})
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              The streak seed ends yesterday. Solve today&apos;s puzzle and the streak should read 6.
            </p>
          </section>

          <section className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Saved data</p>
            <button className={btn} onClick={clearAll}>Clear all saved data and reload</button>
          </section>

          {message && <p className="text-xs text-foreground">{message}</p>}
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full border border-amber-400 bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-900 shadow-md hover:bg-amber-200"
      >
        <Wrench className="h-3.5 w-3.5" />
        {envLabel}
        {offset !== 0 && now && <span className="font-mono font-normal">· {dateKey(now)}</span>}
      </button>
    </div>
  )
}

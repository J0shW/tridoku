// Per-puzzle counters sent with completion and abandonment events (TRI-019):
// wrong entries, notes added, resets, and quick clears (a digit cleared within 2 s of
// being entered: a likely mis-tap, TRI-059). Wrong entries are also counted per region
// for the share grid (TRI-036). Kept in localStorage so they survive a reload or a
// reset of the same puzzle; only today's puzzles are kept.

import type { DateKey } from "@/lib/dates"
import type { Difficulty } from "@/lib/tridoku"

const KEY = "tridoku-play-counters"
export const REGION_COUNT = 9

export interface PlayCounters {
  errors: number
  notes: number
  resets: number
  /** Digits cleared within 2 seconds of being entered in the same cell. */
  quickClears: number
  /** Wrong entries in each of the 9 bolded regions (index = boldedRegion). */
  regionErrors: number[]
}

type CountField = "errors" | "notes" | "resets" | "quickClears"
type Store = Record<string, Partial<PlayCounters>>

const empty = (): PlayCounters => ({ errors: 0, notes: 0, resets: 0, quickClears: 0, regionErrors: Array(REGION_COUNT).fill(0) })
const id = (difficulty: Difficulty, date: DateKey) => `${date}:${difficulty}`

function read(): Store {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}")
  } catch {
    return {}
  }
}

function withDefaults(stored: Partial<PlayCounters> | undefined): PlayCounters {
  const c = { ...empty(), ...stored }
  // Saves from before regionErrors existed, or a malformed array
  const regions = Array.isArray(stored?.regionErrors) ? stored.regionErrors : []
  c.regionErrors = Array.from({ length: REGION_COUNT }, (_, i) => (typeof regions[i] === "number" ? regions[i] : 0))
  return c
}

export function getCounters(difficulty: Difficulty, date: DateKey): PlayCounters {
  if (typeof window === "undefined") return empty()
  return withDefaults(read()[id(difficulty, date)])
}

/** Adds one to a counter. For "errors", pass the cell's region to count it per region too. */
export function bumpCounter(difficulty: Difficulty, date: DateKey, field: CountField, region?: number) {
  if (typeof window === "undefined") return
  try {
    const store = read()
    // Drop other days' counters
    for (const k of Object.keys(store)) if (!k.startsWith(date)) delete store[k]
    const c = withDefaults(store[id(difficulty, date)])
    c[field] += 1
    if (field === "errors" && region !== undefined && region >= 0 && region < REGION_COUNT) c.regionErrors[region] += 1
    store[id(difficulty, date)] = c
    localStorage.setItem(KEY, JSON.stringify(store))
  } catch {
    /* storage unavailable */
  }
}

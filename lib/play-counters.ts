// Per-puzzle counters sent with completion and abandonment events (TRI-019):
// wrong entries, notes added and resets. Kept in localStorage so they survive a
// reload or a reset of the same puzzle; only today's puzzles are kept.

import type { DateKey } from "@/lib/dates"
import type { Difficulty } from "@/lib/tridoku"

const KEY = "tridoku-play-counters"

export interface PlayCounters {
  errors: number
  notes: number
  resets: number
}

type Store = Record<string, PlayCounters>

const empty = (): PlayCounters => ({ errors: 0, notes: 0, resets: 0 })
const id = (difficulty: Difficulty, date: DateKey) => `${date}:${difficulty}`

function read(): Store {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}")
  } catch {
    return {}
  }
}

export function getCounters(difficulty: Difficulty, date: DateKey): PlayCounters {
  if (typeof window === "undefined") return empty()
  return { ...empty(), ...read()[id(difficulty, date)] }
}

export function bumpCounter(difficulty: Difficulty, date: DateKey, field: keyof PlayCounters) {
  if (typeof window === "undefined") return
  try {
    const store = read()
    // Drop other days' counters
    for (const k of Object.keys(store)) if (!k.startsWith(date)) delete store[k]
    const c = { ...empty(), ...store[id(difficulty, date)] }
    c[field] += 1
    store[id(difficulty, date)] = c
    localStorage.setItem(KEY, JSON.stringify(store))
  } catch {
    /* storage unavailable */
  }
}

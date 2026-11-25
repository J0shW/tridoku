// Pins to collect on the season pass (TRI-108). Earned pins are kept on this device in
// "tridoku-pins" so they stay earned; nothing new is sent anywhere. Pins that can be read
// from saved stats count for players who earned them before pins existed.

import type { DateKey } from "@/lib/dates"
import type { GameStats } from "@/lib/stats"
import type { Difficulty } from "@/lib/tridoku"

export type PinId = "first-tracks" | "off-piste" | "triple-run" | "double-black"

export interface Pin {
  id: PinId
  name: string
  /** How to earn it, shown under the pin */
  how: string
}

export const PINS: Pin[] = [
  { id: "first-tracks", name: "First tracks", how: "Finish your first run" },
  { id: "off-piste", name: "Off piste", how: "Finish a run without pencil notes" },
  { id: "triple-run", name: "Triple run", how: "Finish all three runs in a day" },
  { id: "double-black", name: "Double black", how: "Finish Hard two days in a row" },
]

export interface EarnedPin {
  /** The day it was earned; null for pins read from stats saved before pins existed */
  date: DateKey | null
  /** The puzzle that earned it, "date:difficulty", so the ticket can show it as new */
  run?: string
}
export type PinBook = Partial<Record<PinId, EarnedPin>>

const KEY = "tridoku-pins"
export const runId = (difficulty: Difficulty, date: DateKey) => `${date}:${difficulty}`

/** Pins that saved stats already prove. */
export function pinsFromStats(stats: GameStats): PinId[] {
  const pins: PinId[] = []
  if (stats.easy.gamesWon + stats.medium.gamesWon + stats.hard.gamesWon > 0) pins.push("first-tracks")
  const last = stats.easy.lastPlayedDate
  if (last && stats.medium.lastPlayedDate === last && stats.hard.lastPlayedDate === last) pins.push("triple-run")
  if (stats.hard.maxStreak >= 2) pins.push("double-black")
  return pins
}

/** Pins earned by the win just recorded: `stats` already includes it. */
export function pinsForWin(stats: GameStats, { notes }: { notes: number }): PinId[] {
  const pins = pinsFromStats(stats)
  if (notes === 0) pins.push("off-piste")
  return pins
}

export function readPins(): PinBook {
  if (typeof window === "undefined") return {}
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "{}")
    return raw && typeof raw === "object" ? raw : {}
  } catch {
    return {}
  }
}

/** Adds any pins not yet earned and returns the new ones. */
export function awardPins(ids: PinId[], date: DateKey, run?: string): PinId[] {
  if (typeof window === "undefined") return []
  const book = readPins()
  const added = ids.filter((id) => !book[id])
  if (added.length === 0) return []
  for (const id of added) book[id] = run ? { date, run } : { date }
  try {
    localStorage.setItem(KEY, JSON.stringify(book))
  } catch {
    // Storage full or blocked: the pin shows again next time it's earned
  }
  return added
}

/** Every pin with how it was earned, counting pins proven by stats saved before pins existed. */
export function pinBoard(stats: GameStats, book: PinBook = readPins()): { pin: Pin; earned: EarnedPin | null }[] {
  const proven = new Set(pinsFromStats(stats))
  return PINS.map((pin) => ({ pin, earned: book[pin.id] ?? (proven.has(pin.id) ? { date: null } : null) }))
}

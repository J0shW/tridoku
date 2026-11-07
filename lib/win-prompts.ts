// Small prompts in the win modal, remembered in localStorage:
// - the Ko-fi line, shown for at most one puzzle a week (TRI-041)
// - the one-tap difficulty rating, asked once per puzzle (TRI-042)

import { daysBetween, type DateKey } from "@/lib/dates"
import type { Difficulty } from "@/lib/tridoku"

const KOFI_KEY = "tridoku-kofi-prompt"
const RATINGS_KEY = "tridoku-ratings"
const KOFI_EVERY_DAYS = 7

export type Rating = "too_easy" | "just_right" | "too_hard"
export const RATINGS: { value: Rating; label: string }[] = [
  { value: "too_easy", label: "Too easy" },
  { value: "just_right", label: "Just right" },
  { value: "too_hard", label: "Too hard" },
]

const puzzleId = (difficulty: Difficulty, date: DateKey) => `${date}:${difficulty}`

function readJson<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback
  } catch {
    return fallback
  }
}

/**
 * Whether the Ko-fi line belongs in this puzzle's win modal. The first eligible puzzle
 * claims the week, so reopening that same result keeps showing it, and no other puzzle
 * shows it until 7 days later. Without storage it never shows, to avoid nagging.
 */
export function claimKofiPrompt(difficulty: Difficulty, date: DateKey, today: DateKey): boolean {
  if (typeof window === "undefined") return false
  try {
    const last = readJson<{ date?: DateKey; puzzle?: string } | null>(KOFI_KEY, null)
    const id = puzzleId(difficulty, date)
    if (last?.puzzle === id) return true
    if (last?.date && daysBetween(last.date, today) < KOFI_EVERY_DAYS) return false
    localStorage.setItem(KOFI_KEY, JSON.stringify({ date: today, puzzle: id }))
    return true
  } catch {
    return false
  }
}

export function getRating(difficulty: Difficulty, date: DateKey): Rating | null {
  if (typeof window === "undefined") return null
  return readJson<Record<string, Rating>>(RATINGS_KEY, {})[puzzleId(difficulty, date)] ?? null
}

/** Remembers a rating. Keeps the last 30 so the store stays small. */
export function saveRating(difficulty: Difficulty, date: DateKey, rating: Rating) {
  if (typeof window === "undefined") return
  try {
    const all = readJson<Record<string, Rating>>(RATINGS_KEY, {})
    all[puzzleId(difficulty, date)] = rating
    const kept = Object.keys(all).sort().slice(-30)
    localStorage.setItem(RATINGS_KEY, JSON.stringify(Object.fromEntries(kept.map((k) => [k, all[k]]))))
  } catch {
    /* storage unavailable */
  }
}

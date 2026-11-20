// What a winner shares, and the comparisons shown at the win moment (TRI-034, TRI-036, TRI-037).
// Pure functions, so the share text can be unit-tested.

import { daysBetween, type DateKey } from "@/lib/dates"
import { DIFFICULTIES, type GameStats } from "@/lib/stats"
import { formatTime, type Difficulty } from "@/lib/tridoku"

export const SITE_URL = "https://www.tridokupuzzle.com/"

export const DIFFICULTY_LABEL: Record<Difficulty, string> = { easy: "Easy", medium: "Medium", hard: "Hard" }
export const DIFFICULTY_EMOJI: Record<Difficulty, string> = { easy: "🟢", medium: "🟡", hard: "🔴" }

/** Canonical link with attribution, so Umami can count visits from shares (TRI-037). */
export function shareUrl(difficulty: Difficulty): string {
  return `${SITE_URL}?utm_source=share&utm_content=${difficulty}`
}

const CLEAN = "🟩"
const SLIPPED = "🟨"
// One tile's width of indent: an ideographic space, a thin space and a regular space.
// The regular space was added after the owner lined the grid up by hand in iPhone Notes
// and iMessage (7 Nov): without it the top rows sat left of centre.
const TILE_INDENT = "　  "

/**
 * The 9 regions as a triangle of tiles in rows of 1, 3 and 5, left to right as on the
 * board (region numbers come from lib/tridoku.ts). Green: no wrong entries in that
 * region. Yellow: at least one. Says nothing about which digits go where.
 */
export function regionGrid(regionErrors: readonly number[] | undefined): string {
  const tile = (i: number) => ((regionErrors?.[i] ?? 0) > 0 ? SLIPPED : CLEAN)
  const rows = [[0], [1, 2, 3], [4, 5, 6, 7, 8]]
  return rows.map((regions, r) => TILE_INDENT.repeat(2 - r) + regions.map(tile).join("")).join("\n")
}

export interface ShareResult {
  puzzleNumber: number
  difficulty: Difficulty
  time: number
  streak: number
  regionErrors?: readonly number[]
}

export function buildShareText({ puzzleNumber, difficulty, time, streak, regionErrors }: ShareResult): string {
  return [
    `Daily Tridoku #${puzzleNumber} · ${DIFFICULTY_EMOJI[difficulty]} ${DIFFICULTY_LABEL[difficulty]}`,
    `⏱️ ${formatTime(time)}  🔥 ${streak}-day streak`,
    "",
    regionGrid(regionErrors),
    "",
    shareUrl(difficulty),
  ].join("\n")
}

// ── Mountain theme (TRI-106) ─────────────────────────────────────────────────────────

/** The run shapes as plain text characters, so they paste anywhere. */
export const RUN_SHAPE: Record<Difficulty, string> = { easy: "●", medium: "■", hard: "◆" }

export type RunTimes = Partial<Record<Difficulty, number>>

const CODE_LETTER: Record<Difficulty, string> = { easy: "e", medium: "m", hard: "h" }
const MAX_TIME = 24 * 60 * 60

/** "e192-m400-h521": each run done that day and its time in seconds. Runs not done are left out. */
export function encodeRunTimes(times: RunTimes): string {
  return DIFFICULTIES.filter((d) => times[d] != null).map((d) => `${CODE_LETTER[d]}${Math.round(times[d]!)}`).join("-")
}

/** Reads a code made by encodeRunTimes. Anything malformed or out of range is ignored. */
export function decodeRunTimes(code: string | null | undefined): RunTimes {
  const out: RunTimes = {}
  for (const part of (code ?? "").split("-")) {
    const m = /^([emh])(\d{1,5})$/.exec(part)
    if (!m) continue
    const d = DIFFICULTIES.find((k) => CODE_LETTER[k] === m[1])!
    const t = Number(m[2])
    if (t <= MAX_TIME && out[d] == null) out[d] = t
  }
  return out
}

/** The link a Mountain result shares: its own preview ticket, and it opens the game. */
export function mountainShareUrl(date: DateKey, times: RunTimes): string {
  return `${SITE_URL}r/${date}/${encodeRunTimes(times)}`
}

export interface MountainShareResult {
  puzzleNumber: number
  date: DateKey
  times: RunTimes
  streak: number
}

/**
 * One line for the whole day, with the run shapes:
 *   Daily Tridoku #324
 *   ● 3:12  ■ 6:40  ◆ 8:41
 *   7-day streak
 *   https://www.tridokupuzzle.com/r/2026-11-20/e192-m400-h521
 */
export function buildMountainShareText({ puzzleNumber, date, times, streak }: MountainShareResult): string {
  const runs = DIFFICULTIES.filter((d) => times[d] != null).map((d) => `${RUN_SHAPE[d]} ${formatTime(times[d]!)}`)
  return [
    `Daily Tridoku #${puzzleNumber}`,
    runs.join("  "),
    ...(streak > 1 ? [`${streak}-day streak`] : []),
    mountainShareUrl(date, times),
  ].join("\n")
}

export type BestComparison =
  | { kind: "first" }
  | { kind: "new_best"; by: number }
  | { kind: "tie" }
  | { kind: "slower"; best: number; by: number }

/** How this solve compares with the best time before it (TRI-034). */
export function compareWithBest(time: number, previousBest: number | null | undefined): BestComparison {
  if (previousBest == null) return { kind: "first" }
  if (time < previousBest) return { kind: "new_best", by: previousBest - time }
  if (time === previousBest) return { kind: "tie" }
  return { kind: "slower", best: previousBest, by: time - previousBest }
}

/**
 * The difficulty to offer next: the next harder one not yet solved today, wrapping
 * round to easier ones. Null when every difficulty is done (TRI-034).
 */
export function nextUnfinished(current: Difficulty, stats: GameStats, today: DateKey): Difficulty | null {
  const start = DIFFICULTIES.indexOf(current)
  for (let step = 1; step < DIFFICULTIES.length; step++) {
    const d = DIFFICULTIES[(start + step) % DIFFICULTIES.length]
    const last = stats[d].lastPlayedDate
    if (!last || daysBetween(last, today) !== 0) return d
  }
  return null
}

/** "05:12:09" until the next puzzle. */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`
}

// Calendar dates for the daily puzzle. A "date key" is a local calendar date,
// "YYYY-MM-DD", zero-padded. Every place that names a puzzle day uses these helpers.

import { addDays as addDaysFns, differenceInCalendarDays } from "date-fns"

export type DateKey = string

/** Local calendar date of `date` as "YYYY-MM-DD". */
export function toDateKey(date: Date): DateKey {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/** Today's date key, in the player's time zone. */
export function todayKey(): DateKey {
  return toDateKey(new Date())
}

/** Local midnight of a date key. Accepts unpadded keys ("2026-11-5") from older saves. */
export function fromDateKey(key: DateKey): Date {
  const [y, m, d] = key.split("-").map(Number)
  return new Date(y, m - 1, d)
}

/** Re-format any stored date string as a canonical zero-padded key, or null if invalid. */
export function normalizeDateKey(key: string | null | undefined): DateKey | null {
  if (!key || !/^\d{4}-\d{1,2}-\d{1,2}$/.test(key)) return null
  const date = fromDateKey(key)
  return Number.isNaN(date.getTime()) ? null : toDateKey(date)
}

/** Calendar days from `from` to `to` (1 = `to` is the next day). Safe across DST changes. */
export function daysBetween(from: DateKey, to: DateKey): number {
  return differenceInCalendarDays(fromDateKey(to), fromDateKey(from))
}

export function addDays(key: DateKey, days: number): DateKey {
  return toDateKey(addDaysFns(fromDateKey(key), days))
}

// The season pass (TRI-108): statistics drawn from what's already stored in "tridoku-stats".
// Each run keeps only its last solve and current streak, so the days you skied are the
// streak's days ending on that last solve. Older gaps in the week can't be known, so a
// day only shows as skied when it's inside a streak, as on the lift ticket.

import { addDays, daysBetween, fromDateKey, type DateKey } from "@/lib/dates"
import { DIFFICULTIES, type DifficultyStats, type GameStats } from "@/lib/stats"
import type { Difficulty } from "@/lib/tridoku"

/** The days a run is known to have been solved: its current streak, ending on its last solve. */
export function solvedDays(s: DifficultyStats): DateKey[] {
  if (!s.lastPlayedDate) return []
  const days = Math.max(1, s.currentStreak)
  return Array.from({ length: days }, (_, i) => addDays(s.lastPlayedDate as DateKey, -i))
}

export function mondayOf(date: DateKey): DateKey {
  return addDays(date, -((fromDateKey(date).getDay() + 6) % 7))
}

/** This week, Monday to Sunday: which days each run was solved. */
export function weekGrid(stats: GameStats, today: DateKey): Record<Difficulty, boolean[]> {
  const monday = mondayOf(today)
  const week = Array.from({ length: 7 }, (_, i) => addDays(monday, i))
  const grid = {} as Record<Difficulty, boolean[]>
  for (const d of DIFFICULTIES) {
    const solved = new Set(solvedDays(stats[d]))
    grid[d] = week.map((day) => solved.has(day))
  }
  return grid
}

/**
 * The day streak: days in a row with at least one run solved, ending today (or yesterday,
 * while today is still open). Longest is at least the longest streak on any one run.
 */
export function dayStreak(stats: GameStats, today: DateKey): { current: number; longest: number } {
  const days = new Set(DIFFICULTIES.flatMap((d) => solvedDays(stats[d])))
  let day: DateKey | null = days.has(today) ? today : days.has(addDays(today, -1)) ? addDays(today, -1) : null
  let current = 0
  while (day && days.has(day)) {
    current++
    day = addDays(day, -1)
  }
  const longest = Math.max(current, ...DIFFICULTIES.map((d) => stats[d].maxStreak))
  return { current, longest }
}

/** "2026–27 season": a ski season runs through the winter, so it turns over in July. */
export function seasonLabel(today: DateKey): string {
  const d = fromDateKey(today)
  const start = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1
  return `${start}–${String((start + 1) % 100).padStart(2, "0")} season`
}

/** True when `date` falls in the same Monday-to-Sunday week as `today`. */
export function inThisWeek(date: DateKey, today: DateKey): boolean {
  const back = daysBetween(mondayOf(today), date)
  return back >= 0 && back < 7
}

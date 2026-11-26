// Theme days (TRI-100): the Mountain look dresses up for a date. Picked by the puzzle's own
// date (the day being played), never the clock, and never changes the puzzle, the timer or
// the share text. Josh chose the calendar on 25 Nov:
//  - December: a winter look in the scenery (snow on the pines, flakes before you start)
//  - Christmas Day: the board is a tree, lights on the pines, a star and Santa at the finish
//  - New Year's Eve and Day: a champagne-and-midnight board, fireworks at the finish
// Extras stay at the start and finish, never while you're solving (TRI-104).

import type { DateKey } from './dates.ts'

export type ThemeDayId = 'winter' | 'christmas' | 'new-years-eve' | 'new-years-day'

export interface ThemeDay {
  id: ThemeDayId
  /** The header line ("Christmas Day · #359"); null for the general winter look */
  name: string | null
  /** The board's palette family: null keeps each run's own palette */
  palette: 'christmas' | 'new-year' | null
  /** Snow on the pines and flakes in the sky */
  snow: boolean
}

const WINTER: ThemeDay = { id: 'winter', name: null, palette: null, snow: true }
const CHRISTMAS: ThemeDay = { id: 'christmas', name: 'Christmas Day', palette: 'christmas', snow: true }
const NYE: ThemeDay = { id: 'new-years-eve', name: "New Year's Eve", palette: 'new-year', snow: true }
const NYD: ThemeDay = { id: 'new-years-day', name: "New Year's Day", palette: 'new-year', snow: false }

/** The theme for a puzzle date, or null on an ordinary day. */
export function themeDayFor(date: DateKey | null | undefined): ThemeDay | null {
  if (!date) return null
  const month = Number(date.slice(5, 7))
  const day = Number(date.slice(8, 10))
  if (month === 12) return day === 25 ? CHRISTMAS : day === 31 ? NYE : WINTER
  if (month === 1 && day === 1) return NYD
  return null
}

// Each day's three runs get trail names on the Mountain theme (TRI-101), the same for
// everyone because they're picked from the puzzle's date.

import { daysBetween, type DateKey } from './dates.ts'
import type { Difficulty } from './tridoku.ts'

const NAMES: Record<Difficulty, string[]> = {
  easy: [
    'Marmot Meadow', 'Bunny Hollow', 'Sunny Side', 'Lazy Loop', 'Pika Path', 'Easy Street',
    'Snowshoe Lane', 'Cocoa Run', 'Little Larch', 'Meadowlark', 'Toboggan Trail',
  ],
  medium: [
    'Spruce Glade', 'Ptarmigan Ridge', 'Elk Crossing', 'Corduroy Bowl', 'Lone Pine', 'Fox Run',
    'Aspen Alley', 'Bluebird', 'Silver Fir', 'Moose Track', 'Timberline',
  ],
  hard: [
    'The Chute', 'Avalanche Alley', 'Cornice', 'The Plunge', 'Black Bear', 'Couloir',
    'Free Fall', 'The Headwall', 'Granite Gully', 'Steep & Deep', 'Eagle Drop',
  ],
}

const START: DateKey = '2026-01-01'

/** The run's name for a puzzle date, e.g. "Spruce Glade". */
export function runName(difficulty: Difficulty, date: DateKey): string {
  const list = NAMES[difficulty]
  const n = daysBetween(START, date)
  return list[((n % list.length) + list.length) % list.length]
}

/** Shape names, for labels and screen readers. */
export const RUN_CLASS: Record<Difficulty, string> = {
  easy: 'Green circle',
  medium: 'Blue square',
  hard: 'Black diamond',
}

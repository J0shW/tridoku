// TRI-105: the lift ticket punches this week's days that are inside the run's streak.
import { describe, expect, it } from 'vitest'
import { weekPunches } from '@/components/lift-ticket'

describe('weekPunches', () => {
  // 20 Nov 2026 is a Friday, so the week runs Mon 16 – Sun 22
  it('punches today and the streak days before it, Monday to Sunday', () => {
    expect(weekPunches('2026-11-20', 3, true)).toEqual([false, false, true, true, true, false, false])
  })

  it('stops at Monday when the streak is longer than the week so far', () => {
    expect(weekPunches('2026-11-20', 30, true)).toEqual([true, true, true, true, true, false, false])
  })

  it('punches nothing when the puzzle date was not solved', () => {
    expect(weekPunches('2026-11-20', 5, false)).toEqual([false, false, false, false, false, false, false])
  })

  it('handles a Sunday as the last day of the week', () => {
    expect(weekPunches('2026-11-22', 2, true)).toEqual([false, false, false, false, false, true, true])
  })
})

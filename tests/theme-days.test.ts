// TRI-100: theme days follow the puzzle's date, and only dress the Mountain look.
import { describe, expect, it } from 'vitest'
import { themeDayFor } from '@/lib/theme-days'
import { getPalette } from '@/lib/palettes'

describe('themeDayFor', () => {
  it('picks the days Josh chose', () => {
    expect(themeDayFor('2026-12-25')?.id).toBe('christmas')
    expect(themeDayFor('2026-12-31')?.id).toBe('new-years-eve')
    expect(themeDayFor('2027-01-01')?.id).toBe('new-years-day')
  })

  it('gives the rest of December the general winter look, with no header line', () => {
    for (const d of ['2026-12-01', '2026-12-24', '2026-12-26', '2026-12-30']) {
      expect(themeDayFor(d)).toMatchObject({ id: 'winter', name: null, palette: null })
    }
  })

  it('is an ordinary day otherwise', () => {
    for (const d of ['2026-11-30', '2027-01-02', '2026-10-31', null]) expect(themeDayFor(d)).toBeNull()
  })
})

describe('getPalette on a theme day', () => {
  const xmas = themeDayFor('2026-12-25')
  it('dresses Mountain the same on every run', () => {
    expect(getPalette('mountain', 'easy', false, xmas)).toBe(getPalette('mountain', 'hard', false, xmas))
    expect(getPalette('mountain', 'easy', false, xmas)).not.toBe(getPalette('mountain', 'easy', false))
  })

  it('keeps each run its own board in the December winter look', () => {
    const winter = themeDayFor('2026-12-10')
    expect(getPalette('mountain', 'medium', false, winter)).toBe(getPalette('mountain', 'medium', false))
  })

  it('never changes Classic', () => {
    expect(getPalette('classic', 'easy', true, xmas)).toBe(getPalette('classic', 'easy', true))
  })
})

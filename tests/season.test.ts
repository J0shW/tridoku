// TRI-108: the season pass and its pins, from saved stats only.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defaultStats, type GameStats } from '@/lib/stats'
import { dayStreak, seasonLabel, weekGrid } from '@/lib/season'
import { awardPins, pinBoard, pinsForWin, pinsFromStats, readPins } from '@/lib/pins'

// 25 Nov 2026 is a Wednesday, so the week runs Mon 23 – Sun 29
const TODAY = '2026-11-25'

function stats(patch: Partial<Record<keyof GameStats, Partial<GameStats['easy']>>>): GameStats {
  const s = defaultStats()
  for (const [d, p] of Object.entries(patch)) Object.assign(s[d as keyof GameStats], p)
  return s
}

describe('weekGrid', () => {
  it('marks each run’s streak days in this week', () => {
    const g = weekGrid(stats({ easy: { lastPlayedDate: TODAY, currentStreak: 2, gamesWon: 2 }, hard: { lastPlayedDate: '2026-11-23', currentStreak: 1, gamesWon: 1 } }), TODAY)
    expect(g.easy).toEqual([false, true, true, false, false, false, false])
    expect(g.medium).toEqual([false, false, false, false, false, false, false])
    expect(g.hard).toEqual([true, false, false, false, false, false, false])
  })

  it('still shows the last solve after its streak has lapsed', () => {
    const g = weekGrid(stats({ medium: { lastPlayedDate: '2026-11-23', currentStreak: 0, gamesWon: 4 } }), TODAY)
    expect(g.medium[0]).toBe(true)
  })
})

describe('dayStreak', () => {
  it('joins the runs: any run solved counts the day', () => {
    // Easy Mon–Tue, Hard Wed: three days in a row
    const s = stats({ easy: { lastPlayedDate: '2026-11-24', currentStreak: 2, maxStreak: 2 }, hard: { lastPlayedDate: TODAY, currentStreak: 1, maxStreak: 1 } })
    expect(dayStreak(s, TODAY)).toEqual({ current: 3, longest: 3 })
  })

  it('keeps counting through yesterday while today is still open', () => {
    const s = stats({ easy: { lastPlayedDate: '2026-11-24', currentStreak: 4, maxStreak: 6 } })
    expect(dayStreak(s, TODAY)).toEqual({ current: 4, longest: 6 })
  })

  it('is zero with nothing solved', () => {
    expect(dayStreak(defaultStats(), TODAY)).toEqual({ current: 0, longest: 0 })
  })
})

describe('seasonLabel', () => {
  it('turns over in July', () => {
    expect(seasonLabel('2026-11-25')).toBe('2026–27 season')
    expect(seasonLabel('2027-03-01')).toBe('2026–27 season')
    expect(seasonLabel('2027-07-01')).toBe('2027–28 season')
  })
})

describe('pins', () => {
  beforeEach(() => {
    const m = new Map<string, string>()
    vi.stubGlobal('localStorage', { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) })
    vi.stubGlobal('window', globalThis)
  })
  afterEach(() => vi.unstubAllGlobals())

  it('reads first tracks, triple run and double black from saved stats', () => {
    const s = stats({
      easy: { gamesWon: 1, lastPlayedDate: TODAY },
      medium: { gamesWon: 1, lastPlayedDate: TODAY },
      hard: { gamesWon: 3, lastPlayedDate: TODAY, maxStreak: 2 },
    })
    expect(pinsFromStats(s)).toEqual(['first-tracks', 'triple-run', 'double-black'])
    expect(pinsFromStats(defaultStats())).toEqual([])
  })

  it('earns off piste for a win with no notes', () => {
    const s = stats({ easy: { gamesWon: 1, lastPlayedDate: TODAY } })
    expect(pinsForWin(s, { notes: 0 })).toEqual(['first-tracks', 'off-piste'])
    expect(pinsForWin(s, { notes: 3 })).toEqual(['first-tracks'])
  })

  it('keeps a pin once earned, and reports only new ones', () => {
    expect(awardPins(['first-tracks', 'off-piste'], TODAY, `${TODAY}:easy`)).toEqual(['first-tracks', 'off-piste'])
    expect(awardPins(['first-tracks'], '2026-11-26')).toEqual([])
    expect(readPins()['first-tracks']).toEqual({ date: TODAY, run: `${TODAY}:easy` })
  })

  it('shows pins proven by older stats as earned without a date', () => {
    const board = pinBoard(stats({ hard: { gamesWon: 2, maxStreak: 2, lastPlayedDate: TODAY } }), {})
    expect(board.map((b) => [b.pin.id, b.earned])).toEqual([
      ['first-tracks', { date: null }],
      ['off-piste', null],
      ['triple-run', null],
      ['double-black', { date: null }],
    ])
  })
})

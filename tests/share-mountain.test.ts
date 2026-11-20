// TRI-106: the Mountain share text and the run-times code in its link.
import { describe, expect, it } from 'vitest'
import { buildMountainShareText, decodeRunTimes, encodeRunTimes, mountainShareUrl } from '@/lib/share'

describe('run-times code', () => {
  it('round-trips the runs done that day', () => {
    const times = { easy: 192, hard: 521 }
    expect(encodeRunTimes(times)).toBe('e192-h521')
    expect(decodeRunTimes('e192-h521')).toEqual(times)
  })

  it('ignores anything malformed, too long or repeated', () => {
    expect(decodeRunTimes('e0-m99999999-x12-h30-h40-hello')).toEqual({ easy: 0, hard: 30 })
    expect(decodeRunTimes(undefined)).toEqual({})
  })
})

describe('buildMountainShareText', () => {
  it('lists the runs done with their shapes, the streak and a link carrying the times', () => {
    expect(buildMountainShareText({ puzzleNumber: 324, date: '2026-11-20', times: { easy: 192, medium: 400, hard: 521 }, streak: 7 })).toBe(
      ['Daily Tridoku #324', '● 03:12  ■ 06:40  ◆ 08:41', '7-day streak', 'https://www.tridokupuzzle.com/r/2026-11-20/e192-m400-h521'].join('\n'),
    )
  })

  it('leaves out runs not done and a one-day streak', () => {
    expect(buildMountainShareText({ puzzleNumber: 324, date: '2026-11-20', times: { medium: 400 }, streak: 1 })).toBe(
      ['Daily Tridoku #324', '■ 06:40', mountainShareUrl('2026-11-20', { medium: 400 })].join('\n'),
    )
  })
})

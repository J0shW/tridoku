// TRI-102: every board palette keeps its rule shades apart and stays readable.
// A new palette, theme or theme day (TRI-100) must pass these before it ships.

import { describe, expect, it } from 'vitest'
import { ALL_PALETTES, SELECTION_STROKE, getPalette } from '@/lib/palettes'
import { colourDistance, contrast, luminance } from '@/lib/contrast'

describe.each(Object.entries(ALL_PALETTES))('the %s palette', (_name, p) => {
  const shades = { none: p.none, outer: p.outer, inner: p.inner, both: p.both }
  const list = Object.values(shades)

  it('makes cells on both rules the deepest shade', () => {
    for (const s of [p.none, p.outer, p.inner]) expect(luminance(p.both)).toBeLessThan(luminance(s))
  })

  it('keeps every pair of shades apart, by lightness or by hue', () => {
    for (let i = 0; i < list.length; i++)
      for (let j = i + 1; j < list.length; j++) {
        const apart = contrast(list[i], list[j]) >= 1.1 || colourDistance(list[i], list[j]) >= 0.04
        expect(apart, `${list[i]} vs ${list[j]}`).toBe(true)
      }
  })

  it.each([
    ['givens', 'given'],
    ['region lines', 'line'],
    ['player entries', 'entry'],
    ['pencil marks', 'note'],
  ] as const)('%s reach 4.5:1 on every shade', (_label, key) => {
    for (const s of list) expect(contrast(p[key], s), `${p[key]} on ${s}`).toBeGreaterThanOrEqual(4.5)
  })

  it("shows the selected cell's dashes at 3:1 or better on every shade (TRI-103)", () => {
    for (const s of list) expect(contrast(SELECTION_STROKE, s)).toBeGreaterThanOrEqual(3)
  })

  it('makes entries look different from givens (TRI-061)', () => {
    expect(p.entry).not.toBe(p.given)
  })
})

describe('getPalette', () => {
  it('uses the same Classic palette on every run and in both modes', () => {
    const c = getPalette('classic', 'easy', false)
    expect(getPalette('classic', 'hard', true)).toBe(c)
  })

  it("gives each Mountain run its own palette by day, and one floodlit palette at night", () => {
    const day = (['easy', 'medium', 'hard'] as const).map((d) => getPalette('mountain', d, false).outer)
    expect(new Set(day).size).toBe(3)
    expect(getPalette('mountain', 'easy', true)).toBe(getPalette('mountain', 'hard', true))
  })
})

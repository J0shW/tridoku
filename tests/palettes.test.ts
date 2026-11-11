// TRI-099: every board palette keeps the rule shades in order and stays readable.
// A new palette or theme day must pass these before it ships (design system §2.3a).

import { describe, expect, it } from 'vitest'
import { OFF_KEY, PALETTES } from '@/lib/palettes'
import { contrast, luminance } from '@/lib/contrast'

describe.each(Object.entries(PALETTES))('the %s palette', (_name, p) => {
  const shades = [p.none, p.outer, p.inner, p.both]

  it('runs light to deep: none, outer, inner, both', () => {
    const lum = shades.map(luminance)
    for (let i = 1; i < lum.length; i++) expect(lum[i]).toBeLessThan(lum[i - 1])
  })

  it('keeps each step visible (at least 1.1:1 between neighbouring shades)', () => {
    for (let i = 1; i < shades.length; i++) expect(contrast(shades[i - 1], shades[i])).toBeGreaterThanOrEqual(1.1)
  })

  it.each([
    ['givens and region lines', 'line'],
    ['player entries', 'entry'],
    ['pencil marks', 'note'],
  ] as const)('%s reach 4.5:1 on every shade', (_label, key) => {
    for (const shade of shades) expect(contrast(p[key], shade)).toBeGreaterThanOrEqual(4.5)
  })

  it.each(['light', 'dark'] as const)('its tone reads as "on" in %s mode', (theme) => {
    expect(contrast(p.tone[theme], OFF_KEY[theme])).toBeGreaterThanOrEqual(3)
    expect(contrast(p.onTone[theme], p.tone[theme])).toBeGreaterThanOrEqual(4.5)
  })
})

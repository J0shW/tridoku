// Board palettes (design system §2.3, TRI-099). Each difficulty's board is a family of its
// folder colour, and the rules read as shades in a fixed order, light to deep:
//   none (neither rule) < outer (outer side) < inner (inner triangle) < both
// A theme day (TRI-100) is just another palette. tests/palettes.test.ts checks every palette.

import type { Difficulty } from './tridoku.ts'

export interface Palette {
  /** Neither rule: the lightest shade */
  none: string
  /** On an outer side */
  outer: string
  /** On the inner triangle */
  inner: string
  /** On both: the deepest shade */
  both: string
  /** Region lines and givens */
  line: string
  /** Player entries */
  entry: string
  /** Pencil marks */
  note: string
  /** The "on" colour for toggles (Pencil, note keys, Check), and its text, per theme.
      Deep in light mode; the bright folder colour in dark mode, where deep shades sink. */
  tone: { light: string; dark: string }
  onTone: { light: string; dark: string }
}

const INK = '#2b2420'
const PAPER = '#fffaf6'
const NAVY = '#1e3a5f'
const NOTE = '#4a3a30'

export const PALETTES: Record<Difficulty, Palette> = {
  easy: {
    none: '#f6fafb', outer: '#e2eff1', inner: '#c9e2e6', both: '#9cc6cd',
    line: INK, entry: NAVY, note: NOTE,
    tone: { light: '#2f6f7a', dark: '#bfdde2' }, onTone: { light: PAPER, dark: INK },
  },
  medium: {
    none: '#fdf8ee', outer: '#f8e8c8', inner: '#f2d49c', both: '#e2b25e',
    line: INK, entry: NAVY, note: NOTE,
    tone: { light: '#8a5a00', dark: '#ecbd6c' }, onTone: { light: PAPER, dark: INK },
  },
  hard: {
    none: '#fdf4f7', outer: '#f8dde7', inner: '#f1bfd2', both: '#e293b3',
    line: INK, entry: NAVY, note: NOTE,
    tone: { light: '#a8365f', dark: '#e26495' }, onTone: { light: PAPER, dark: INK },
  },
}

/** The off-state key colour a tone must stand out from (the `--control` token in each theme). */
export const OFF_KEY = { light: '#efe2d8', dark: '#362c24' }

/** CSS custom properties for a palette, read by the board, the rule diagrams and the toggles. */
export function paletteVars(p: Palette): Record<string, string> {
  return {
    '--board-cell-none': p.none,
    '--board-cell-outer': p.outer,
    '--board-cell-inner': p.inner,
    '--board-cell-overlap': p.both,
    '--board-region-line': p.line,
    '--board-digit-given': p.line,
    '--board-digit-entry': p.entry,
    '--board-digit-note': p.note,
    '--tone-light': p.tone.light,
    '--tone-dark': p.tone.dark,
    '--on-tone-light': p.onTone.light,
    '--on-tone-dark': p.onTone.dark,
  }
}

/** Puts a palette on the page, so the board, toggles and dialogs (which render outside the
    game's own tree) all use it. */
export function applyPalette(p: Palette, root: HTMLElement = document.documentElement): void {
  for (const [name, value] of Object.entries(paletteVars(p))) root.style.setProperty(name, value)
}

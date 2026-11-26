// Board palettes (TRI-102). Two board themes:
//  - Classic: today's colours, the same on every difficulty (TRI-031).
//  - Mountain: dual tone per run. Outer sides take the run's tint, the inner triangle a warm
//    "sunlit" hue, and cells on both are the deepest. Dark mode ("night skiing") shares one
//    floodlit palette. See the Mountain canvas and docs/backlog/m5-design-system.md.
// Players will pick a theme in TRI-101; until then Mountain is preview-only (lib/board-theme.ts).
// tests/palettes.test.ts checks every palette.

import type { Difficulty } from './tridoku.ts'
import type { ThemeDay } from './theme-days.ts'

export type BoardTheme = 'classic' | 'mountain'
export const BOARD_THEMES: BoardTheme[] = ['classic', 'mountain']

export interface Palette {
  /** Neither rule: the lightest shade */
  none: string
  /** On an outer side */
  outer: string
  /** On the inner triangle */
  inner: string
  /** On both: the deepest shade */
  both: string
  /** Region lines */
  line: string
  /** Given digits */
  given: string
  /** Player entries */
  entry: string
  /** Pencil marks */
  note: string
}

/** Navy, so your digits look different from the givens (TRI-061) */
const NAVY = '#1e3a5f'
const SLATE = '#1c2733'

const CLASSIC: Palette = {
  none: '#e4e3d3', outer: '#bfdde2', inner: '#eed496', both: '#98ac8b',
  line: '#2b2420', given: '#000000', entry: NAVY, note: '#222222',
}

const mountain = (none: string, outer: string, inner: string, both: string): Palette => ({
  none, outer, inner, both, line: SLATE, given: SLATE, entry: NAVY, note: '#2a3542',
})

const MOUNTAIN: Record<Difficulty, Palette> = {
  easy: mountain('#fbfdfb', '#d2ecd9', '#f5e2b2', '#aec98f'),
  medium: mountain('#fbfcff', '#d3e2f6', '#f6dcc4', '#b4b9dd'),
  hard: mountain('#fcfcfd', '#dde1e7', '#f3d2d4', '#bfaab6'),
}
const MOUNTAIN_NIGHT = mountain('#e9eef4', '#c9dbea', '#ecd6bc', '#a9b2cf')

// Theme days (TRI-100), the same on every run. Christmas: the board is a tree, so the
// sides are pine, the inner triangle a warm ribbon red, and the cells on both the deepest
// pine. New Year: champagne inside, a midnight lilac on the sides.
const THEME_PALETTES: Record<NonNullable<ThemeDay['palette']>, { day: Palette; night: Palette }> = {
  christmas: {
    day: mountain('#fdfcf8', '#cfe6d3', '#f6d6cf', '#a9c79f'),
    night: mountain('#eef1ec', '#c3dbc8', '#ecc9c2', '#9fbb98'),
  },
  'new-year': {
    day: mountain('#fdfcf7', '#e3dcf3', '#f5e5b9', '#c0b3dc'),
    night: mountain('#eceaf2', '#cdc6e5', '#eadba9', '#aca1cf'),
  },
}

/** The palette for a theme, run and light or dark mode, dressed for a theme day on Mountain. */
export function getPalette(theme: BoardTheme, difficulty: Difficulty, dark: boolean, themeDay?: ThemeDay | null): Palette {
  if (theme === 'classic') return CLASSIC
  if (themeDay?.palette) return dark ? THEME_PALETTES[themeDay.palette].night : THEME_PALETTES[themeDay.palette].day
  return dark ? MOUNTAIN_NIGHT : MOUNTAIN[difficulty]
}

/** Every palette a player can see, named, for the tests. */
export const ALL_PALETTES: Record<string, Palette> = {
  classic: CLASSIC,
  'mountain-easy': MOUNTAIN.easy,
  'mountain-medium': MOUNTAIN.medium,
  'mountain-hard': MOUNTAIN.hard,
  'mountain-night': MOUNTAIN_NIGHT,
  'christmas-day': THEME_PALETTES.christmas.day,
  'christmas-night': THEME_PALETTES.christmas.night,
  'new-year-day': THEME_PALETTES['new-year'].day,
  'new-year-night': THEME_PALETTES['new-year'].night,
}

/** The selected cell's dashes (`--board-selection-stroke`), which must show on every shade (TRI-103). */
export const SELECTION_STROKE = '#4d4d4d'

/** CSS custom properties for a palette, read by the board and the rule diagrams. */
export function paletteVars(p: Palette): Record<string, string> {
  return {
    '--board-cell-none': p.none,
    '--board-cell-outer': p.outer,
    '--board-cell-inner': p.inner,
    '--board-cell-overlap': p.both,
    '--board-region-line': p.line,
    '--board-digit-given': p.given,
    '--board-digit-entry': p.entry,
    '--board-digit-note': p.note,
  }
}

/** Puts a palette on the page, so the board and dialogs (which render outside the game's
    own tree) all use it. */
export function applyPalette(p: Palette, root: HTMLElement = document.documentElement): void {
  for (const [name, value] of Object.entries(paletteVars(p))) root.style.setProperty(name, value)
}

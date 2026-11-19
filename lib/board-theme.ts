// Which board theme to show (TRI-102). Classic for everyone until the theme picker
// arrives in TRI-101. On previews and in development, `?theme=mountain` (or `?theme=classic`)
// switches it and is remembered on this device, so it can be tried on a phone.

import { IS_PRODUCTION } from './app-env.ts'
import { BOARD_THEMES, type BoardTheme } from './palettes.ts'

export const BOARD_THEME_KEY = 'tridoku-board-theme'

export function readBoardTheme(): BoardTheme {
  if (IS_PRODUCTION || typeof window === 'undefined') return 'classic'
  try {
    const asked = new URLSearchParams(window.location.search).get('theme')
    if (asked && (BOARD_THEMES as string[]).includes(asked)) localStorage.setItem(BOARD_THEME_KEY, asked)
    const stored = localStorage.getItem(BOARD_THEME_KEY)
    return stored && (BOARD_THEMES as string[]).includes(stored) ? (stored as BoardTheme) : 'classic'
  } catch {
    return 'classic'
  }
}

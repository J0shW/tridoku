// Which board theme to show (TRI-102, TRI-101): Classic (today's look) or Mountain.
// Players pick it in the game's More menu, and it's remembered on the device. Classic is the
// default. `?theme=mountain` (or `classic`) in a link also switches it.

import { BOARD_THEMES, type BoardTheme } from './palettes.ts'

export const BOARD_THEME_KEY = 'tridoku-board-theme'

/** Whether players can see and change the theme. On everywhere since the trailhead (TRI-101). */
export const THEME_PICKER_ENABLED = true

const isTheme = (v: string | null): v is BoardTheme => v !== null && (BOARD_THEMES as string[]).includes(v)

export function readBoardTheme(): BoardTheme {
  if (!THEME_PICKER_ENABLED || typeof window === 'undefined') return 'classic'
  try {
    const asked = new URLSearchParams(window.location.search).get('theme')
    if (isTheme(asked)) localStorage.setItem(BOARD_THEME_KEY, asked)
    const stored = localStorage.getItem(BOARD_THEME_KEY)
    return isTheme(stored) ? stored : 'classic'
  } catch {
    return 'classic'
  }
}

export function saveBoardTheme(theme: BoardTheme): void {
  try {
    localStorage.setItem(BOARD_THEME_KEY, theme)
  } catch {
    // Private mode: the choice lasts for this visit only
  }
}

/** Marks <html> with the theme and run, which the Mountain styles in globals.css key off. */
export function applyLook(theme: BoardTheme, run: string, root: HTMLElement = document.documentElement): void {
  if (theme === 'mountain') root.dataset.look = 'mountain'
  else delete root.dataset.look
  root.dataset.run = run
}

/**
 * Runs before the app paints (app/layout.tsx), so a Mountain player doesn't see a flash
 * of Classic.
 */
export const BOARD_THEME_SCRIPT = `(function(){try{
  var q = new URLSearchParams(location.search).get('theme');
  var t = (q === 'mountain' || q === 'classic') ? q : localStorage.getItem(${JSON.stringify(BOARD_THEME_KEY)});
  if (t === 'mountain') document.documentElement.dataset.look = 'mountain';
}catch(e){}})();`

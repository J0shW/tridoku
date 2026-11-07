// Lightweight wrapper around the Umami tracker.
// The Umami script is loaded in app/layout.tsx and exposes window.umami.
// Events only send on the production domain (configured via data-domains),
// so calling these in development is a no-op for your stats.
//
// Every event carries `days_since_first` (days since this browser first visited), and the
// browser is identified to Umami by a random anonymous ID, so retention can be measured
// (TRI-015). No personal data is collected. Event names and fields: docs/metrics.md.

import { daysBetween, todayKey, type DateKey } from "@/lib/dates"

type UmamiEventData = Record<string, string | number | boolean>

declare global {
  interface Window {
    umami?: {
      track: (eventName: string, eventData?: UmamiEventData) => void
      identify?: (id: string, data?: UmamiEventData) => void
    }
  }
}

const PLAYER_KEY = "tridoku-player"

export interface Player {
  /** Random, anonymous, per-browser. */
  id: string
  firstVisitDate: DateKey
}

let player: Player | null = null
let identified = false

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

/** The anonymous player record, created on first visit. */
export function getPlayer(): Player | null {
  if (typeof window === "undefined") return null
  if (player) return player
  try {
    const stored = JSON.parse(localStorage.getItem(PLAYER_KEY) || "null")
    if (stored?.id && stored?.firstVisitDate) {
      player = stored
    } else {
      player = { id: randomId(), firstVisitDate: todayKey() }
      localStorage.setItem(PLAYER_KEY, JSON.stringify(player))
    }
  } catch {
    // Storage blocked: still give events a consistent ID for this page load
    player = { id: randomId(), firstVisitDate: todayKey() }
  }
  return player
}

/** Fields added to every event. */
export function commonEventData(): UmamiEventData {
  const p = getPlayer()
  return p ? { days_since_first: daysBetween(p.firstVisitDate, todayKey()) } : {}
}

export function trackEvent(eventName: string, eventData?: UmamiEventData) {
  if (typeof window === "undefined") return
  try {
    const umami = window.umami
    if (!umami) return
    if (!identified && umami.identify) {
      const p = getPlayer()
      if (p) umami.identify(p.id, { first_visit: p.firstVisitDate })
      identified = true
    }
    umami.track(eventName, { ...commonEventData(), ...eventData })
  } catch {
    // Never let analytics break the game
  }
}

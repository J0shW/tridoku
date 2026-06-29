// Lightweight wrapper around the Umami tracker.
// The Umami script is loaded in app/layout.tsx and exposes window.umami.
// Events only send on the production domain (configured via data-domains),
// so calling these in development is a no-op for your stats.

type UmamiEventData = Record<string, string | number | boolean>

declare global {
  interface Window {
    umami?: {
      track: (eventName: string, eventData?: UmamiEventData) => void
    }
  }
}

export function trackEvent(eventName: string, eventData?: UmamiEventData) {
  if (typeof window === "undefined") return
  try {
    window.umami?.track(eventName, eventData)
  } catch {
    // Never let analytics break the game
  }
}

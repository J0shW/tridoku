// Helpers for the first-party Umami endpoint (app/p/api/send/route.ts, TRI-081).

/** Umami Cloud's collector: where its own tracker sends events by default. */
export const UMAMI_COLLECTOR = "https://gateway.umami.is/api/send"

/** The visitor's IP as seen by Vercel's edge, or null if unavailable. */
export function clientIp(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  return forwarded || headers.get("x-real-ip")?.trim() || null
}

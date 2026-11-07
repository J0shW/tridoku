// TRI-081: first-party endpoint for Umami events (the tracker posts here because
// app/layout.tsx sets data-host-url="/p").
//
// A plain rewrite would make Umami see Vercel's server address, so every visitor would
// appear to be in Oregon. Umami uses `payload.ip`, when present, for the visitor's
// location (src/lib/detect.ts in umami-software/umami), so this route adds the real
// client IP, which Vercel provides in x-forwarded-for / x-real-ip, before forwarding.

import { clientIp, UMAMI_COLLECTOR } from "@/lib/umami-proxy"

export async function POST(request: Request): Promise<Response> {
  let body: { type?: string; payload?: Record<string, unknown> }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const ip = clientIp(request.headers)
  const payload = { ...(body.payload ?? {}) }
  // Always set from the connection, never trust a value sent by the browser.
  delete payload.ip
  if (ip) payload.ip = ip

  const headers = new Headers({ "Content-Type": "application/json" })
  const userAgent = request.headers.get("user-agent")
  if (userAgent) headers.set("User-Agent", userAgent)
  for (const [name, value] of request.headers) {
    if (name.startsWith("x-umami-") && name !== "x-umami-client-ip") headers.set(name, value)
  }

  try {
    const upstream = await fetch(UMAMI_COLLECTOR, {
      method: "POST",
      headers,
      body: JSON.stringify({ ...body, payload }),
    })
    return new Response(upstream.body, {
      status: upstream.status,
      headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json" },
    })
  } catch {
    // Analytics must never break the game; the tracker ignores failures.
    return Response.json({ error: "Collector unreachable" }, { status: 502 })
  }
}

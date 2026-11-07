// TRI-081: the first-party Umami endpoint forwards events with the visitor's real IP.
import { afterEach, describe, expect, it, vi } from "vitest"
import { POST } from "@/app/p/api/send/route"
import { clientIp, UMAMI_COLLECTOR } from "@/lib/umami-proxy"

afterEach(() => vi.unstubAllGlobals())

function send(body: unknown, headers: Record<string, string> = {}) {
  return new Request("https://www.tridokupuzzle.com/p/api/send", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  })
}

describe("clientIp", () => {
  it("takes the first x-forwarded-for address, then x-real-ip", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "68.148.1.2, 76.76.21.21" }))).toBe("68.148.1.2")
    expect(clientIp(new Headers({ "x-real-ip": "68.148.1.2" }))).toBe("68.148.1.2")
    expect(clientIp(new Headers())).toBeNull()
  })
})

describe("POST /p/api/send", () => {
  it("adds the visitor's IP, overrides any sent by the browser, and forwards Umami headers", async () => {
    const fetchMock = vi.fn(async () => new Response('{"cache":"abc"}', { status: 200, headers: { "content-type": "application/json" } }))
    vi.stubGlobal("fetch", fetchMock)
    const res = await POST(
      send(
        { type: "event", payload: { website: "w", name: "puzzle_started", ip: "1.1.1.1" } },
        {
          "x-forwarded-for": "68.148.1.2, 76.76.21.21",
          "user-agent": "Mozilla/5.0 (iPhone)",
          "x-umami-website-id": "w",
          "x-umami-hostname": "www.tridokupuzzle.com",
          "x-umami-client-ip": "9.9.9.9",
        },
      ),
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ cache: "abc" })

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe(UMAMI_COLLECTOR)
    const forwarded = JSON.parse(init.body as string)
    expect(forwarded).toEqual({ type: "event", payload: { website: "w", name: "puzzle_started", ip: "68.148.1.2" } })
    const h = new Headers(init.headers)
    expect(h.get("user-agent")).toBe("Mozilla/5.0 (iPhone)")
    expect(h.get("x-umami-website-id")).toBe("w")
    expect(h.get("x-umami-hostname")).toBe("www.tridokupuzzle.com")
    expect(h.get("x-umami-client-ip")).toBeNull()
  })

  it("rejects bad JSON and survives an unreachable collector", async () => {
    expect((await POST(send("not json"))).status).toBe(400)
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("network") }))
    expect((await POST(send({ type: "event", payload: {} }))).status).toBe(502)
  })
})

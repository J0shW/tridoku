// TRI-015 and TRI-019: anonymous player ID, days since first visit, play counters.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

function fakeStorage() {
  const m = new Map<string, string>()
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  }
}

beforeEach(() => {
  vi.resetModules()
  vi.stubGlobal("localStorage", fakeStorage())
  vi.stubGlobal("window", globalThis)
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 10, 7, 12))
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe("trackEvent", () => {
  it("adds days_since_first and identifies the browser once", async () => {
    const track = vi.fn()
    const identify = vi.fn()
    vi.stubGlobal("umami", { track, identify })
    const { trackEvent, getPlayer } = await import("@/lib/analytics")
    trackEvent("puzzle_started", { difficulty: "easy" })
    trackEvent("easy_completed", { time: 100 })
    expect(identify).toHaveBeenCalledTimes(1)
    expect(identify.mock.calls[0][0]).toBe(getPlayer()!.id)
    expect(track).toHaveBeenCalledWith("puzzle_started", { days_since_first: 0, difficulty: "easy" })
  })

  it("keeps the same player and counts days since the first visit", async () => {
    localStorage.setItem("tridoku-player", JSON.stringify({ id: "abc", firstVisitDate: "2026-11-01" }))
    const track = vi.fn()
    vi.stubGlobal("umami", { track })
    const { trackEvent, getPlayer } = await import("@/lib/analytics")
    expect(getPlayer()!.id).toBe("abc")
    trackEvent("x")
    expect(track).toHaveBeenCalledWith("x", { days_since_first: 6 })
  })

  it("does nothing, without throwing, when Umami isn't loaded", async () => {
    const { trackEvent } = await import("@/lib/analytics")
    expect(() => trackEvent("x")).not.toThrow()
  })
})

describe("play counters", () => {
  it("counts per puzzle and forgets other days", async () => {
    const { bumpCounter, getCounters } = await import("@/lib/play-counters")
    bumpCounter("hard", "2026-11-06", "errors")
    bumpCounter("hard", "2026-11-07", "errors")
    bumpCounter("hard", "2026-11-07", "errors")
    bumpCounter("hard", "2026-11-07", "notes")
    expect(getCounters("hard", "2026-11-07")).toMatchObject({ errors: 2, notes: 1, resets: 0 })
    expect(getCounters("easy", "2026-11-07")).toMatchObject({ errors: 0, notes: 0, resets: 0 })
    expect(getCounters("hard", "2026-11-06")).toMatchObject({ errors: 0, notes: 0, resets: 0 })
  })

  it("counts wrong entries per region for the share grid (TRI-036)", async () => {
    const { bumpCounter, getCounters } = await import("@/lib/play-counters")
    bumpCounter("easy", "2026-11-07", "errors", 4)
    bumpCounter("easy", "2026-11-07", "errors", 4)
    bumpCounter("easy", "2026-11-07", "errors", 8)
    bumpCounter("easy", "2026-11-07", "notes")
    const c = getCounters("easy", "2026-11-07")
    expect(c.errors).toBe(3)
    expect(c.regionErrors).toEqual([0, 0, 0, 0, 2, 0, 0, 0, 1])
  })

  it("reads counters saved before per-region counts existed", async () => {
    localStorage.setItem("tridoku-play-counters", JSON.stringify({ "2026-11-07:medium": { errors: 2, notes: 0, resets: 1 } }))
    const { getCounters } = await import("@/lib/play-counters")
    expect(getCounters("medium", "2026-11-07")).toEqual({ errors: 2, notes: 0, resets: 1, regionErrors: Array(9).fill(0) })
  })
})

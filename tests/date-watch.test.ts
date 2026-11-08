// TRI-086: a tab left open past midnight notices the new day.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { watchDateChange } from "@/lib/date-watch"
import { normalizeStats } from "@/lib/stats"

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal("window", new EventTarget())
  vi.stubGlobal("document", new EventTarget())
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe("watchDateChange (TRI-086)", () => {
  it("fires once when the clock passes midnight", () => {
    vi.setSystemTime(new Date(2026, 10, 7, 23, 59, 30))
    const onChange = vi.fn()
    const stop = watchDateChange(onChange)
    vi.advanceTimersByTime(20_000) // 23:59:50
    expect(onChange).not.toHaveBeenCalled()
    vi.advanceTimersByTime(60_000) // 00:00:50
    expect(onChange).toHaveBeenCalledExactlyOnceWith("2026-11-08")
    vi.advanceTimersByTime(5 * 60_000)
    expect(onChange).toHaveBeenCalledOnce()
    stop()
  })

  it("checks straight away when the tab comes back", () => {
    vi.setSystemTime(new Date(2026, 10, 7, 22, 0))
    const onChange = vi.fn()
    const stop = watchDateChange(onChange, 60 * 60_000)
    vi.setSystemTime(new Date(2026, 10, 8, 7, 30)) // asleep overnight; timer hasn't fired
    document.dispatchEvent(new Event("visibilitychange"))
    expect(onChange).toHaveBeenCalledExactlyOnceWith("2026-11-08")
    stop()
  })

  it("stops listening after cleanup", () => {
    vi.setSystemTime(new Date(2026, 10, 7, 23, 59, 30))
    const onChange = vi.fn()
    watchDateChange(onChange)()
    vi.advanceTimersByTime(120_000)
    window.dispatchEvent(new Event("focus"))
    expect(onChange).not.toHaveBeenCalled()
  })

  it("clears yesterday's ✓ Completed when stats are re-normalised", () => {
    const loadedYesterday = normalizeStats({ easy: { gamesWon: 1, gamesPlayed: 1, currentStreak: 1, lastPlayedDate: "2026-11-07" } }, "2026-11-07")
    expect(loadedYesterday.easy.completedToday).toBe(true)
    const after = normalizeStats(loadedYesterday, "2026-11-08")
    expect(after.easy.completedToday).toBe(false)
    expect(after.easy.currentStreak).toBe(1) // still alive until a whole day is missed
  })
})

// TRI-041 and TRI-042: weekly Ko-fi line and one rating per puzzle.
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
})
afterEach(() => vi.unstubAllGlobals())

describe("Ko-fi line (TRI-041)", () => {
  it("shows for one puzzle a week, and again for that same result", async () => {
    const { claimKofiPrompt } = await import("@/lib/win-prompts")
    expect(claimKofiPrompt("easy", "2026-11-07", "2026-11-07")).toBe(true)
    expect(claimKofiPrompt("easy", "2026-11-07", "2026-11-07")).toBe(true) // reopened
    expect(claimKofiPrompt("medium", "2026-11-07", "2026-11-07")).toBe(false)
    expect(claimKofiPrompt("easy", "2026-11-13", "2026-11-13")).toBe(false) // 6 days later
    expect(claimKofiPrompt("easy", "2026-11-14", "2026-11-14")).toBe(true) // 7 days later
    expect(claimKofiPrompt("easy", "2026-11-07", "2026-11-14")).toBe(false) // old result
  })

  it("never shows when storage is blocked", async () => {
    vi.stubGlobal("localStorage", { getItem: () => { throw new Error("blocked") }, setItem: () => { throw new Error("blocked") } })
    const { claimKofiPrompt } = await import("@/lib/win-prompts")
    expect(claimKofiPrompt("easy", "2026-11-07", "2026-11-07")).toBe(false)
  })
})

describe("difficulty rating (TRI-042)", () => {
  it("is remembered per puzzle", async () => {
    const { getRating, saveRating } = await import("@/lib/win-prompts")
    expect(getRating("hard", "2026-11-07")).toBeNull()
    saveRating("hard", "2026-11-07", "too_hard")
    expect(getRating("hard", "2026-11-07")).toBe("too_hard")
    expect(getRating("easy", "2026-11-07")).toBeNull()
  })

  it("keeps only the last 30 ratings", async () => {
    const { getRating, saveRating } = await import("@/lib/win-prompts")
    for (let d = 1; d <= 31; d++) saveRating("easy", `2026-10-${String(d).padStart(2, "0")}`, "just_right")
    expect(getRating("easy", "2026-10-01")).toBeNull()
    expect(getRating("easy", "2026-10-31")).toBe("just_right")
  })
})

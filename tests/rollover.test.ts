// TRI-008 and TRI-014: puzzle numbers and the switch to a new year's puzzle file.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getPuzzleNumber } from "@/lib/tridoku"
import { clearCache, getDailyPuzzle } from "@/lib/puzzle-service"

describe("puzzle number (TRI-008)", () => {
  it("counts from 1 Jan 2026", () => {
    expect(getPuzzleNumber("2026-01-01")).toBe(1)
    expect(getPuzzleNumber("2026-11-06")).toBe(310)
    expect(getPuzzleNumber("2027-01-01")).toBe(366)
  })

  it("depends only on the puzzle's date, not the clock or time zone", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-11-07T03:00:00Z")) // evening of the 6th in Los Angeles, morning of the 7th in Tokyo
    expect(getPuzzleNumber("2026-11-06")).toBe(310)
    vi.useRealTimers()
  })
})

function puzzleSet(date: string) {
  const p = (difficulty: string) => ({ date, difficulty, seed: 1, puzzle: "0".repeat(81), metadata: { generatedAt: "", givens: 0 } })
  return { easy: p("easy"), medium: p("medium"), hard: p("hard") }
}

describe("year rollover (TRI-014)", () => {
  const files: Record<string, unknown> = {
    "/puzzles/2026.json": { "2026-12-31": puzzleSet("2026-12-31") },
    "/puzzles/2027.json": { "2027-01-01": puzzleSet("2027-01-01") },
  }
  const fetchMock = vi.fn(async (url: string) => {
    const body = files[url]
    return { ok: !!body, json: async () => body } as Response
  })

  beforeEach(() => {
    clearCache()
    fetchMock.mockClear()
    vi.stubGlobal("fetch", fetchMock)
  })
  afterEach(() => vi.unstubAllGlobals())

  it("loads the new year's file on 1 January", async () => {
    const dec31 = await getDailyPuzzle(new Date(2026, 11, 31, 23, 59), "easy")
    expect(dec31.date).toBe("2026-12-31")
    const jan1 = await getDailyPuzzle(new Date(2027, 0, 1, 0, 1), "easy")
    expect(jan1.date).toBe("2027-01-01")
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual(["/puzzles/2026.json", "/puzzles/2027.json"])
  })

  it("serves a player who kept the tab open across New Year", async () => {
    await getDailyPuzzle(new Date(2026, 11, 31, 22, 0), "hard")
    const afterMidnight = await getDailyPuzzle(new Date(2027, 0, 1, 0, 30), "hard")
    expect(afterMidnight.date).toBe("2027-01-01")
    expect(afterMidnight.puzzle).toHaveLength(81)
  })
})

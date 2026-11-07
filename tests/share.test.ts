// TRI-034, TRI-036, TRI-037: share text, best-time comparison, next difficulty, countdown.
import { describe, expect, it } from "vitest"
import { msUntilNextDay } from "@/lib/dates"
import { buildShareText, compareWithBest, formatCountdown, nextUnfinished, regionGrid, shareUrl } from "@/lib/share"
import { defaultStats } from "@/lib/stats"

const tiles = (grid: string) => grid.split("\n").map((row) => [...row.replace(/[　 ]/g, "")].length)

describe("share grid (TRI-036)", () => {
  it("is 9 tiles in rows of 1, 3 and 5, centred", () => {
    const grid = regionGrid(undefined)
    expect(tiles(grid)).toEqual([1, 3, 5])
    const [top, middle, bottom] = grid.split("\n")
    expect(top.startsWith("　 　 ")).toBe(true)
    expect(middle.startsWith("　 🟩")).toBe(true)
    expect(bottom.startsWith("🟩")).toBe(true)
  })

  it("marks regions with a wrong entry yellow, in board order", () => {
    const grid = regionGrid([0, 1, 0, 0, 0, 0, 3, 0, 1]).replace(/[　 ]/g, "")
    expect(grid).toBe("🟩\n🟨🟩🟩\n🟩🟩🟨🟩🟨")
  })

  it("contains no digits from the board", () => {
    const text = buildShareText({ puzzleNumber: 311, difficulty: "hard", time: 754, streak: 6, regionErrors: [2, 0, 0, 0, 0, 0, 0, 0, 0] })
    const grid = text.split("\n").slice(3, 6).join("")
    expect(grid).not.toMatch(/\d/)
  })

  it("has the number, difficulty, time, streak and an attributed link", () => {
    const text = buildShareText({ puzzleNumber: 311, difficulty: "medium", time: 252, streak: 6 })
    expect(text.split("\n")[0]).toBe("Daily Tridoku #311 · 🟡 Medium")
    expect(text).toContain("⏱️ 04:12")
    expect(text).toContain("🔥 6-day streak")
    expect(text.trim().endsWith("https://www.tridokupuzzle.com/?utm_source=share&utm_content=medium")).toBe(true)
  })
})

describe("share links (TRI-037)", () => {
  it("use the canonical URL with utm parameters", () => {
    expect(shareUrl("easy")).toBe("https://www.tridokupuzzle.com/?utm_source=share&utm_content=easy")
  })
})

describe("compared with your best (TRI-034)", () => {
  it("covers first solve, new best, tie and slower", () => {
    expect(compareWithBest(300, null)).toEqual({ kind: "first" })
    expect(compareWithBest(250, 300)).toEqual({ kind: "new_best", by: 50 })
    expect(compareWithBest(300, 300)).toEqual({ kind: "tie" })
    expect(compareWithBest(330, 300)).toEqual({ kind: "slower", best: 300, by: 30 })
  })
})

describe("next difficulty (TRI-034)", () => {
  const today = "2026-11-07"
  it("offers the next harder one, wrapping to easier ones", () => {
    const s = defaultStats()
    expect(nextUnfinished("easy", s, today)).toBe("medium")
    s.medium.lastPlayedDate = today
    expect(nextUnfinished("easy", s, today)).toBe("hard")
    expect(nextUnfinished("hard", s, today)).toBe("easy")
  })

  it("treats yesterday's solve as unfinished and returns null when all are done", () => {
    const s = defaultStats()
    s.medium.lastPlayedDate = "2026-11-06"
    expect(nextUnfinished("easy", s, today)).toBe("medium")
    s.easy.lastPlayedDate = s.medium.lastPlayedDate = s.hard.lastPlayedDate = today
    expect(nextUnfinished("medium", s, today)).toBeNull()
  })
})

describe("countdown (TRI-034)", () => {
  it("counts to local midnight", () => {
    expect(msUntilNextDay(new Date(2026, 10, 7, 23, 58, 30))).toBe(90_000)
    expect(formatCountdown(msUntilNextDay(new Date(2026, 10, 7, 18, 47, 51)))).toBe("05:12:09")
  })

  it("is right on a 23-hour day when clocks change", () => {
    // Midnight to midnight is 23 or 25 hours on DST days in zones that have them.
    const start = new Date(2026, 2, 8, 0, 0, 0)
    const end = new Date(2026, 2, 9, 0, 0, 0)
    expect(msUntilNextDay(start)).toBe(end.getTime() - start.getTime())
  })

  it("formats hours, minutes and seconds", () => {
    expect(formatCountdown(0)).toBe("00:00:00")
    expect(formatCountdown(3_599_999)).toBe("00:59:59")
  })
})

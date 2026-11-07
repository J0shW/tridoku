import { describe, expect, it } from "vitest"
import { addDays } from "@/lib/dates"
import { defaultDifficultyStats, normalizeStats, recordStart, recordWin, winRate, type DifficultyStats } from "@/lib/stats"

function solveDays(start: string, days: number, base: DifficultyStats = defaultDifficultyStats()) {
  let s = base
  for (let i = 0; i < days; i++) {
    const date = addDays(start, i)
    s = recordStart(s, date) ?? s
    s = recordWin(s, { puzzleDate: date, today: date, time: 300, solvedBoard: "x" })!
  }
  return s
}

describe("streaks (TRI-005)", () => {
  it("continues across single-digit dates, which used to reset it", () => {
    expect(solveDays("2026-11-01", 9).currentStreak).toBe(9)
  })

  it("continues across month and year ends", () => {
    expect(solveDays("2026-10-30", 4).currentStreak).toBe(4)
    expect(solveDays("2026-12-30", 4).currentStreak).toBe(4)
  })

  it("resets to 1 after a missed day and keeps the max", () => {
    let s = solveDays("2026-11-01", 3)
    s = recordWin(s, { puzzleDate: "2026-11-05", today: "2026-11-05", time: 300, solvedBoard: "x" })!
    expect(s.currentStreak).toBe(1)
    expect(s.maxStreak).toBe(3)
  })

  it("does not count the same puzzle twice", () => {
    const s = solveDays("2026-11-01", 1)
    expect(recordWin(s, { puzzleDate: "2026-11-01", today: "2026-11-01", time: 100, solvedBoard: "x" })).toBeNull()
  })

  it("shows 0 once a day has been missed", () => {
    const stored = { easy: solveDays("2026-11-01", 5), medium: {}, hard: {} }
    expect(normalizeStats(stored, "2026-11-06").easy.currentStreak).toBe(5) // solved yesterday
    expect(normalizeStats(stored, "2026-11-07").easy.currentStreak).toBe(0) // missed the 6th
  })

  it("continues a streak saved by the old code", () => {
    const old = { gamesPlayed: 5, gamesWon: 5, currentStreak: 5, maxStreak: 5, bestTime: 300, lastPlayedDate: "2026-11-05", completedToday: true }
    const s = normalizeStats({ easy: old, medium: old, hard: old }, "2026-11-06").easy
    expect(recordWin(s, { puzzleDate: "2026-11-06", today: "2026-11-06", time: 200, solvedBoard: "x" })!.currentStreak).toBe(6)
  })
})

describe("finishing after midnight (TRI-006)", () => {
  it("credits the puzzle's own date and leaves today's puzzle playable", () => {
    const s = recordWin(defaultDifficultyStats(), { puzzleDate: "2026-11-06", today: "2026-11-07", time: 300, solvedBoard: "x" })!
    expect(s.lastPlayedDate).toBe("2026-11-06")
    expect(s.completedToday).toBe(false)
    const tomorrow = normalizeStats({ easy: s }, "2026-11-07").easy
    expect(tomorrow.completedToday).toBe(false)
    expect(recordWin(tomorrow, { puzzleDate: "2026-11-07", today: "2026-11-07", time: 300, solvedBoard: "y" })!.currentStreak).toBe(2)
  })
})

describe("win rate (TRI-007)", () => {
  it("counts a puzzle as played on first entry, once", () => {
    let s = recordStart(defaultDifficultyStats(), "2026-11-06")!
    expect(s.gamesPlayed).toBe(1)
    expect(recordStart(s, "2026-11-06")).toBeNull()
    s = recordStart(s, "2026-11-07")! // started but not finished
    s = recordWin(recordStart(s, "2026-11-08")!, { puzzleDate: "2026-11-08", today: "2026-11-08", time: 1, solvedBoard: "x" })!
    expect(s.gamesPlayed).toBe(3)
    expect(s.gamesWon).toBe(1)
    expect(winRate(s)).toBe(33)
  })

  it("counts a win with no recorded start as played too", () => {
    const s = recordWin(defaultDifficultyStats(), { puzzleDate: "2026-11-06", today: "2026-11-06", time: 1, solvedBoard: "x" })!
    expect(s.gamesPlayed).toBe(1)
  })

  it("migrates old stats without changing counts", () => {
    const old = { gamesPlayed: 12, gamesWon: 12, currentStreak: 1, maxStreak: 3, bestTime: 0, lastPlayedDate: "2026-11-06" }
    const s = normalizeStats(old, "2026-11-06")
    expect(s.medium.gamesPlayed).toBe(12)
    expect(s.medium.bestTime).toBe(0)
    expect(s.easy.gamesPlayed).toBe(0)
  })
})

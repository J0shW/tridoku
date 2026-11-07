// TRI-009, TRI-010, TRI-011: what players get when today's puzzle isn't available.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { BACKUP_PUZZLES, clearCache, getDailyPuzzle, PuzzleLoadError } from "@/lib/puzzle-service"
import { conflicts, countSolutions, parse } from "../scripts/eval/lib.ts"

describe("built-in backup puzzles (TRI-009)", () => {
  it.each(Object.entries(BACKUP_PUZZLES))("%s has 81 digits, no conflicts and exactly one solution", (_, puzzle) => {
    expect(puzzle).toMatch(/^[0-9]{81}$/)
    expect(conflicts(parse(puzzle))).toEqual([])
    expect(countSolutions(parse(puzzle))).toBe(1)
  })
})

const set = (date: string, tag: string) => {
  const p = (difficulty: string) => ({ date, difficulty, seed: 1, puzzle: tag.padEnd(81, "0"), metadata: { generatedAt: "", givens: 1 } })
  return { easy: p("easy"), medium: p("medium"), hard: p("hard") }
}

describe("getDailyPuzzle fallbacks", () => {
  let files: Record<string, unknown>
  let networkDown = false
  const fetchMock = vi.fn(async (url: string) => {
    if (networkDown) throw new TypeError("Failed to fetch")
    const body = files[url]
    return { ok: !!body, status: body ? 200 : 404, json: async () => body } as Response
  })

  beforeEach(() => {
    clearCache()
    networkDown = false
    vi.stubGlobal("fetch", fetchMock)
  })
  afterEach(() => vi.unstubAllGlobals())

  it("serves today's puzzle when it exists", async () => {
    files = { "/puzzles/2026.json": { "2026-11-07": set("2026-11-07", "7") } }
    const p = await getDailyPuzzle(new Date(2026, 10, 7), "easy")
    expect(p.puzzle.startsWith("7")).toBe(true)
    expect(p.fallback).toBeUndefined()
  })

  it("serves the most recent puzzle, credited to today, when today's is missing (TRI-010)", async () => {
    files = { "/puzzles/2026.json": { "2026-11-04": set("2026-11-04", "4"), "2026-11-05": set("2026-11-05", "5"), "2026-11-20": set("2026-11-20", "9") } }
    const p = await getDailyPuzzle(new Date(2026, 10, 7), "hard")
    expect(p.puzzle.startsWith("5")).toBe(true)
    expect(p.date).toBe("2026-11-07")
    expect(p.fallback).toEqual({ sourceDate: "2026-11-05" })
  })

  it("looks back into last year when the new year's file doesn't exist yet", async () => {
    files = { "/puzzles/2026.json": { "2026-12-31": set("2026-12-31", "3") } }
    const p = await getDailyPuzzle(new Date(2027, 0, 1), "medium")
    expect(p.puzzle.startsWith("3")).toBe(true)
    expect(p.fallback).toEqual({ sourceDate: "2026-12-31" })
  })

  it("uses the built-in backup only when no published puzzle exists (TRI-009)", async () => {
    files = {}
    const p = await getDailyPuzzle(new Date(2026, 10, 7), "medium")
    expect(p.puzzle).toBe(BACKUP_PUZZLES.medium)
    expect(p.fallback).toEqual({ sourceDate: null })
  })

  it("throws a retryable error when the server can't be reached (TRI-011)", async () => {
    files = { "/puzzles/2026.json": { "2026-11-07": set("2026-11-07", "7") } }
    networkDown = true
    await expect(getDailyPuzzle(new Date(2026, 10, 7), "easy")).rejects.toBeInstanceOf(PuzzleLoadError)
    networkDown = false
    const p = await getDailyPuzzle(new Date(2026, 10, 7), "easy") // Retry works: failures aren't cached
    expect(p.puzzle.startsWith("7")).toBe(true)
  })

  it("throws a retryable error on a server error", async () => {
    fetchMock.mockImplementationOnce(async () => ({ ok: false, status: 500, json: async () => ({}) }) as Response)
    await expect(getDailyPuzzle(new Date(2026, 10, 7), "easy")).rejects.toBeInstanceOf(PuzzleLoadError)
  })
})

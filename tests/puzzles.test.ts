// TRI-013: every published puzzle must be well-formed, have no conflicting givens
// and have exactly one solution. Uses the independent solver in scripts/eval.
import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { conflicts, countSolutions, parse } from "../scripts/eval/lib.ts"

const dir = path.join(__dirname, "../public/puzzles")
const files = fs.readdirSync(dir).filter((f) => /^\d{4}\.json$/.test(f))

describe.each(files)("public/puzzles/%s", (file) => {
  const data = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8")) as Record<string, Record<string, { puzzle: string }>>
  const entries = Object.entries(data).flatMap(([date, set]) =>
    (["easy", "medium", "hard"] as const).map((d) => ({ date, difficulty: d, puzzle: set[d]?.puzzle })),
  )

  it("has all three difficulties for every date", () => {
    expect(entries.filter((e) => !e.puzzle).map((e) => `${e.date} ${e.difficulty}`)).toEqual([])
  })

  it("has 81-digit puzzles with no conflicting givens", () => {
    const bad = entries.filter((e) => e.puzzle && (!/^[0-9]{81}$/.test(e.puzzle) || conflicts(parse(e.puzzle)).length))
    expect(bad.map((e) => `${e.date} ${e.difficulty}`)).toEqual([])
  })

  it("has exactly one solution for every puzzle", () => {
    const bad = entries.filter((e) => e.puzzle && countSolutions(parse(e.puzzle)) !== 1)
    expect(bad.map((e) => `${e.date} ${e.difficulty}`)).toEqual([])
  }, 60_000)
})

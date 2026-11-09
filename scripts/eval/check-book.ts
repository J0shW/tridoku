// Checks the puzzles transcribed from a Tridoku book for research R-13.
// Usage: node --experimental-strip-types scripts/eval/check-book.ts [--json]
// Exits with code 1 if any file is malformed, has clashing givens or isn't unique.

import fs from "node:fs"
import path from "node:path"
import { parse, conflicts, countSolutions, tier } from "./lib.ts"

const dir = path.join(import.meta.dirname, "../../docs/research/r13-book/puzzles")
type Row = { file: string; page: number; level: number; givens: number; solutions: number; tier: number; problems: string[] }
const rows: Row[] = []

for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".txt")).sort()) {
  const lines = fs.readFileSync(path.join(dir, file), "utf8").split("\n").map((l) => l.trim()).filter(Boolean)
  const meta = Object.fromEntries(lines.filter((l) => l.startsWith("#")).map((l) => l.slice(1).split(":").map((s) => s.trim())))
  const board = lines.filter((l) => !l.startsWith("#"))
  const problems: string[] = []
  if (board.length !== 9) problems.push(`${board.length} rows, expected 9`)
  board.forEach((r, i) => {
    if (r.length !== 2 * i + 1) problems.push(`row ${i + 1} has ${r.length} cells, expected ${2 * i + 1}`)
    if (!/^[0-9]*$/.test(r)) problems.push(`row ${i + 1} has a character other than 0-9`)
  })
  const level = Number(meta.level)
  if (!Number.isInteger(level) || level < 1) problems.push("missing or invalid '# level:'")
  const puzzle = board.join("")
  let solutions = 0
  let t = 0
  const g = problems.length ? [] : parse(puzzle)
  if (!problems.length) {
    if (conflicts(g).length) problems.push("givens break a rule")
    else {
      solutions = countSolutions(g, 2)
      if (solutions !== 1) problems.push(solutions === 0 ? "no solution" : "more than one solution")
      else t = tier(puzzle)
    }
  }
  rows.push({ file, page: Number(meta.page), level, givens: g.filter(Boolean).length, solutions, tier: t, problems })
}

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(rows, null, 2))
} else {
  console.log("| File | Page | Level | Givens | Our tier | Problems |")
  console.log("|---|---|---|---|---|---|")
  for (const r of rows) console.log(`| ${r.file} | ${r.page} | ${r.level} | ${r.givens} | ${r.tier || "—"} | ${r.problems.join("; ") || "none"} |`)
}
if (rows.some((r) => r.problems.length)) process.exit(1)

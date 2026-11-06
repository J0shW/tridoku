// Grades every published puzzle.
// Usage: node --experimental-strip-types scripts/eval/grade-puzzles.ts [--json]
// Exits with code 1 if any puzzle is malformed, has conflicting givens, or isn't unique.

import fs from "node:fs"
import path from "node:path"
import { parse, conflicts, countSolutions, tier } from "./lib.ts"

const dir = path.join(import.meta.dirname, "../../public/puzzles")
const DIFFS = ["easy", "medium", "hard"] as const
type Row = { date: string; difficulty: string; givens: number; solutions: number; tier: number; problems: string[] }
const rows: Row[] = []

for (const file of fs.readdirSync(dir).filter((f) => /^\d{4}\.json$/.test(f)).sort()) {
  const data = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"))
  for (const date of Object.keys(data).sort()) for (const difficulty of DIFFS) {
    const p = data[date][difficulty]
    const problems: string[] = []
    if (!p) { rows.push({ date, difficulty, givens: 0, solutions: 0, tier: 0, problems: ["missing"] }); continue }
    if (!/^[0-9]{81}$/.test(p.puzzle)) problems.push(`malformed (${p.puzzle.length} chars)`)
    const g = parse(p.puzzle)
    if (conflicts(g).length) problems.push("conflicting givens")
    const solutions = problems.length ? 0 : countSolutions(g)
    if (!problems.length && solutions !== 1) problems.push(solutions === 0 ? "no solution" : "multiple solutions")
    rows.push({ date, difficulty, givens: g.filter(Boolean).length, solutions, tier: problems.length ? 0 : tier(p.puzzle), problems })
  }
}

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(rows, null, 2))
} else {
  const dates = [...new Set(rows.map((r) => r.date))]
  console.log(`Puzzles: ${rows.length} (${dates[0]} – ${dates.at(-1)})\n`)
  console.log("Tier 1 = singles only · 2 = + power-cell eliminations · 3 = + naked pairs/triples · 4 = needs more\n")
  console.log("| Label | Unique | Tier 1 | Tier 2 | Tier 3 | Tier 4+ | Givens |")
  console.log("|---|---|---|---|---|---|---|")
  for (const d of DIFFS) {
    const rs = rows.filter((r) => r.difficulty === d)
    const t = (n: number) => rs.filter((r) => r.tier === n).length
    const gv = rs.map((r) => r.givens).filter(Boolean)
    console.log(`| ${d} | ${rs.filter((r) => r.solutions === 1).length}/${rs.length} | ${t(1)} | ${t(2)} | ${t(3)} | ${t(4)} | ${Math.min(...gv)}–${Math.max(...gv)} |`)
  }
  console.log("\nLast 14 days (tier for easy/medium/hard):")
  console.log(dates.slice(-14).map((d) => `${d.slice(5)}: ${DIFFS.map((x) => rows.find((r) => r.date === d && r.difficulty === x)?.tier ?? "-").join("")}`).join("  "))
  const bad = rows.filter((r) => r.problems.length)
  console.log(bad.length ? `\nProblems:\n${bad.map((r) => `  ${r.date} ${r.difficulty}: ${r.problems.join(", ")}`).join("\n")}` : "\nNo problems found.")
}
process.exit(rows.some((r) => r.problems.length) ? 1 : 0)

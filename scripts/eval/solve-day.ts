// Prints the puzzles and solutions for one date as JSON (used by play-through.cjs).
// Usage: node --experimental-strip-types scripts/eval/solve-day.ts 2026-11-06

import fs from "node:fs"
import path from "node:path"
import { parse, solve } from "./lib.ts"

const date = process.argv[2]
if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? "")) { console.error("Usage: solve-day.ts YYYY-MM-DD"); process.exit(1) }
const file = path.join(import.meta.dirname, `../../public/puzzles/${date.slice(0, 4)}.json`)
const day = JSON.parse(fs.readFileSync(file, "utf8"))[date]
if (!day) { console.error(`No puzzles for ${date}`); process.exit(1) }
const out: Record<string, { puzzle: string; solution: string | null }> = {}
for (const d of ["easy", "medium", "hard"]) out[d] = { puzzle: day[d].puzzle, solution: solve(parse(day[d].puzzle)) }
console.log(JSON.stringify(out))

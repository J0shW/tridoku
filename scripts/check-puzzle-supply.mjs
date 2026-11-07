// Fails (exit 1) if the puzzle pipeline is falling behind. Run by the daily Action
// after it commits, so a failure emails the repo owner (TRI-012).
//
//   node scripts/check-puzzle-supply.mjs                 # repo files: today + next 3 days (UTC)
//   node scripts/check-puzzle-supply.mjs --live=https://www.tridokupuzzle.com --days=1
//
// --live checks the deployed site instead of the repo, covering a failed deploy.
// Players' local dates run from UTC-12 to UTC+14, so "today" here means every
// UTC date from yesterday through `days` days ahead.

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")))
const days = Number(args.days ?? 3)
const live = args.live

const keyFor = (offset) => {
  const d = new Date(Date.now() + offset * 864e5)
  return d.toISOString().slice(0, 10)
}
const needed = Array.from({ length: days + 2 }, (_, i) => keyFor(i - 1))

const files = new Map()
async function load(year) {
  if (files.has(year)) return files.get(year)
  let data = {}
  if (live) {
    const res = await fetch(`${live}/puzzles/${year}.json`, { headers: { "cache-control": "no-cache" } })
    if (res.ok) data = await res.json()
    else if (res.status !== 404) throw new Error(`${live}/puzzles/${year}.json returned ${res.status}`)
  } else {
    const file = path.join(path.dirname(fileURLToPath(import.meta.url)), `../public/puzzles/${year}.json`)
    if (fs.existsSync(file)) data = JSON.parse(fs.readFileSync(file, "utf8"))
  }
  files.set(year, data)
  return data
}

const missing = []
try {
  for (const key of needed) {
    const data = await load(key.slice(0, 4))
    for (const d of ["easy", "medium", "hard"]) if (!data[key]?.[d]?.puzzle) missing.push(`${key} ${d}`)
  }
} catch (error) {
  console.error(`Couldn't read puzzles from ${live ?? "public/puzzles"}: ${error.cause?.message ?? error.message}`)
  process.exit(1)
}

const where = live ?? "public/puzzles"
if (missing.length) {
  console.error(`Puzzles missing from ${where}:\n  ${missing.join("\n  ")}`)
  console.error("Players will get a fallback puzzle on these dates. Run the Generate Daily Puzzle workflow or generate them by hand (scripts/README.md).")
  process.exit(1)
}
console.log(`OK: ${where} has puzzles for ${needed[0]} through ${needed.at(-1)}.`)

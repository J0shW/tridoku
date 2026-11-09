// Research R-13: compares the book's levels with our recent puzzles using singles-only measures.
// Usage: pnpm compare-book
// Walks each puzzle placing one single at a time (hidden singles first) and records how many
// placements were available at each step. Fewer moves per step = harder to spot.
import fs from "node:fs"
import path from "node:path"
import { parse, PEERS, UNITS, tier } from "./lib.ts"
const REGIONS = UNITS.slice(0, 9)

// Solve with a chosen set of moves; returns steps and per-step option counts, or null if stuck.
function walk(puzzle: string, opts: { naked: boolean; hiddenUnits: number[][] }) {
  const g = parse(puzzle)
  const cand = (i: number) => { const u = new Set<number>(); for (const p of PEERS[i]) if (g[p]) u.add(g[p]); return [1,2,3,4,5,6,7,8,9].filter((v) => !u.has(v)) }
  const counts: number[] = []; 
  while (g.some((v) => !v)) {
    const naked = new Map<number, number>(), hidden = new Map<number, number>()
    if (opts.naked) for (let i = 0; i < 81; i++) if (!g[i]) { const c = cand(i); if (c.length === 1) naked.set(i, c[0]) }
    for (const u of opts.hiddenUnits) for (let v = 1; v <= 9; v++) {
      if (u.some((i) => g[i] === v)) continue
      const spots = u.filter((i) => !g[i] && cand(i).includes(v))
      if (spots.length === 1) hidden.set(spots[0], v)
    }
    const all = new Map([...naked, ...hidden])
    if (!all.size) return null
    counts.push(all.size)
    // Prefer a hidden single in a region (what most players look for first)
    const [i, v] = (hidden.size ? hidden : naked).entries().next().value!
    g[i] = v
  }
  return { avg: counts.reduce((a, b) => a + b, 0) / counts.length, tight: counts.filter((c) => c <= 2).length, min: Math.min(...counts) }
}
const dir = path.join(import.meta.dirname, "../../docs/research/r13-book/puzzles")
const byLevel = new Map<string, string[]>()
for (const f of fs.readdirSync(dir)) {
  const t = fs.readFileSync(path.join(dir, f), "utf8")
  const lvl = t.match(/# level: (\d)/)![1]
  const p = t.split("\n").filter((l) => l && !l.startsWith("#")).join("")
  byLevel.set(lvl, [...(byLevel.get(lvl) ?? []), p])
}
const ours = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, "../../public/puzzles/2026.json"), "utf8"))
const recent = Object.keys(ours).sort().slice(-30)
const sets: [string, string[]][] = [...[...byLevel].sort().map(([l, ps]) => [`Book level ${l}`, ps] as [string, string[]]), ["Our Easy (30 days)", recent.map((k) => ours[k].easy.puzzle)], ["Our Medium (30 days)", recent.map((k) => ours[k].medium.puzzle)], ["Our Hard (30 days)", recent.map((k) => ours[k].hard.puzzle)]]
console.log("| Set | n | Moves/step | Steps with 1–2 moves | Solvable: hidden singles in regions only | …regions + edges, no naked singles | Naked singles only |")
console.log("|---|---|---|---|---|---|---|")
for (const [name, ps] of sets) {
  type Walk = NonNullable<ReturnType<typeof walk>>
  const full = ps.map((p) => walk(p, { naked: true, hiddenUnits: UNITS })).filter((w): w is Walk => w !== null)
  const pct = (o: Parameters<typeof walk>[1]) => `${ps.filter((p) => walk(p, o)).length}/${ps.length}`
  const m = (k: "avg" | "tight") => (full.reduce((a, x) => a + x[k], 0) / full.length).toFixed(1)
  console.log(`| ${name} | ${ps.length} | ${m("avg")} | ${m("tight")} | ${pct({ naked: false, hiddenUnits: REGIONS })} | ${pct({ naked: false, hiddenUnits: UNITS })} | ${pct({ naked: true, hiddenUnits: [] })} |`)
}
for (const [name, ps] of sets) console.log(name, "tier 1:", ps.filter((p) => tier(p) === 1).length, "of", ps.length)

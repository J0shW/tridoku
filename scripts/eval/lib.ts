// Shared solver and difficulty grader for the evaluation scripts.
// Uses the game's own board geometry from lib/tridoku.ts, but an independent
// solver, so it can check the generator's work.

import { createEmptyBoard } from "../../lib/tridoku.ts"

const CELLS = createEmptyBoard().flat().filter((c) => !c.hidden)
const INDEX = new Map(CELLS.map((c, i) => [c.id, i]))
const EDGE_KEYS = [
  "isOuterLeftEdge", "isOuterRightEdge", "isOuterBottomEdge",
  "isInnerLeftEdge", "isInnerRightEdge", "isInnerTopEdge",
] as const

/** The 15 groups that must each hold 1–9: 9 regions and 6 edges. */
export const UNITS: number[][] = [
  ...Array.from({ length: 9 }, (_, r) => CELLS.flatMap((c, i) => (c.boldedRegion === r ? [i] : []))),
  ...EDGE_KEYS.map((k) => CELLS.flatMap((c, i) => (c[k] ? [i] : []))),
]

/** For each cell, every cell that may not share its digit. */
export const PEERS: Set<number>[] = CELLS.map(() => new Set<number>())
CELLS.forEach((c, i) => c.neighbors.forEach((n) => PEERS[i].add(INDEX.get(n)!)))
UNITS.forEach((u) => u.forEach((a) => u.forEach((b) => { if (a !== b) PEERS[a].add(b) })))

export const parse = (puzzle: string): number[] => [...puzzle.slice(0, 81)].map(Number)

function candidates(g: number[], i: number): number[] {
  const used = new Set<number>()
  for (const p of PEERS[i]) if (g[p]) used.add(g[p])
  return [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((v) => !used.has(v))
}

/** Givens that break a rule (pairs of cell indexes). */
export function conflicts(g: number[]): [number, number][] {
  const out: [number, number][] = []
  g.forEach((v, i) => { if (v) for (const p of PEERS[i]) if (p > i && g[p] === v) out.push([i, p]) })
  return out
}

/** Number of solutions, stopping at `limit`. No iteration cap. */
export function countSolutions(grid: number[], limit = 2): number {
  const g = [...grid]
  const rec = (): number => {
    let best = -1, bc: number[] = []
    for (let i = 0; i < 81; i++) {
      if (g[i]) continue
      const c = candidates(g, i)
      if (!c.length) return 0
      if (best < 0 || c.length < bc.length) { best = i; bc = c; if (c.length === 1) break }
    }
    if (best < 0) return 1
    let n = 0
    for (const v of bc) { g[best] = v; n += rec(); g[best] = 0; if (n >= limit) break }
    return n
  }
  return rec()
}

/** One solution as a digit string, or null. */
export function solve(grid: number[]): string | null {
  const g = [...grid]
  const rec = (): boolean => {
    let best = -1, bc: number[] = []
    for (let i = 0; i < 81; i++) {
      if (g[i]) continue
      const c = candidates(g, i)
      if (!c.length) return false
      if (best < 0 || c.length < bc.length) { best = i; bc = c }
    }
    if (best < 0) return true
    for (const v of bc) { g[best] = v; if (rec()) return true }
    g[best] = 0
    return false
  }
  return rec() ? g.join("") : null
}

/**
 * Logic-only solve with techniques enabled up to `level`:
 * 1 = naked and hidden singles; 2 = + "power cell" eliminations (a cell outside a unit
 * that sees every place a digit can go in that unit loses that digit); 3 = + naked pairs/triples.
 */
function logicSolve(puzzle: string, level: number): boolean {
  const g = parse(puzzle)
  const C = g.map((v) => (v ? new Set<number>() : new Set([1, 2, 3, 4, 5, 6, 7, 8, 9])))
  const place = (i: number, v: number) => { g[i] = v; C[i].clear(); for (const q of PEERS[i]) C[q].delete(v) }
  g.forEach((v, i) => { if (v) for (const q of PEERS[i]) C[q].delete(v) })
  const combos = (arr: number[], k: number): number[][] =>
    k === 0 ? [[]] : arr.flatMap((a, j) => combos(arr.slice(j + 1), k - 1).map((c) => [a, ...c]))
  let progress = true
  while (progress) {
    progress = false
    for (let i = 0; i < 81; i++) if (!g[i] && C[i].size === 1) { place(i, [...C[i]][0]); progress = true }
    if (progress) continue
    for (const u of UNITS) for (let v = 1; v <= 9; v++) {
      if (u.some((i) => g[i] === v)) continue
      const spots = u.filter((i) => C[i].has(v))
      if (spots.length === 0) return false
      if (spots.length === 1) { place(spots[0], v); progress = true }
    }
    if (progress || level < 2) continue
    for (const u of UNITS) for (let v = 1; v <= 9; v++) {
      if (u.some((i) => g[i] === v)) continue
      const spots = u.filter((i) => C[i].has(v))
      for (let x = 0; x < 81; x++) {
        if (g[x] || !C[x].has(v) || spots.includes(x)) continue
        if (spots.every((i) => PEERS[x].has(i))) { C[x].delete(v); progress = true }
      }
    }
    if (progress || level < 3) continue
    for (const u of UNITS) {
      const open = u.filter((i) => !g[i])
      for (const n of [2, 3]) for (const set of combos(open, n)) {
        const digits = new Set(set.flatMap((i) => [...C[i]]))
        if (digits.size !== n) continue
        for (const o of open) if (!set.includes(o)) for (const v of digits) if (C[o].delete(v)) progress = true
      }
    }
  }
  return g.every((v) => v)
}

/** Lowest technique tier that solves the puzzle: 1, 2, 3, or 4 (needs more, possibly guessing). */
export function tier(puzzle: string): 1 | 2 | 3 | 4 {
  for (const level of [1, 2, 3] as const) if (logicSolve(puzzle, level)) return level
  return 4
}

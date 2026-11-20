// Drawing a board with its given digits for link-preview images (TRI-038, TRI-106).
// Givens are already public, so a preview never spoils the puzzle.

import { loadPuzzle, TRIDOKU_BOARD } from "@/lib/tridoku"

export const OG_H = Math.sqrt(3) // row height in board units (a cell is 2 units wide)

export interface OgBoardColors {
  outer: string
  inner: string
  overlap: string
  none: string
  line: string
  bold: string
  digit: string
}

/** A day's puzzle string for one difficulty from the published year file, or null. */
export async function puzzleFor(date: string, origin: string, difficulty: "easy" | "medium" | "hard" = "easy"): Promise<string | null> {
  try {
    const res = await fetch(`${origin}/puzzles/${date.slice(0, 4)}.json`, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    const all = await res.json()
    return typeof all?.[date]?.[difficulty]?.puzzle === "string" ? all[date][difficulty].puzzle : null
  } catch {
    return null
  }
}

function trianglePoints(row: number, col: number, up: boolean, scale: number): string {
  const pts = up
    ? [[col, (row + 1) * OG_H], [col + 1, row * OG_H], [col + 2, (row + 1) * OG_H]]
    : [[col, row * OG_H], [col + 2, row * OG_H], [col + 1, (row + 1) * OG_H]]
  return pts.map(([x, y]) => `${x * scale},${y * scale}`).join(" ")
}

// The 6 upward 3×3 macro-triangles; their outlines are every bold region edge.
function regionOutlines(scale: number): string[] {
  const out: string[] = []
  for (let m = 0; m < 3; m++) {
    for (let p = 0; p <= m; p++) {
      const x = 9 - 3 * m + 6 * p
      const y = 3 * m * OG_H
      out.push([[x, y], [x - 3, y + 3 * OG_H], [x + 3, y + 3 * OG_H]].map(([a, b]) => `${a * scale},${b * scale}`).join(" "))
    }
  }
  return out
}

/** The board at `scale` px per board unit (18 units wide), with only its given digits. */
export function OgBoard({ puzzle, scale, colors, fontSize, boldWidth = 3.5, digitBox = scale }: { puzzle: string; scale: number; colors: OgBoardColors; fontSize: number; boldWidth?: number; digitBox?: number }) {
  const board = loadPuzzle(puzzle)
  const cells = TRIDOKU_BOARD.flat().filter((c) => !c.hidden)
  const width = 18 * scale
  const height = 9 * OG_H * scale
  return (
    <div style={{ display: "flex", position: "relative", width, height }}>
      <svg width={width} height={height} viewBox={`-2 -2 ${width + 4} ${height + 4}`} style={{ position: "absolute", left: 0, top: 0 }}>
        {cells.map((c) => (
          <polygon key={c.id} points={trianglePoints(c.row, c.col, c.direction === "up", scale)} fill={colors[c.color]} stroke={colors.line} strokeWidth={1} />
        ))}
        {regionOutlines(scale).map((pts) => (
          <polygon key={pts} points={pts} fill="none" stroke={colors.bold} strokeWidth={boldWidth} strokeLinejoin="round" />
        ))}
      </svg>
      {cells.map((c) => {
        const v = board[c.row][c.col].value
        if (!v) return null
        const cx = (c.col + 1) * scale
        const cy = (c.row * OG_H + (c.direction === "up" ? (2 * OG_H) / 3 : OG_H / 3)) * scale
        const box = digitBox
        return (
          <div
            key={c.id}
            style={{ position: "absolute", left: cx - box / 2, top: cy - box / 2, width: box, height: box, display: "flex", alignItems: "center", justifyContent: "center", fontSize, color: colors.digit }}
          >
            {String(v)}
          </div>
        )
      })}
    </div>
  )
}

type OgFont = { name: string; data: ArrayBuffer; weight: 700 | 800; style: "normal" }
let signageFonts: Promise<OgFont[]> | null = null

/**
 * Barlow Condensed 700 and 800 (the Mountain signage face) for preview images, fetched once
 * per server from Google Fonts as TTF. Resolves to [] if that fails, so images still render
 * in the default font.
 */
export function loadSignageFonts(): Promise<OgFont[]> {
  signageFonts ??= (async () => {
    try {
      const css = await fetch("https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800", {
        // An older browser string gets TTF files, which the image renderer can read
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/534.30" },
        next: { revalidate: 60 * 60 * 24 * 30 },
      }).then((r) => r.text())
      const faces = [...css.matchAll(/font-weight: (700|800);\s*src: url\((https:[^)]+\.ttf)\)/g)]
      if (faces.length < 2) return []
      return await Promise.all(
        faces.map(async ([, w, src]) => ({
          name: "Barlow Condensed",
          data: await fetch(src).then((r) => r.arrayBuffer()),
          weight: Number(w) as 700 | 800,
          style: "normal" as const,
        })),
      )
    } catch {
      signageFonts = null
      return []
    }
  })()
  return signageFonts
}

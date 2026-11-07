// Daily social preview image, 1200×630 (TRI-038). app/layout.tsx points Open Graph and
// Twitter metadata here with ?date=YYYY-MM-DD, so link previews change each day.
// Shows that day's Easy board with only its given digits (already public, so no
// spoiler), the tagline and the puzzle number.

import { ImageResponse } from "next/og"
import { dateKeyInZone, fromDateKey, normalizeDateKey } from "@/lib/dates"
import { PRODUCTION_ORIGIN } from "@/lib/app-env"
import { BACKUP_PUZZLES } from "@/lib/puzzle-service"
import { getPuzzleNumber, loadPuzzle, TRIDOKU_BOARD } from "@/lib/tridoku"
import { OG_IMAGE_SIZE, OG_TIME_ZONE } from "@/lib/og"

const COLORS = {
  background: "#f7f2ec",
  foreground: "#2b2420",
  muted: "#6f645b",
  primary: "#0f7f7c",
  outer: "#bfdde2",
  inner: "#eed496",
  overlap: "#98ac8b",
  none: "#e4e3d3",
  line: "#8d8478",
  bold: "#2b2420",
}

const H = Math.sqrt(3) // row height in board units (a cell is 2 units wide)
const SCALE = 31 // px per board unit: 18 × 31 = 558 wide, 9√3 × 31 ≈ 483 tall

async function easyPuzzleFor(date: string, origin: string): Promise<string | null> {
  try {
    const res = await fetch(`${origin}/puzzles/${date.slice(0, 4)}.json`, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    const all = await res.json()
    return typeof all?.[date]?.easy?.puzzle === "string" ? all[date].easy.puzzle : null
  } catch {
    return null
  }
}

function trianglePoints(row: number, col: number, up: boolean): string {
  const pts = up
    ? [[col, (row + 1) * H], [col + 1, row * H], [col + 2, (row + 1) * H]]
    : [[col, row * H], [col + 2, row * H], [col + 1, (row + 1) * H]]
  return pts.map(([x, y]) => `${x * SCALE},${y * SCALE}`).join(" ")
}

// The 6 upward 3×3 macro-triangles; their outlines are every bold region edge.
function regionOutlines(): string[] {
  const out: string[] = []
  for (let m = 0; m < 3; m++) {
    for (let p = 0; p <= m; p++) {
      const x = 9 - 3 * m + 6 * p
      const y = 3 * m * H
      out.push([[x, y], [x - 3, y + 3 * H], [x + 3, y + 3 * H]].map(([a, b]) => `${a * SCALE},${b * SCALE}`).join(" "))
    }
  }
  return out
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const requested = normalizeDateKey(url.searchParams.get("date"))
  const date = requested ?? dateKeyInZone(new Date(), OG_TIME_ZONE)
  // Previews may not have this date's puzzles yet; production does.
  const found = (await easyPuzzleFor(date, url.origin)) ?? (await easyPuzzleFor(date, PRODUCTION_ORIGIN))
  const puzzle = found ?? BACKUP_PUZZLES.easy
  const board = loadPuzzle(puzzle)
  const cells = TRIDOKU_BOARD.flat().filter((c) => !c.hidden)

  const width = 18 * SCALE
  const height = 9 * H * SCALE
  const dateLabel = fromDateKey(date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })

  const image = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 64px 0 72px",
          background: COLORS.background,
          color: COLORS.foreground,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: 500 }}>
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              padding: "8px 20px",
              borderRadius: 999,
              background: COLORS.primary,
              color: "white",
              fontSize: 28,
            }}
          >
            {`Puzzle #${getPuzzleNumber(date)} · ${dateLabel}`}
          </div>
          <div style={{ display: "flex", marginTop: 28, fontSize: 84, letterSpacing: -2, lineHeight: 1 }}>Daily Tridoku</div>
          <div style={{ display: "flex", marginTop: 24, fontSize: 44, color: COLORS.primary }}>Sudoku on a triangle.</div>
          <div style={{ display: "flex", marginTop: 12, fontSize: 32, color: COLORS.muted, lineHeight: 1.3 }}>
            81 cells, 4 rules, a new puzzle every day.
          </div>
          <div style={{ display: "flex", marginTop: 48, fontSize: 28, color: COLORS.muted }}>tridokupuzzle.com</div>
        </div>

        <div style={{ display: "flex", position: "relative", width, height }}>
          <svg width={width} height={height} viewBox={`-2 -2 ${width + 4} ${height + 4}`} style={{ position: "absolute", left: 0, top: 0 }}>
            {cells.map((c) => (
              <polygon
                key={c.id}
                points={trianglePoints(c.row, c.col, c.direction === "up")}
                fill={COLORS[c.color]}
                stroke={COLORS.line}
                strokeWidth={1}
              />
            ))}
            {regionOutlines().map((pts) => (
              <polygon key={pts} points={pts} fill="none" stroke={COLORS.bold} strokeWidth={3.5} strokeLinejoin="round" />
            ))}
          </svg>
          {cells.map((c) => {
            const v = board[c.row][c.col].value
            if (!v) return null
            const cx = (c.col + 1) * SCALE
            const cy = (c.row * H + (c.direction === "up" ? (2 * H) / 3 : H / 3)) * SCALE
            const box = 30
            return (
              <div
                key={c.id}
                style={{
                  position: "absolute",
                  left: cx - box / 2,
                  top: cy - box / 2,
                  width: box,
                  height: box,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  color: COLORS.foreground,
                }}
              >
                {String(v)}
              </div>
            )
          })}
        </div>
      </div>
    ),
    OG_IMAGE_SIZE,
  )

  // A dated image of a real puzzle never changes, so caches can keep it. Anything
  // else ("today", or the backup board) is cached briefly.
  image.headers.set(
    "Cache-Control",
    requested && found ? "public, max-age=86400, s-maxage=31536000, immutable" : "public, max-age=600, s-maxage=3600",
  )
  return image
}

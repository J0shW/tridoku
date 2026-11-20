// Daily social preview image, 1200×630 (TRI-038). app/layout.tsx points Open Graph and
// Twitter metadata here with ?date=YYYY-MM-DD, so link previews change each day.
// Shows that day's Easy board with only its given digits (already public, so no
// spoiler), the tagline and the puzzle number.

import { ImageResponse } from "next/og"
import { dateKeyInZone, fromDateKey, normalizeDateKey } from "@/lib/dates"
import { PRODUCTION_ORIGIN } from "@/lib/app-env"
import { BACKUP_PUZZLES } from "@/lib/puzzle-service"
import { getPuzzleNumber } from "@/lib/tridoku"
import { OgBoard, puzzleFor } from "@/lib/og-board"
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

const SCALE = 31 // px per board unit: 18 × 31 = 558 wide, 9√3 × 31 ≈ 483 tall

export async function GET(request: Request) {
  const url = new URL(request.url)
  const requested = normalizeDateKey(url.searchParams.get("date"))
  const date = requested ?? dateKeyInZone(new Date(), OG_TIME_ZONE)
  // Previews may not have this date's puzzles yet; production does.
  const found = (await puzzleFor(date, url.origin)) ?? (await puzzleFor(date, PRODUCTION_ORIGIN))
  const puzzle = found ?? BACKUP_PUZZLES.easy
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

        <OgBoard
          puzzle={puzzle}
          scale={SCALE}
          fontSize={22}
          digitBox={30}
          colors={{ outer: COLORS.outer, inner: COLORS.inner, overlap: COLORS.overlap, none: COLORS.none, line: COLORS.line, bold: COLORS.bold, digit: COLORS.foreground }}
        />
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

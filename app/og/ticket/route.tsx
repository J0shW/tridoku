// Link preview for a shared Mountain result, 1200×630 (TRI-106): a lift ticket with the
// day's run times from the link (?date=YYYY-MM-DD&t=e192-m400-h521) and that day's board
// with only its given digits, so the preview never spoils the puzzle.

import { ImageResponse } from "next/og"
import { fromDateKey, normalizeDateKey, dateKeyInZone } from "@/lib/dates"
import { PRODUCTION_ORIGIN } from "@/lib/app-env"
import { BACKUP_PUZZLES } from "@/lib/puzzle-service"
import { getPuzzleNumber, formatTime, type Difficulty } from "@/lib/tridoku"
import { decodeRunTimes, DIFFICULTY_LABEL } from "@/lib/share"
import { getPalette } from "@/lib/palettes"
import { OG_IMAGE_SIZE, OG_TIME_ZONE } from "@/lib/og"
import { loadSignageFonts, OgBoard, puzzleFor } from "@/lib/og-board"

const RUNS: Difficulty[] = ["easy", "medium", "hard"]
const RUN_COLOR: Record<Difficulty, string> = { easy: "#1d7a43", medium: "#1d5bb8", hard: "#15171c" }
const GRADE: Record<Difficulty, string> = { easy: "Green", medium: "Blue", hard: "Black diamond" }
const SLATE = "#1c2733"
const MUTED = "#4b5a6b"

function Shape({ run, size }: { run: Difficulty; size: number }) {
  const fill = RUN_COLOR[run]
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      {run === "easy" && <circle cx="12" cy="12" r="8.5" fill={fill} />}
      {run === "medium" && <rect x="4.5" y="4.5" width="15" height="15" fill={fill} />}
      {run === "hard" && <polygon points="12,2.2 21.8,12 12,21.8 2.2,12" fill={fill} />}
    </svg>
  )
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const date = normalizeDateKey(url.searchParams.get("date")) ?? dateKeyInZone(new Date(), OG_TIME_ZONE)
  const times = decodeRunTimes(url.searchParams.get("t"))
  const done = RUNS.filter((d) => times[d] != null)
  // The board of the hardest run shown, in its Mountain colours
  const boardRun: Difficulty = done[done.length - 1] ?? "easy"
  const found = (await puzzleFor(date, url.origin, boardRun)) ?? (await puzzleFor(date, PRODUCTION_ORIGIN, boardRun))
  const puzzle = found ?? BACKUP_PUZZLES[boardRun]
  const pal = getPalette("mountain", boardRun, false)
  const fonts = await loadSignageFonts()
  const condensed = fonts.length > 0
  const dateLabel = fromDateKey(date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }).toUpperCase()

  const image = new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#e3edf7", color: SLATE, fontFamily: condensed ? "Barlow Condensed" : undefined }}>
        {/* Scenery */}
        <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: "absolute", left: 0, top: 0 }}>
          <polygon points="0,630 0,420 140,300 260,390 400,250 520,380 640,290 780,400 900,240 1040,360 1200,280 1200,630" fill="#cfdcea" />
          <polygon points="0,630 0,520 120,460 230,530 360,450 470,540 600,470 720,540 860,440 980,520 1100,470 1200,510 1200,630" fill="#b8cadd" />
        </svg>

        {/* The ticket */}
        <div style={{ position: "absolute", left: 80, top: 70, width: 1040, height: 490, display: "flex", borderRadius: 18, background: "#fbfdff", boxShadow: "0 20px 40px rgba(16,26,40,0.25)" }}>
          <div style={{ width: 110, display: "flex", alignItems: "center", justifyContent: "center", background: SLATE, color: "#fbfdff", borderRadius: "18px 0 0 18px" }}>
            <div style={{ display: "flex", transform: "rotate(-90deg)", fontSize: 30, fontWeight: 700, letterSpacing: 8, whiteSpace: "nowrap" }}>DAY TICKET</div>
          </div>
          <div style={{ width: 0, borderLeft: "4px dashed #c2d4e5" }} />
          <div style={{ flex: 1, display: "flex", padding: "38px 44px", gap: 36 }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: condensed ? 30 : 24, fontWeight: 700, color: MUTED, letterSpacing: 3 }}>{`${dateLabel} · NO. ${getPuzzleNumber(date)}`}</div>
              <div style={{ display: "flex", fontSize: condensed ? 84 : 56, fontWeight: 800, lineHeight: 1, marginTop: 8, letterSpacing: 1, whiteSpace: "nowrap" }}>DAILY TRIDOKU</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 34 }}>
                {(done.length ? done : RUNS).map((d) => (
                  <div key={d} style={{ display: "flex", alignItems: "center", gap: 18 }}>
                    <Shape run={d} size={40} />
                    <div style={{ display: "flex", width: condensed ? 330 : 360, fontSize: condensed ? 36 : 28, fontWeight: 700, whiteSpace: "nowrap" }}>{`${DIFFICULTY_LABEL[d].toUpperCase()} · ${GRADE[d].toUpperCase()}`}</div>
                    <div style={{ display: "flex", fontSize: condensed ? 50 : 38, fontWeight: 800 }}>{times[d] != null ? formatTime(times[d]!) : ""}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", marginTop: "auto", fontSize: condensed ? 24 : 20, fontWeight: 700, color: MUTED, letterSpacing: 1, whiteSpace: "nowrap" }}>SUDOKU ON A TRIANGLE · TRIDOKUPUZZLE.COM</div>
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <OgBoard
                puzzle={puzzle}
                scale={16}
                fontSize={12}
                boldWidth={2.5}
                colors={{ outer: pal.outer, inner: pal.inner, overlap: pal.both, none: pal.none, line: "rgba(28,39,51,0.3)", bold: SLATE, digit: SLATE }}
              />
            </div>
          </div>
        </div>
      </div>
    ),
    { ...OG_IMAGE_SIZE, fonts },
  )
  // A shared result never changes, so caches can keep it
  image.headers.set("Cache-Control", found ? "public, max-age=86400, s-maxage=31536000, immutable" : "public, max-age=600, s-maxage=3600")
  return image
}

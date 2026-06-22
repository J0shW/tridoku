"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, MousePointerClick, Hand, ArrowUpDown, Eye } from "lucide-react"
import { TRIDOKU_BOARD } from "@/lib/tridoku"
import { Button } from "@/components/ui/button"
import { InputModeToggle } from "@/components/input-mode-toggle"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface RulesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ─── SVG helpers ───────────────────────────────────────────────────────────────

const ROW_H = Math.sqrt(3)
const BOARD_SVG_H = 9 * ROW_H

/** Polygon points string for a board-coordinate triangle cell */
function triPts(row: number, col: number, dir: "up" | "down"): string {
  if (dir === "up") {
    return `${col},${(row + 1) * ROW_H} ${col + 1},${row * ROW_H} ${col + 2},${(row + 1) * ROW_H}`
  }
  return `${col},${row * ROW_H} ${col + 2},${row * ROW_H} ${col + 1},${(row + 1) * ROW_H}`
}

/** Visual centroid of a board-coordinate triangle cell */
function centroid(row: number, col: number, dir: "up" | "down") {
  return {
    x: col + 1,
    y: dir === "up" ? row * ROW_H + (ROW_H * 2) / 3 : row * ROW_H + ROW_H / 3,
  }
}

// ─── Example wrappers ──────────────────────────────────────────────────────────

function ExampleBox({ children, caption }: { children: React.ReactNode; caption: string }) {
  return (
    <div className="mt-3 rounded-md bg-muted/40 border border-border/60 p-2">
      {children}
      <p className="text-xs text-center text-muted-foreground mt-1 leading-tight">{caption}</p>
    </div>
  )
}

// ─── Rule 1: bolded region ─────────────────────────────────────────────────────

function RegionExample() {
  // region 0 is the top macro-triangle (rows 0–2, centered around col 9)
  const regionCells = TRIDOKU_BOARD.flat().filter((c) => !c.hidden && c.boldedRegion === 0)
  const h3 = 3 * ROW_H

  return (
    <ExampleBox caption="Each bold-outlined region contains digits 1–9 exactly once">
      <svg
        viewBox="5.4 -0.45 7.2 6.1"
        className="w-full max-w-40 mx-auto block"
        aria-hidden="true"
      >
        {regionCells.map((cell, i) => {
          const c = centroid(cell.row, cell.col, cell.direction)
          return (
            <g key={cell.id}>
              <polygon
                points={triPts(cell.row, cell.col, cell.direction)}
                fill="#e4e3d3"
                stroke="#aaa"
                strokeWidth="0.05"
              />
              <text
                x={c.x}
                y={c.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="0.72"
                fontWeight="700"
                fill="#2a2a2a"
              >
                {i + 1}
              </text>
            </g>
          )
        })}
        {/* Bold outer region border */}
        <polygon
          points={`9,0 6,${h3} 12,${h3}`}
          fill="none"
          stroke="#1a1a1a"
          strokeWidth="0.22"
          strokeLinejoin="round"
        />
      </svg>
    </ExampleBox>
  )
}

// ─── Rule 2: outer edges ───────────────────────────────────────────────────────

function OuterEdgesExample() {
  const allCells = TRIDOKU_BOARD.flat().filter((c) => !c.hidden)
  // One cell per row on the outer left edge, top-to-bottom
  const leftEdgeCells = TRIDOKU_BOARD.flat().filter((c) => !c.hidden && c.isOuterLeftEdge)

  function fill(color: string) {
    if (color === "outer" || color === "overlap") return "#bfdde2"
    return "#e4e3d3"
  }

  return (
    <ExampleBox caption="Each of the three outer sides must contain digits 1–9">
      <svg
        viewBox={`-0.15 -0.15 18.3 ${BOARD_SVG_H + 0.3}`}
        className="w-full max-w-45 mx-auto block"
        aria-hidden="true"
      >
        {allCells.map((cell) => (
          <polygon
            key={cell.id}
            points={triPts(cell.row, cell.col, cell.direction)}
            fill={fill(cell.color)}
            stroke="#aaa"
            strokeWidth="0.04"
          />
        ))}
        {leftEdgeCells.map((cell, i) => {
          const c = centroid(cell.row, cell.col, cell.direction)
          return (
            <text
              key={cell.id}
              x={c.x}
              y={c.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="0.68"
              fontWeight="700"
              fill="#1a4a5a"
            >
              {i + 1}
            </text>
          )
        })}
      </svg>
    </ExampleBox>
  )
}

// ─── Rule 3: inner triangle ────────────────────────────────────────────────────

function InnerTriangleExample() {
  const allCells = TRIDOKU_BOARD.flat().filter((c) => !c.hidden)
  // All 9 cells in row 4 form the inner top edge, left-to-right
  const innerTopCells = TRIDOKU_BOARD[4].filter((c) => !c.hidden && c.isInnerTopEdge)

  function fill(color: string) {
    if (color === "inner" || color === "overlap") return "#eed496"
    return "#e4e3d3"
  }

  return (
    <ExampleBox caption="Each edge of the inner (inverted) triangle must also contain digits 1–9">
      <svg
        viewBox={`-0.15 -0.15 18.3 ${BOARD_SVG_H + 0.3}`}
        className="w-full max-w-45 mx-auto block"
        aria-hidden="true"
      >
        {allCells.map((cell) => (
          <polygon
            key={cell.id}
            points={triPts(cell.row, cell.col, cell.direction)}
            fill={fill(cell.color)}
            stroke="#aaa"
            strokeWidth="0.04"
          />
        ))}
        {innerTopCells.map((cell, i) => {
          const c = centroid(cell.row, cell.col, cell.direction)
          return (
            <text
              key={cell.id}
              x={c.x}
              y={c.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="0.68"
              fontWeight="700"
              fill="#5a3a00"
            >
              {i + 1}
            </text>
          )
        })}
      </svg>
    </ExampleBox>
  )
}

// ─── Rule 4: no touching ───────────────────────────────────────────────────────

function NoTouchingExample() {
  const s = 9 // board units → SVG units scale
  const H = ROW_H * s // row height ≈ 15.59
  const gap = 8 // vertical gap between rows
  const fs = s * 0.56 // digit font size
  const markerFs = s * 0.68 // ✗/✓ font size
  const descFs = s * 0.37 // small row-label font size

  // Centroids for the three-triangle layout: up1 | dn | up2
  const cx1 = s,      cy1 = (H * 2) / 3
  const cxD = 2 * s,  cyD = H / 3
  const cx2 = 3 * s,  cy2 = (H * 2) / 3

  // Generate polygon points strings offset by dy
  function row(dy: number) {
    return {
      up1: `0,${H + dy} ${s},${dy} ${2 * s},${H + dy}`,
      dn:  `${s},${dy} ${3 * s},${dy} ${2 * s},${H + dy}`,
      up2: `${2 * s},${H + dy} ${3 * s},${dy} ${4 * s},${H + dy}`,
    }
  }

  const dy0 = 0               // row 1: shared edge (bad)
  const dy1 = H + gap         // row 2: shared corner (bad)
  const dy2 = 2 * (H + gap)   // row 3: different digits (good)
  const totalH = 3 * H + 2 * gap

  const markerX = 4 * s + 4
  const descX = markerX + 0.5

  const r0 = row(dy0)
  const r1 = row(dy1)
  const r2 = row(dy2)

  return (
    <ExampleBox caption="Identical digits cannot touch — not even at a single shared corner point">
      <svg
        viewBox={`-1 -1 ${4 * s + 26} ${totalH + 2}`}
        className="w-full max-w-55 mx-auto block"
        aria-hidden="true"
      >
        {/* ── Row 1: direct edge adjacency (BAD) ── */}
        <polygon points={r0.up1} fill="#fca5a5" stroke="#ccc" strokeWidth="0.3" />
        <text x={cx1} y={cy1 + dy0} textAnchor="middle" dominantBaseline="middle" fontSize={fs} fontWeight="700" fill="#991b1b">4</text>
        <polygon points={r0.dn} fill="#fca5a5" stroke="#ccc" strokeWidth="0.3" />
        <text x={cxD} y={cyD + dy0} textAnchor="middle" dominantBaseline="middle" fontSize={fs} fontWeight="700" fill="#991b1b">4</text>
        <polygon points={r0.up2} fill="#e4e3d3" stroke="#ccc" strokeWidth="0.3" />
        {/* highlight shared edge */}
        <line x1={s} y1={dy0} x2={2 * s} y2={H + dy0} stroke="#ef4444" strokeWidth="1.4" strokeLinecap="round" />
        <text x={markerX} y={H * 0.32 + dy0} textAnchor="start" dominantBaseline="middle" fontSize={markerFs} fontWeight="700" fill="#dc2626">✗</text>
        <text x={descX} y={H * 0.70 + dy0} textAnchor="start" dominantBaseline="middle" fontSize={descFs} fill="#991b1b">shared</text>
        <text x={descX} y={H * 0.88 + dy0} textAnchor="start" dominantBaseline="middle" fontSize={descFs} fill="#991b1b">edge</text>

        {/* ── Row 2: corner-only adjacency (BAD) ── */}
        <polygon points={r1.up1} fill="#fca5a5" stroke="#ccc" strokeWidth="0.3" />
        <text x={cx1} y={cy1 + dy1} textAnchor="middle" dominantBaseline="middle" fontSize={fs} fontWeight="700" fill="#991b1b">4</text>
        <polygon points={r1.dn} fill="#e4e3d3" stroke="#ccc" strokeWidth="0.3" />
        <polygon points={r1.up2} fill="#fca5a5" stroke="#ccc" strokeWidth="0.3" />
        <text x={cx2} y={cy2 + dy1} textAnchor="middle" dominantBaseline="middle" fontSize={fs} fontWeight="700" fill="#991b1b">4</text>
        {/* highlight shared corner */}
        <circle cx={2 * s} cy={H + dy1} r="1.4" fill="#ef4444" />
        <text x={markerX} y={H * 0.32 + dy1} textAnchor="start" dominantBaseline="middle" fontSize={markerFs} fontWeight="700" fill="#dc2626">✗</text>
        <text x={descX} y={H * 0.70 + dy1} textAnchor="start" dominantBaseline="middle" fontSize={descFs} fill="#991b1b">shared</text>
        <text x={descX} y={H * 0.88 + dy1} textAnchor="start" dominantBaseline="middle" fontSize={descFs} fill="#991b1b">corner</text>

        {/* ── Row 3: all different (GOOD) ── */}
        <polygon points={r2.up1} fill="#e4e3d3" stroke="#ccc" strokeWidth="0.3" />
        <text x={cx1} y={cy1 + dy2} textAnchor="middle" dominantBaseline="middle" fontSize={fs} fontWeight="700" fill="#1a1a1a">4</text>
        <polygon points={r2.dn} fill="#e4e3d3" stroke="#ccc" strokeWidth="0.3" />
        <text x={cxD} y={cyD + dy2} textAnchor="middle" dominantBaseline="middle" fontSize={fs} fontWeight="700" fill="#1a1a1a">7</text>
        <polygon points={r2.up2} fill="#e4e3d3" stroke="#ccc" strokeWidth="0.3" />
        <text x={cx2} y={cy2 + dy2} textAnchor="middle" dominantBaseline="middle" fontSize={fs} fontWeight="700" fill="#1a1a1a">2</text>
        <text x={markerX} y={H * 0.32 + dy2} textAnchor="start" dominantBaseline="middle" fontSize={markerFs} fontWeight="700" fill="#16a34a">✓</text>
        <text x={descX} y={H * 0.70 + dy2} textAnchor="start" dominantBaseline="middle" fontSize={descFs} fill="#166534">all</text>
        <text x={descX} y={H * 0.88 + dy2} textAnchor="start" dominantBaseline="middle" fontSize={descFs} fill="#166534">different</text>
      </svg>
    </ExampleBox>
  )
}

// ─── Tip: Power Cells ────────────────────────────────────────────────────────

function PowerCellExample() {
  // Show rows 0-4: region 0 (rows 0-2) + power-cell row + one row of context
  const visibleCells = TRIDOKU_BOARD.slice(0, 5).flat().filter((c) => !c.hidden)

  // Power cell: row=3, col=8, down-triangle — directly adjacent to ALL five row-2
  // cells of region 0, so placing 7 here eliminates all of them as candidates.
  const powerCellId = "3-8"
  // Only remaining empty cell in region 0 that can hold 7
  const targetCellId = "1-8"
  // Empty row-2 region-0 cells blocked by the power cell (the other three have givens)
  const blockedEmptyIds = new Set(["2-7", "2-9"])

  const given: Record<string, number> = {
    "0-8": 2,
    "1-7": 1,
    "1-9": 3,
    "2-6": 4,
    "2-8": 6,
    "2-10": 9,
    "3-8": 7,
  }

  return (
    <div className="mt-3 rounded-md bg-muted/40 border border-border/60 p-2">
      <svg
        viewBox={`3.7 -0.3 10.6 ${5 * ROW_H + 0.6}`}
        className="w-full max-w-48 mx-auto block"
        aria-hidden="true"
      >
        {visibleCells.map((cell) => {
          const c = centroid(cell.row, cell.col, cell.direction)
          const isRegion0 = cell.boldedRegion === 0
          const isPower = cell.id === powerCellId
          const isTarget = cell.id === targetCellId
          const isBlockedEmpty = blockedEmptyIds.has(cell.id)
          const val = given[cell.id]

          let fill = "#e4e3d3"
          if (isTarget) fill = "#bbf7d0"
          else if (isBlockedEmpty) fill = "#fee2e2"
          else if (isRegion0) fill = "#bfdde2"

          return (
            <g key={cell.id}>
              <polygon
                points={triPts(cell.row, cell.col, cell.direction)}
                fill={fill}
                stroke="#aaa"
                strokeWidth="0.05"
              />
              {isBlockedEmpty && (
                <text x={c.x} y={c.y} textAnchor="middle" dominantBaseline="middle" fontSize="0.6" fill="#dc2626">
                  ✕
                </text>
              )}
              {val !== undefined && (
                <text
                  x={c.x}
                  y={c.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={0.72}
                  fontWeight="700"
                  fill={isPower ? "#991b1b" : "#1a1a1a"}
                >
                  {val}
                </text>
              )}
              {isTarget && (
                <text x={c.x} y={c.y} textAnchor="middle" dominantBaseline="middle" fontSize="0.72" fontWeight="700" fill="#166534">
                  7
                </text>
              )}
              {isPower && (
                <circle cx={c.x} cy={c.y} r="0.52" fill="none" stroke="#dc2626" strokeWidth="0.12" />
              )}
            </g>
          )
        })}

        {/* Bold region 0 outline */}
        <polygon
          points={`9,0 6,${3 * ROW_H} 12,${3 * ROW_H}`}
          fill="none"
          stroke="#1a1a1a"
          strokeWidth="0.18"
          strokeLinejoin="round"
        />
      </svg>
      <p className="text-xs text-center text-muted-foreground mt-1 leading-tight">
        The circled 7 eliminates all bottom-row candidates in the region — only the green cell remains
      </p>
    </div>
  )
}

// ─── Step content ────────────────────────────────────────────────────────────

function IntroStep() {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mt-2 mb-1">
        <svg viewBox="0 0 100 90" className="w-32 h-32" aria-hidden="true">
          <polygon points="50,6 6,84 94,84" fill="var(--color-tridoku-easy-outer)" stroke="#1a1a1a" strokeWidth="2" strokeLinejoin="round" />
          <polygon points="50,84 28,45 72,45" fill="var(--color-tridoku-easy-inner)" stroke="#1a1a1a" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      </div>
      <p className="text-muted-foreground leading-relaxed text-pretty">
        If you&apos;ve ever played Sudoku, Tridoku will feel familiar — same idea of placing the digits 1 through 9 without repeats. But this time, it&apos;s built out of{" "}
        <strong className="text-foreground">triangles!</strong> Oooh, ahh!
      </p>
      <p className="text-sm text-muted-foreground leading-relaxed mt-3 text-pretty">
        Let&apos;s walk through how it works, one step at a time.
      </p>
    </div>
  )
}

function SelectCellStep() {
  const methods = [
    { icon: MousePointerClick, label: "Click", desc: "Click a cell with your mouse" },
    { icon: Hand, label: "Tap", desc: "Tap a cell on a touchscreen" },
    { icon: ArrowUpDown, label: "Arrow keys", desc: "Move the selection with your keyboard" },
  ]
  return (
    <div>
      <p className="text-muted-foreground leading-relaxed text-center text-pretty">
        First things first — you need to pick a cell to fill in. There are three ways to select one:
      </p>
      <ul className="mt-4 space-y-3">
        {methods.map(({ icon: Icon, label, desc }) => (
          <li key={label} className="flex items-center gap-3 rounded-md bg-muted/40 border border-border/60 p-3">
            <span className="shrink-0 w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Icon className="w-5 h-5" />
            </span>
            <div className="flex-1">
              <p className="font-semibold text-foreground text-sm">{label}</p>
              <p className="text-sm text-muted-foreground leading-snug">{desc}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted-foreground leading-relaxed mt-4 text-center text-pretty">
        Once a cell is selected, type a number or use the number pad to fill it in.
      </p>
    </div>
  )
}

function RuleStep({
  example,
  children,
}: {
  example: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="text-muted-foreground leading-relaxed text-center text-pretty">{children}</p>
      <div className="flex justify-center">{example}</div>
    </div>
  )
}

// ─── Tip: highlight matching cells ─────────────────────────────────────────────

function HighlightExample() {
  const visibleCells = TRIDOKU_BOARD.slice(0, 5).flat().filter((c) => !c.hidden)
  const highlightValue = 5

  const given: Record<string, number> = {
    "0-8": 5,
    "1-7": 2,
    "1-9": 5,
    "2-6": 1,
    "2-8": 3,
    "2-10": 5,
    "3-8": 8,
  }

  return (
    <ExampleBox caption="Double-tapping a 5 highlights every other 5 on the board">
      <svg
        viewBox={`3.7 -0.3 10.6 ${5 * ROW_H + 0.6}`}
        className="w-full max-w-48 mx-auto block"
        aria-hidden="true"
      >
        {visibleCells.map((cell) => {
          const c = centroid(cell.row, cell.col, cell.direction)
          const val = given[cell.id]
          const isHighlighted = val === highlightValue
          return (
            <g key={cell.id}>
              <polygon
                points={triPts(cell.row, cell.col, cell.direction)}
                fill={isHighlighted ? "var(--tridoku-highlighted-fill)" : "#e4e3d3"}
                stroke="#aaa"
                strokeWidth="0.05"
              />
              {val !== undefined && (
                <text
                  x={c.x}
                  y={c.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="0.72"
                  fontWeight="700"
                  fill={isHighlighted ? "#fff" : "#1a1a1a"}
                >
                  {val}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </ExampleBox>
  )
}

// ─── Tip steps ─────────────────────────────────────────────────────────────────

function PenPencilStep() {
  return (
    <div>
      <p className="text-muted-foreground leading-relaxed text-center text-pretty">
        Switch between two ways of entering digits:
      </p>
      <div className="mt-4 flex justify-center" aria-hidden="true">
        <div className="pointer-events-none">
          <InputModeToggle mode="pen" onModeChange={() => {}} />
        </div>
      </div>
      <ul className="mt-4 space-y-2 text-muted-foreground">
        <li className="flex items-start gap-2">
          <span className="text-accent">•</span>
          <span>
            <strong className="text-foreground">Pen:</strong> Place your final answer in a cell.
          </span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-accent">•</span>
          <span>
            <strong className="text-foreground">Pencil:</strong> Jot down small candidate notes when
            you&apos;re not sure yet.
          </span>
        </li>
      </ul>
      <p className="text-sm text-muted-foreground leading-relaxed mt-4 text-center text-pretty">
        Tap the Pen / Pencil toggle to change modes at any time.
      </p>
    </div>
  )
}

function HighlightStep() {
  return (
    <div>
      <p className="text-muted-foreground leading-relaxed text-center text-pretty">
        Double-tap (or double-click) a filled cell to highlight every other cell holding the same
        digit. It&apos;s a quick way to spot where a number already lives and where it still needs to go.
      </p>
      <div className="flex justify-center">
        <HighlightExample />
      </div>
    </div>
  )
}

function ShowErrorsStep() {
  return (
    <div>
      <p className="text-muted-foreground leading-relaxed text-center text-pretty">
        Stuck or want to double-check your work? Toggle the{" "}
        <strong className="text-foreground">Show Errors</strong> button to flag any digits that break a
        rule.
      </p>
      <div className="mt-4 flex flex-col items-center gap-2">
        <span className="w-12 h-12 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
          <Eye className="w-5 h-5" />
        </span>
        <span className="text-xs text-muted-foreground">Show Errors toggle</span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed mt-4 text-center text-pretty">
        Conflicting cells turn red so you can quickly track down mistakes.
      </p>
    </div>
  )
}

function PowerCellsStep() {
  return (
    <div>
      <p className="text-muted-foreground leading-relaxed text-center text-pretty">
        A single cell just outside a region can eliminate many candidates at once via the no-touching
        rule — often leaving only one valid cell in the region for that digit.
      </p>
      <div className="flex justify-center">
        <PowerCellExample />
      </div>
      <p className="text-sm text-muted-foreground text-center border-t border-border pt-4 mt-5">
        A new puzzle is available every day at midnight. Good luck!
      </p>
    </div>
  )
}

// ─── Modal ─────────────────────────────────────────────────────────────────────

interface Step {
  title: string
  subtitle: string
  content: React.ReactNode
}

const STEPS: Step[] = [
  {
    title: "Welcome to Tridoku",
    subtitle: "The triangular twist on Sudoku",
    content: <IntroStep />,
  },
  {
    title: "Selecting a Cell",
    subtitle: "Click, tap, or use the arrow keys",
    content: <SelectCellStep />,
  },
  {
    title: "Rule 1: Regions",
    subtitle: "The core constraint",
    content: (
      <RuleStep example={<RegionExample />}>
        Each bolded triangular region must contain the digits 1 through 9 exactly once.
      </RuleStep>
    ),
  },
  {
    title: "Rule 2: Outer Edges",
    subtitle: "The three big sides",
    content: (
      <RuleStep example={<OuterEdgesExample />}>
        The three sides of the large triangle must each contain digits 1 through 9.
      </RuleStep>
    ),
  },
  {
    title: "Rule 3: Inner Triangle",
    subtitle: "The inverted triangle in the middle",
    content: (
      <RuleStep example={<InnerTriangleExample />}>
        The inner triangle&apos;s edges must also contain digits 1 through 9.
      </RuleStep>
    ),
  },
  {
    title: "Rule 4: No Touching",
    subtitle: "Keep matching digits apart",
    content: (
      <RuleStep example={<NoTouchingExample />}>
        Identical numbers cannot touch each other, not even at a single corner point.
      </RuleStep>
    ),
  },
  {
    title: "Pen & Pencil",
    subtitle: "Final answers vs. candidate notes",
    content: <PenPencilStep />,
  },
  {
    title: "Highlight a Digit",
    subtitle: "Double-tap to see matching cells",
    content: <HighlightStep />,
  },
  {
    title: "Show Errors",
    subtitle: "Flag rule-breaking digits",
    content: <ShowErrorsStep />,
  },
  {
    title: "Power Cells",
    subtitle: "Eliminate candidates fast",
    content: <PowerCellsStep />,
  },
]

export function RulesModal({ open, onOpenChange }: RulesModalProps) {
  const [step, setStep] = useState(0)

  // Reset to the first step whenever the modal is (re)opened
  useEffect(() => {
    if (open) setStep(0)
  }, [open])

  const isFirst = step === 0
  const isLast = step === STEPS.length - 1
  const current = STEPS[step]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-center text-2xl font-bold text-balance">{current.title}</DialogTitle>
          <DialogDescription className="text-center">{current.subtitle}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 min-h-[18rem]">{current.content}</div>

        <div className="flex items-center justify-between gap-4 border-t border-border px-6 py-4">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={isFirst}
            className={cn(isFirst && "invisible")}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>

          <div className="flex items-center gap-1.5" aria-hidden="true">
            {STEPS.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setStep(i)}
                aria-label={`Go to step ${i + 1}`}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === step ? "w-5 bg-primary" : "w-2 bg-border hover:bg-muted-foreground/50",
                )}
              />
            ))}
          </div>

          {isLast ? (
            <Button onClick={() => onOpenChange(false)}>Got it!</Button>
          ) : (
            <Button onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

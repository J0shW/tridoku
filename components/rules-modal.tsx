"use client"

import { TRIDOKU_BOARD } from "@/lib/tridoku"
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

// ─── Modal ─────────────────────────────────────────────────────────────────────

export function RulesModal({ open, onOpenChange }: RulesModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">How to Play</DialogTitle>
          <DialogDescription className="text-center">Learn the rules of Tridoku</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <section>
            <h3 className="font-semibold text-lg mb-2 text-primary">The Basics</h3>
            <p className="text-muted-foreground leading-relaxed">
              Tridoku is a triangular variation of Sudoku. Fill each cell with a digit from 1 to 9 following the rules below.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-3 text-primary">Rules</h3>
            <ul className="space-y-4">
              <RuleItem number={1} example={<RegionExample />}>
                <strong>Regions:</strong> Each bolded triangular region must contain the digits 1 through 9 exactly once.
              </RuleItem>
              <RuleItem number={2} example={<OuterEdgesExample />}>
                <strong>Outer Edges:</strong> The three sides of the large triangle must each contain digits 1 through 9.
              </RuleItem>
              <RuleItem number={3} example={<InnerTriangleExample />}>
                <strong>Inner Triangle:</strong> The inner triangle&apos;s edges must also contain digits 1 through 9.
              </RuleItem>
              <RuleItem number={4} example={<NoTouchingExample />}>
                <strong>No Touching:</strong> Identical numbers cannot touch each other, not even at a single corner point.
              </RuleItem>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-3 text-primary">Tips</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <span>Start with cells that have the most constraints</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <div>
                  <span>
                    <strong className="text-foreground">Power Cells:</strong> A single cell just outside a region can eliminate many candidates at once via the no-touching rule — often leaving only one valid cell in the region for that digit.
                  </span>
                  <PowerCellExample />
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <span>Use the &quot;Show Errors&quot; toggle if you get stuck</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <span>Remember: touching cells cannot have the same value!</span>
              </li>
            </ul>
          </section>

          <section className="border-t border-border pt-4">
            <p className="text-sm text-muted-foreground text-center">
              A new puzzle is available every day at midnight.
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function RuleItem({
  number,
  children,
  example,
}: {
  number: number
  children: React.ReactNode
  example?: React.ReactNode
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
        {number}
      </span>
      <div className="flex-1">
        <p className="text-muted-foreground leading-relaxed">{children}</p>
        {example}
      </div>
    </li>
  )
}

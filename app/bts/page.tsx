"use client"

import { useState } from "react"
import { TRIDOKU_BOARD } from "@/lib/tridoku"
import type { CellId } from "@/lib/tridoku"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

// ─── SVG helpers ──────────────────────────────────────────────────────────────

const ROW_H = Math.sqrt(3)
const SVG_H = 9 * ROW_H

function triPts(row: number, col: number, dir: "up" | "down"): string {
  if (dir === "up") {
    return `${col},${(row + 1) * ROW_H} ${col + 1},${row * ROW_H} ${col + 2},${(row + 1) * ROW_H}`
  }
  return `${col},${row * ROW_H} ${col + 2},${row * ROW_H} ${col + 1},${(row + 1) * ROW_H}`
}

function cent(row: number, col: number, dir: "up" | "down") {
  return {
    x: col + 1,
    y: dir === "up" ? row * ROW_H + (ROW_H * 2) / 3 : row * ROW_H + ROW_H / 3,
  }
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  step,
  title,
  subtitle,
  children,
}: {
  step: number
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <section className="py-16 border-t border-border first:border-t-0">
      <div className="max-w-5xl mx-auto px-6">
        <div className="mb-8">
          <span className="inline-block text-sm font-mono font-bold text-primary/60 mb-2">
            STEP {step.toString().padStart(2, "0")}
          </span>
          <h2 className="text-3xl font-bold text-foreground">{title}</h2>
          <p className="mt-2 text-lg text-muted-foreground max-w-2xl">{subtitle}</p>
        </div>
        {children}
      </div>
    </section>
  )
}

function CodeBlock({ code, highlight }: { code: string; highlight?: string }) {
  const lines = code.split("\n")
  return (
    <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 text-sm p-4 overflow-x-auto leading-relaxed">
      {lines.map((line, i) => (
        <div
          key={i}
          className={
            highlight && line.trim().startsWith(highlight)
              ? "bg-yellow-500/20 -mx-4 px-4"
              : ""
          }
        >
          {line}
        </div>
      ))}
    </pre>
  )
}

// ─── Step 1: The Board ────────────────────────────────────────────────────────

function TheBoard() {
  const cells = TRIDOKU_BOARD.flat().filter((c) => !c.hidden)
  const rowCounts = TRIDOKU_BOARD.map((row) => row.filter((c) => !c.hidden).length)
  const total = rowCounts.reduce((a, b) => a + b, 0)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
      <div>
        <svg
          viewBox={`-0.2 -0.2 18.4 ${SVG_H + 0.4}`}
          className="w-full drop-shadow-sm"
          aria-label="Tridoku board"
        >
          {cells.map((cell) => (
            <polygon
              key={cell.id}
              points={triPts(cell.row, cell.col, cell.direction)}
              fill="#e4e3d3"
              stroke="#888"
              strokeWidth="0.06"
            />
          ))}
        </svg>
      </div>

      <div className="space-y-4">
        <p className="text-muted-foreground">
          The board is a large equilateral triangle subdivided into{" "}
          <strong className="text-foreground">{total} smaller triangles</strong> across{" "}
          <strong className="text-foreground">9 rows</strong>. Each row is one triangle
          taller than the last, alternating between up-pointing and down-pointing cells.
        </p>

        <div className="rounded-lg border border-border overflow-hidden text-sm">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-2 text-muted-foreground font-medium">Row</th>
                <th className="text-left px-3 py-2 text-muted-foreground font-medium">Cells</th>
                <th className="text-left px-3 py-2 text-muted-foreground font-medium">
                  ↑ up &nbsp; ↓ down
                </th>
              </tr>
            </thead>
            <tbody>
              {rowCounts.map((count, i) => {
                const up = Math.ceil(count / 2)
                const down = Math.floor(count / 2)
                return (
                  <tr key={i} className="border-t border-border/50">
                    <td className="px-3 py-1.5 font-mono text-foreground">Row {i}</td>
                    <td className="px-3 py-1.5 font-mono text-primary font-bold">{count}</td>
                    <td className="px-3 py-1.5 text-muted-foreground">
                      {up} up, {down} down
                    </td>
                  </tr>
                )
              })}
              <tr className="border-t-2 border-border bg-muted/30">
                <td className="px-3 py-2 font-bold text-foreground">Total</td>
                <td className="px-3 py-2 font-bold text-primary font-mono">{total}</td>
                <td className="px-3 py-2 text-muted-foreground">cells</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Step 2: Jagged Array Problem ─────────────────────────────────────────────

const JAGGED_ROWS = [1, 3, 5, 7, 9, 11, 13, 15, 17]

function JaggedArrays() {
  const [selectedRow, setSelectedRow] = useState<number>(4)
  const [selectedNhIdx, setSelectedNhIdx] = useState<number>(4)

  const selectedIsUp = selectedNhIdx % 2 === 0
  const aboveNeighbors =
    selectedRow > 0
      ? selectedIsUp
        ? [selectedNhIdx - 1, selectedNhIdx].filter(
            (i) => i >= 0 && i < JAGGED_ROWS[selectedRow - 1]
          )
        : [selectedNhIdx - 1, selectedNhIdx, selectedNhIdx + 1].filter(
            (i) => i >= 0 && i < JAGGED_ROWS[selectedRow - 1]
          )
      : []
  const belowNeighbors =
    selectedRow < 8
      ? selectedIsUp
        ? [selectedNhIdx, selectedNhIdx + 1, selectedNhIdx + 2].filter(
            (i) => i >= 0 && i < JAGGED_ROWS[selectedRow + 1]
          )
        : [selectedNhIdx + 1, selectedNhIdx + 2].filter(
            (i) => i >= 0 && i < JAGGED_ROWS[selectedRow + 1]
          )
      : []

  const isAboveNeighbor = (r: number, i: number) =>
    r === selectedRow - 1 && aboveNeighbors.includes(i)
  const isBelowNeighbor = (r: number, i: number) =>
    r === selectedRow + 1 && belowNeighbors.includes(i)
  const isSameRowNeighbor = (r: number, i: number) =>
    r === selectedRow && (i === selectedNhIdx - 1 || i === selectedNhIdx + 1)
  const isSelected = (r: number, i: number) => r === selectedRow && i === selectedNhIdx

  const cellW = 28
  const cellH = 28
  const gap = 2
  const maxRowW = 17 * (cellW + gap) - gap
  const svgW = maxRowW
  const svgH = JAGGED_ROWS.length * (cellH + gap) - gap

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
      <div className="space-y-3">
        <p className="text-muted-foreground">
          A natural first instinct is to store each row as a separate array — after all, they{" "}
          <em>are</em> different lengths. Click any cell below to see its neighbors.
        </p>

        {/* Interactive jagged array diagram */}
        <div className="rounded-lg bg-muted/30 border border-border p-4 overflow-x-auto">
          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            style={{ width: "100%", maxWidth: svgW }}
            aria-label="Jagged array visualization"
          >
            {JAGGED_ROWS.map((count, row) => {
              const rowW = count * (cellW + gap) - gap
              const xOffset = (maxRowW - rowW) / 2
              return (
                <g key={row} transform={`translate(0, ${row * (cellH + gap)})`}>
                  {/* Row label */}
                  <text
                    x={0}
                    y={cellH / 2}
                    fontSize="8"
                    fill="#888"
                    dominantBaseline="middle"
                    fontFamily="monospace"
                  >
                    r[{row}]
                  </text>
                  {Array.from({ length: count }, (_, i) => {
                    const x = xOffset + i * (cellW + gap)
                    const selected = isSelected(row, i)
                    const aboveN = isAboveNeighbor(row, i)
                    const belowN = isBelowNeighbor(row, i)
                    const sameN = isSameRowNeighbor(row, i)
                    const isUp = i % 2 === 0
                    let fill = "#e4e3d3"
                    let stroke = "#aaa"
                    let strokeW = 0.5
                    if (selected) { fill = "#3b82f6"; stroke = "#1d4ed8"; strokeW = 1.5 }
                    else if (aboveN || belowN || sameN) { fill = "#fbbf24"; stroke = "#d97706"; strokeW = 1.5 }
                    return (
                      <g
                        key={i}
                        className="cursor-pointer"
                        onClick={() => { setSelectedRow(row); setSelectedNhIdx(i) }}
                      >
                        <rect
                          x={x}
                          y={0}
                          width={cellW}
                          height={cellH}
                          fill={fill}
                          stroke={stroke}
                          strokeWidth={strokeW}
                          rx="2"
                        />
                        <text
                          x={x + cellW / 2}
                          y={cellH / 2 - 3}
                          fontSize="6"
                          fill={selected ? "#fff" : "#555"}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontFamily="monospace"
                        >
                          [{i}]
                        </text>
                        <text
                          x={x + cellW / 2}
                          y={cellH / 2 + 6}
                          fontSize="7"
                          fill={selected ? "#fff" : "#999"}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          {isUp ? "▲" : "▽"}
                        </text>
                      </g>
                    )
                  })}
                </g>
              )
            })}
          </svg>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded bg-blue-400 border border-blue-600" />
            Selected
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded bg-yellow-400 border border-yellow-600" />
            Neighbor
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-muted-foreground">
          The selected cell is{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">
            r[{selectedRow}][{selectedNhIdx}]
          </code>{" "}
          — a{" "}
          <strong className="text-foreground">
            {selectedIsUp ? "▲ up-triangle" : "▽ down-triangle"}
          </strong>
          . Finding its cross-row neighbors requires knowing row sizes and accounting for how
          the indexing shifts between rows depending on triangle direction:
        </p>

        <CodeBlock
          code={`// ⚠️ Jagged-array neighbor lookup
function neighborsAbove(row, i, isUp):
  prevRowLen = 2 * (row - 1) + 1   // row above has fewer cells
  if (isUp) {
    // up-triangles share an edge with ONE cell above
    return [ i - 1 ].filter(valid)  // …if it exists in prev row
  } else {
    // down-triangles touch TWO cells in the row above
    return [i - 1, i].filter(
      j => j >= 0 && j < prevRowLen
    )
  }
  // And below is the mirror-image of this logic...
  // And vertex-only neighbors add yet more cases...`}
        />

        <div className="rounded-lg border border-amber-400/40 bg-amber-50/30 dark:bg-amber-950/20 p-4 text-sm text-amber-800 dark:text-amber-200 space-y-1">
          <p className="font-semibold">The problem</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Row sizes differ, so indices shift between rows</li>
            <li>You need separate formulas for ▲ vs ▽ cells</li>
            <li>Corner-only (vertex) neighbors require even more special cases</li>
            <li>Every place you do validation, you carry this complexity</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

// ─── Step 3: Rectangular Grid ────────────────────────────────────────────────

function RectangularGrid() {
  const [showHidden, setShowHidden] = useState(false)
  const allCells = TRIDOKU_BOARD.flat()

  const CELL_W = 1
  const CELL_H = 1
  const svgW = 17
  const svgH = 9

  function cellFill(row: number, col: number, hidden: boolean) {
    if (hidden) return showHidden ? "#d0d0d0" : "transparent"
    const c = TRIDOKU_BOARD[row][col]
    if (c.color === "outer" || c.color === "overlap") return "#bfdde2"
    if (c.color === "inner") return "#eed496"
    return "#e4e3d3"
  }

  function cellStroke(hidden: boolean) {
    if (hidden) return showHidden ? "#bbb" : "transparent"
    return "#888"
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Instead of jagged rows, we store the board as a uniform{" "}
          <strong className="text-foreground">9 × 17 rectangle</strong> — 153 cells total.
          Cells that fall outside the triangle are simply marked{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">hidden: true</code>.
          Toggle the button to reveal them.
        </p>

        <button
          onClick={() => setShowHidden(!showHidden)}
          className={`px-4 py-2 rounded-lg border-2 text-sm font-semibold transition-all ${
            showHidden
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-background text-foreground hover:border-primary/50"
          }`}
        >
          {showHidden ? "▣ Hiding hidden cells" : "□ Reveal hidden cells"}
        </button>

        <div className="rounded-lg bg-muted/30 border border-border p-3 overflow-x-auto">
          <svg
            viewBox={`-0.05 -0.05 ${svgW + 0.1} ${svgH + 0.1}`}
            className="w-full"
            aria-label="9×17 rectangular grid"
          >
            {allCells.map((cell) => (
              <rect
                key={cell.id}
                x={cell.col * CELL_W}
                y={cell.row * CELL_H}
                width={CELL_W - 0.04}
                height={CELL_H - 0.04}
                fill={cellFill(cell.row, cell.col, cell.hidden)}
                stroke={cellStroke(cell.hidden)}
                strokeWidth="0.03"
                rx="0.05"
              />
            ))}
          </svg>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded bg-[#bfdde2] border border-[#8ab0b8]" />
            Outer edge
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded bg-[#eed496] border border-[#c4aa6a]" />
            Inner edge
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded bg-[#e4e3d3] border border-[#aaa]" />
            Interior
          </span>
          {showHidden && (
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded bg-[#d0d0d0] border border-[#bbb]" />
              Hidden (outside triangle)
            </span>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          {showHidden
            ? `153 total cells: 81 visible + 72 hidden`
            : "81 visible cells — the triangular board you play on"}
        </p>
      </div>

      <div className="space-y-4">
        <p className="text-muted-foreground">
          Now every cell has a consistent{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">[row][col]</code>{" "}
          address in a grid where <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">col</code>{" "}
          means the same thing in every row. Potential neighbors are always at predictable offsets — you
          just skip the ones that are hidden:
        </p>

        <CodeBlock
          code={`// ✅ Rectangular-grid neighbor lookup
function candidateNeighbors(row, col):
  return [
    // same row (left / right triangle)
    [row,     col - 2],
    [row,     col + 2],
    // row above (3 candidates)
    [row - 1, col - 1],
    [row - 1, col    ],
    [row - 1, col + 1],
    // row below (3 candidates)
    [row + 1, col - 1],
    [row + 1, col    ],
    [row + 1, col + 1],
  ].filter(([r, c]) =>
    r >= 0 && r < 9 &&
    c >= 0 && c < 17 &&
    !board[r][c].hidden
  )`}
        />

        <div className="rounded-lg border border-green-400/40 bg-green-50/30 dark:bg-green-950/20 p-4 text-sm text-green-800 dark:text-green-200 space-y-1">
          <p className="font-semibold">The benefit</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>One formula works for every cell, regardless of direction</li>
            <li>No special cases for ▲ vs ▽</li>
            <li>Validation, region checks, and rendering all use the same consistent coordinates</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

// ─── Step 4: Vertex-Based Neighbor Finding ───────────────────────────────────

function NeighborFinder() {
  const [selectedId, setSelectedId] = useState<CellId | null>("4-8")

  const selectedCell = selectedId
    ? TRIDOKU_BOARD.flat().find((c) => c.id === selectedId)
    : null
  const neighborIds = new Set(selectedCell?.neighbors ?? [])

  const visibleCells = TRIDOKU_BOARD.flat().filter((c) => !c.hidden)

  function cellFill(id: CellId) {
    if (id === selectedId) return "#3b82f6"
    if (neighborIds.has(id)) return "#fbbf24"
    return "#e4e3d3"
  }
  function cellStroke(id: CellId) {
    if (id === selectedId) return "#1d4ed8"
    if (neighborIds.has(id)) return "#d97706"
    return "#888"
  }
  function textFill(id: CellId) {
    if (id === selectedId) return "#fff"
    return "#555"
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
      <div>
        <p className="text-muted-foreground mb-4">
          Click any cell to see all of its neighbors highlighted in yellow. The actual
          implementation goes one step further and uses a{" "}
          <strong className="text-foreground">vertex map</strong> — this automatically
          captures corner-touching neighbors without any extra logic.
        </p>

        <svg
          viewBox={`-0.2 -0.2 18.4 ${SVG_H + 0.4}`}
          className="w-full cursor-pointer drop-shadow-sm"
          aria-label="Interactive neighbor finder"
        >
          {visibleCells.map((cell) => {
            const c = cent(cell.row, cell.col, cell.direction)
            return (
              <g
                key={cell.id}
                onClick={() => setSelectedId(cell.id)}
                className="cursor-pointer"
              >
                <polygon
                  points={triPts(cell.row, cell.col, cell.direction)}
                  fill={cellFill(cell.id)}
                  stroke={cellStroke(cell.id)}
                  strokeWidth={cell.id === selectedId || neighborIds.has(cell.id) ? 0.12 : 0.06}
                />
                <text
                  x={c.x}
                  y={c.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="0.5"
                  fill={textFill(cell.id)}
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {cell.id === selectedId
                    ? "●"
                    : neighborIds.has(cell.id)
                    ? "◆"
                    : ""}
                </text>
              </g>
            )
          })}
        </svg>

        {selectedCell && (
          <p className="text-sm text-muted-foreground mt-2 text-center">
            Cell{" "}
            <code className="bg-muted px-1 rounded font-mono">{selectedId}</code> has{" "}
            <strong className="text-foreground">{selectedCell.neighbors.length} neighbors</strong>
            {" "}({selectedCell.direction === "up" ? "▲ up" : "▽ down"}-triangle)
          </p>
        )}
      </div>

      <div className="space-y-4">
        <p className="text-muted-foreground">
          The vertex map works by registering every cell against each of its 3 corner
          points. Two cells are neighbors if they share <em>any</em> corner — which covers
          both shared-edge and shared-point adjacency in a single pass:
        </p>

        <CodeBlock
          code={`// Build the vertex map (runs once at startup)
const vertexMap = new Map()

for (const cell of allCells) {
  const { row: r, col: c, direction: dir } = cell
  if (dir === "up") {
    // ▲: bottom-left, apex, bottom-right
    register(\`\${c},\${r+1}\`, cell.id)
    register(\`\${c+1},\${r}\`, cell.id)
    register(\`\${c+2},\${r+1}\`, cell.id)
  } else {
    // ▽: top-left, top-right, bottom-apex
    register(\`\${c},\${r}\`, cell.id)
    register(\`\${c+2},\${r}\`, cell.id)
    register(\`\${c+1},\${r+1}\`, cell.id)
  }
}

// Look up neighbors for any cell
function neighborsOf(cell):
  vertices = getVertexKeys(cell)
  return vertices
    .flatMap(v => vertexMap.get(v))
    .filter(id => id !== cell.id)
    .unique()`}
        />

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border border-border p-3 bg-muted/20 text-center">
            <p className="text-2xl font-bold text-primary">81</p>
            <p className="text-muted-foreground">visible cells</p>
          </div>
          <div className="rounded-lg border border-border p-3 bg-muted/20 text-center">
            <p className="text-2xl font-bold text-primary">≤12</p>
            <p className="text-muted-foreground">neighbors per cell</p>
          </div>
          <div className="rounded-lg border border-border p-3 bg-muted/20 text-center">
            <p className="text-2xl font-bold text-primary">9×17</p>
            <p className="text-muted-foreground">grid size</p>
          </div>
          <div className="rounded-lg border border-border p-3 bg-muted/20 text-center">
            <p className="text-2xl font-bold text-primary">1</p>
            <p className="text-muted-foreground">formula for all cells</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Step 5: Rotational Symmetry ─────────────────────────────────────────────

// The exact region-cell coordinate lookup from generate-puzzles.mjs
const REGION_CELLS: Record<number, [number, number][]> = {
  0: [[0,8],[1,7],[1,8],[1,9],[2,6],[2,7],[2,8],[2,9],[2,10]],
  1: [[3,5],[4,4],[4,5],[4,6],[5,3],[5,4],[5,5],[5,6],[5,7]],
  2: [[3,6],[3,7],[3,8],[3,9],[3,10],[4,7],[4,8],[4,9],[5,8]],
  3: [[3,11],[4,10],[4,11],[4,12],[5,9],[5,10],[5,11],[5,12],[5,13]],
  4: [[6,2],[7,1],[7,2],[7,3],[8,0],[8,1],[8,2],[8,3],[8,4]],
  5: [[6,3],[6,4],[6,5],[6,6],[6,7],[7,4],[7,5],[7,6],[8,5]],
  6: [[6,8],[7,7],[7,8],[7,9],[8,6],[8,7],[8,8],[8,9],[8,10]],
  7: [[6,9],[6,10],[6,11],[6,12],[6,13],[7,10],[7,11],[7,12],[8,11]],
  8: [[6,14],[7,13],[7,14],[7,15],[8,12],[8,13],[8,14],[8,15],[8,16]],
}

const ROTATION_MAP: [number, number][] = [
  [4,8],[6,3],[5,7],[1,6],[8,0],[7,2],[3,1],[2,5],[0,4]
]
const ROTATION_MAP_GROUP3: [number, number][] = [
  [8,4],[6,3],[5,7],[1,6],[0,8],[7,2],[3,1],[2,5],[4,0]
]

// Three symmetry groups: [regionA, regionB, regionC]
// Within each group, localIndex maps across the three via the rotation map.
const SYM_GROUPS: [number, number, number][] = [
  [0, 4, 8],
  [1, 6, 3],
  [2, 5, 7],
]

// Group colors [base fill, selected fill, text]
const GROUP_COLORS = [
  { base: "#f9a8d4", selected: "#ec4899", text: "#831843", label: "Group A" },
  { base: "#93c5fd", selected: "#3b82f6", text: "#1e3a8a", label: "Group B" },
  { base: "#86efac", selected: "#22c55e", text: "#14532d", label: "Group C" },
]

// Build a cellId → {groupIndex, regionIndex (0|1|2 within group), localIndex} map
type CellSymInfo = { groupIndex: number; posInGroup: number; localIndex: number }
const CELL_SYM_MAP = new Map<string, CellSymInfo>()

for (let g = 0; g < 3; g++) {
  const [rA, rB, rC] = SYM_GROUPS[g]
  const rotMap = g === 2 ? ROTATION_MAP_GROUP3 : ROTATION_MAP
  for (let li = 0; li < 9; li++) {
    const lB = rotMap[li][0]
    const lC = rotMap[li][1]
    const [rA_row, rA_col] = REGION_CELLS[rA][li]
    const [rB_row, rB_col] = REGION_CELLS[rB][lB]
    const [rC_row, rC_col] = REGION_CELLS[rC][lC]
    CELL_SYM_MAP.set(`${rA_row}-${rA_col}`, { groupIndex: g, posInGroup: 0, localIndex: li })
    CELL_SYM_MAP.set(`${rB_row}-${rB_col}`, { groupIndex: g, posInGroup: 1, localIndex: li })
    CELL_SYM_MAP.set(`${rC_row}-${rC_col}`, { groupIndex: g, posInGroup: 2, localIndex: li })
  }
}

// Demo: given positions and values taken from the physical puzzle book (image).
// Each group gets its own set of [localIndex, value] pairs, read from the
// representative region visible in the image (region 0 / region 1 / region 2).
// The symmetric rotation is then applied to populate the other two regions per group.
const DEMO_GROUP_GIVENS: Array<[number, number][]> = [
  // Group A (regions 0, 4, 8) — values from region 0 in the image
  [[1, 3], [3, 1], [5, 6], [7, 5]],
  // Group B (regions 1, 6, 3) — values from region 1 in the image
  [[3, 4], [6, 9], [8, 1]],
  // Group C (regions 2, 5, 7) — values from region 2 in the image
  [[0, 7], [2, 1], [4, 8]],
]

const DEMO_GIVENS_MAP = new Map<string, number>() // cellId → value
for (let _g = 0; _g < 3; _g++) {
  const [_rA, _rB, _rC] = SYM_GROUPS[_g]
  const _rotMap = _g === 2 ? ROTATION_MAP_GROUP3 : ROTATION_MAP
  for (const [_li, _val] of DEMO_GROUP_GIVENS[_g]) {
    const _lB = _rotMap[_li][0]
    const _lC = _rotMap[_li][1]
    const [_rA_row, _rA_col] = REGION_CELLS[_rA][_li]
    const [_rB_row, _rB_col] = REGION_CELLS[_rB][_lB]
    const [_rC_row, _rC_col] = REGION_CELLS[_rC][_lC]
    DEMO_GIVENS_MAP.set(`${_rA_row}-${_rA_col}`, _val)
    DEMO_GIVENS_MAP.set(`${_rB_row}-${_rB_col}`, _val)
    DEMO_GIVENS_MAP.set(`${_rC_row}-${_rC_col}`, _val)
  }
}

// Macro-triangle outline points for each of the 9 regions
function regionMacroPts(r: number): string {
  const H3 = 3 * ROW_H, H6 = 6 * ROW_H, H9 = 9 * ROW_H
  const pts: Record<number, string> = {
    0: `9,0 6,${H3} 12,${H3}`,
    1: `6,${H3} 3,${H6} 9,${H6}`,
    2: `6,${H3} 12,${H3} 9,${H6}`,
    3: `12,${H3} 9,${H6} 15,${H6}`,
    4: `3,${H6} 0,${H9} 6,${H9}`,
    5: `3,${H6} 9,${H6} 6,${H9}`,
    6: `9,${H6} 6,${H9} 12,${H9}`,
    7: `9,${H6} 15,${H6} 12,${H9}`,
    8: `15,${H6} 12,${H9} 18,${H9}`,
  }
  return pts[r]
}

// For a given cell, return the IDs of its two rotational partners
function getSymmetricPartners(cellId: string): string[] {
  const info = CELL_SYM_MAP.get(cellId)
  if (!info) return []
  const [rA, rB, rC] = SYM_GROUPS[info.groupIndex]
  const rotMap = info.groupIndex === 2 ? ROTATION_MAP_GROUP3 : ROTATION_MAP
  const li = info.localIndex
  const lB = rotMap[li][0]
  const lC = rotMap[li][1]
  const [rA_row, rA_col] = REGION_CELLS[rA][li]
  const [rB_row, rB_col] = REGION_CELLS[rB][lB]
  const [rC_row, rC_col] = REGION_CELLS[rC][lC]
  return [
    `${rA_row}-${rA_col}`,
    `${rB_row}-${rB_col}`,
    `${rC_row}-${rC_col}`,
  ].filter((id) => id !== cellId)
}

function SymmetryGroups() {
  const [selectedId, setSelectedId] = useState<string | null>("0-8")
  const visibleCells = TRIDOKU_BOARD.flat().filter((c) => !c.hidden)

  const selectedInfo = selectedId ? CELL_SYM_MAP.get(selectedId) : null
  const partnerIds = new Set(selectedId ? getSymmetricPartners(selectedId) : [])
  const allHighlightIds = new Set(selectedId ? [selectedId, ...partnerIds] : [])

  function cellFill(id: string) {
    const info = CELL_SYM_MAP.get(id)
    if (!info) return "#e4e3d3"
    const colors = GROUP_COLORS[info.groupIndex]
    if (allHighlightIds.has(id)) return colors.selected
    return colors.base
  }
  function cellStrokeW(id: string) {
    return allHighlightIds.has(id) ? 0.14 : 0.05
  }
  function cellStroke(id: string) {
    if (!allHighlightIds.has(id)) return "#888"
    const info = CELL_SYM_MAP.get(id)
    if (!info) return "#888"
    return GROUP_COLORS[info.groupIndex].text
  }

  // Region centroids for region labels
  const regionCentroids: Record<number, { x: number; y: number }> = {}
  for (let r = 0; r < 9; r++) {
    const coords = REGION_CELLS[r]
    const xs = coords.map(([row, col]) => {
      const cell = TRIDOKU_BOARD[row][col]
      return cent(cell.row, cell.col, cell.direction).x
    })
    const ys = coords.map(([row, col]) => {
      const cell = TRIDOKU_BOARD[row][col]
      return cent(cell.row, cell.col, cell.direction).y
    })
    regionCentroids[r] = {
      x: xs.reduce((a, b) => a + b, 0) / xs.length,
      y: ys.reduce((a, b) => a + b, 0) / ys.length,
    }
  }

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
      <div className="space-y-4">
        <p className="text-muted-foreground">
          The board has <strong className="text-foreground">3-way rotational symmetry</strong> at 120°.
          The 9 regions split into 3 groups of 3 — click any cell to light up its two rotational
          counterparts in the other regions of the same group.
        </p>

        <svg
          viewBox={`-0.2 -0.2 18.4 ${SVG_H + 0.4}`}
          className="w-full cursor-pointer drop-shadow-sm"
          aria-label="Rotational symmetry groups"
        >
          {visibleCells.map((cell) => (
            <g key={cell.id} onClick={() => setSelectedId(cell.id)} className="cursor-pointer">
              <polygon
                points={triPts(cell.row, cell.col, cell.direction)}
                fill={cellFill(cell.id)}
                stroke={cellStroke(cell.id)}
                strokeWidth={cellStrokeW(cell.id)}
              />
            </g>
          ))}
          {/* Region number labels */}
          {Object.entries(regionCentroids).map(([r, pos]) => {
            const ri = parseInt(r)
            const groupIndex = SYM_GROUPS.findIndex((g) => g.includes(ri))
            return (
              <text
                key={r}
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="0.65"
                fontWeight="700"
                fill={GROUP_COLORS[groupIndex].text}
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                R{r}
              </text>
            )
          })}
        </svg>

        <div className="flex flex-wrap gap-3 text-xs">
          {GROUP_COLORS.map((c, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded" style={{ background: c.base, border: `1px solid ${c.text}` }} />
              <span className="text-muted-foreground">{c.label}: Regions {SYM_GROUPS[i].join(", ")}</span>
            </span>
          ))}
        </div>

        {selectedInfo && (
          <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm space-y-1">
            <p className="font-medium text-foreground">
              Cell <code className="bg-muted px-1 rounded font-mono">{selectedId}</code>
            </p>
            <p className="text-muted-foreground">
              {GROUP_COLORS[selectedInfo.groupIndex].label} · Region{" "}
              {SYM_GROUPS[selectedInfo.groupIndex][selectedInfo.posInGroup]} · local index{" "}
              <code className="bg-muted px-1 rounded font-mono">{selectedInfo.localIndex}</code>
            </p>
            <p className="text-muted-foreground text-xs">
              Symmetric partners:{" "}
              {[...partnerIds].map((id) => (
                <code key={id} className="bg-muted px-1 rounded font-mono mr-1">{id}</code>
              ))}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border border-amber-400/40 bg-amber-50/30 dark:bg-amber-950/20 p-4 text-sm text-amber-800 dark:text-amber-200 space-y-2">
          <p className="font-semibold">Why not just mirror horizontally like Sudoku?</p>
          <p>
            In a 9×9 square grid, reflecting a given cell at <code className="bg-black/10 px-1 rounded">[r, c]</code>{" "}
            to <code className="bg-black/10 px-1 rounded">[8-r, 8-c]</code> is trivial. A triangle has no
            horizontal or vertical axis of symmetry — it has <em>rotational</em> symmetry at 120°.
            Calculating that rotation geometrically in a mixed up/down triangular grid is non-trivial, especially
            when the grid coordinate system doesn't align with the rotation center.
          </p>
        </div>

        <p className="text-muted-foreground">
          The solution: skip the geometry entirely. Hard-code the mapping. Each region's 9 cells are listed
          in a fixed order, and a lookup table says which local index in region A maps to which local index
          in regions B and C of the same group:
        </p>

        <CodeBlock
          code={`// Each region's 9 cells listed in local-index order
const REGION_CELLS = {
  0: [[0,8],[1,7],[1,8],...],  // top corner
  4: [[6,2],[7,1],[7,2],...],  // bottom-left corner
  8: [[6,14],[7,13],[7,14],...],// bottom-right corner
  // ...
}

// Maps local index in region A → local indices in B and C
// (derived from physical puzzle books, not calculated)
const ROTATION_MAP = [
  [4, 8],  // index 0 → 4 → 8
  [6, 3],  // index 1 → 6 → 3
  [5, 7],  // index 2 → 5 → 7
  [1, 6],  // index 3 → 1 → 6
  [8, 0],  // index 4 → 8 → 0
  // ...
]

// Removing a given: always remove all 3 at once
function removeSymmetric(board, groupIndex, localIndex) {
  const [rA, rB, rC] = SYM_GROUPS[groupIndex]
  const lB = ROTATION_MAP[localIndex][0]
  const lC = ROTATION_MAP[localIndex][1]
  remove(board, REGION_CELLS[rA][localIndex])
  remove(board, REGION_CELLS[rB][lB])
  remove(board, REGION_CELLS[rC][lC])
}`}
        />

        <div className="rounded-lg border border-green-400/40 bg-green-50/30 dark:bg-green-950/20 p-4 text-sm text-green-800 dark:text-green-200 space-y-1">
          <p className="font-semibold">The result</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Givens are always removed in symmetric triplets of 3</li>
            <li>Every generated puzzle has aesthetically pleasing 3-way rotational symmetry</li>
            <li>No trigonometry needed — just a 9-entry lookup table</li>
          </ul>
        </div>
      </div>
    </div>

    {/* ── Full-width demo board ── */}
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold text-foreground mb-1">See it in action</h4>
        <p className="text-sm text-muted-foreground">
          Below is a real example of the symmetry pattern applied to the full board.
          4 cells per region are marked as givens — the same 4 local positions appear
          in every region within each group, just rotated 120°. The numbers are identical
          across all three regions of a group because all three cells are always removed (or kept) together.
        </p>
      </div>
      <svg
        viewBox={`-0.2 -0.2 18.4 ${SVG_H + 0.4}`}
        className="w-full max-w-sm mx-auto block drop-shadow-sm"
        aria-label="Example symmetric given pattern"
      >
        {TRIDOKU_BOARD.flat().filter((c) => !c.hidden).map((cell) => {
          const val = DEMO_GIVENS_MAP.get(cell.id)
          const info = CELL_SYM_MAP.get(cell.id)
          const c = cent(cell.row, cell.col, cell.direction)
          const fill = val !== undefined && info ? GROUP_COLORS[info.groupIndex].base : "#f0efea"
          return (
            <g key={cell.id}>
              <polygon
                points={triPts(cell.row, cell.col, cell.direction)}
                fill={fill}
                stroke="#ccc"
                strokeWidth="0.04"
              />
              {val !== undefined && info && (
                <text
                  x={c.x}
                  y={c.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="0.72"
                  fontWeight="700"
                  fill={GROUP_COLORS[info.groupIndex].text}
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {val}
                </text>
              )}
            </g>
          )
        })}
        {/* Bold region macro-triangle borders */}
        {Array.from({ length: 9 }, (_, r) => (
          <polygon
            key={r}
            points={regionMacroPts(r)}
            fill="none"
            stroke="#222"
            strokeWidth="0.18"
            strokeLinejoin="round"
          />
        ))}
      </svg>
      <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
        {GROUP_COLORS.map((c, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded" style={{ background: c.base, border: `1px solid ${c.text}` }} />
            <span>Regions {SYM_GROUPS[i].join(", ")} — same 4 positions given, rotated 120°</span>
          </span>
        ))}
      </div>
    </div>
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BehindTheScenesPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 sticky top-0 z-10 backdrop-blur">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to game
          </Link>
          <span className="text-sm font-semibold text-foreground">Behind the Scenes</span>
          <span className="text-xs text-muted-foreground font-mono">Tridoku</span>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-6 py-14 text-center border-b border-border">
        <p className="text-sm font-mono font-bold text-primary/60 mb-3 tracking-widest uppercase">
          Behind the Scenes
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
          Building a Triangular Grid
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          How do you efficiently represent and validate a non-rectangular puzzle board?
          Here's the engineering challenge — and the surprisingly elegant solution.
        </p>
      </div>

      {/* Sections */}
      <Section
        step={1}
        title="The Shape of the Problem"
        subtitle="Tridoku's board is a large triangle made of 81 smaller triangles across 9 rows of varying widths."
      >
        <TheBoard />
      </Section>

      <Section
        step={2}
        title="The Naive Approach: Jagged Arrays"
        subtitle='Since each row has a different number of cells, the obvious choice is to store each row as its own array. This turns out to be surprisingly painful.'
      >
        <JaggedArrays />
      </Section>

      <Section
        step={3}
        title="The Solution: Rectangular Grid + Hidden Cells"
        subtitle="By using a uniform 9×17 grid and marking out-of-bounds cells as hidden, every cell gets a consistent coordinate — and adjacency becomes trivial."
      >
        <RectangularGrid />
      </Section>

      <Section
        step={4}
        title="Finding Neighbors with a Vertex Map"
        subtitle="The final piece: instead of geometric formulas, we register every cell against its 3 corner points. Cells sharing any corner are neighbors — automatically, for every case."
      >
        <NeighborFinder />
      </Section>

      <Section
        step={5}
        title="Symmetric Puzzle Generation"
        subtitle="A good Sudoku puzzle looks intentional. Tridoku uses 3-way rotational symmetry — but you can't just reflect coordinates. The solution is a hardcoded mapping table derived from the physical puzzle books."
      >
        <SymmetryGroups />
      </Section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          ← Back to the game
        </Link>
      </footer>
    </div>
  )
}

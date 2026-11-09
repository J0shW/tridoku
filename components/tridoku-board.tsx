"use client"

import { Play } from "lucide-react"
import { Cell, CellId, Board, TRIDOKU_BOARD, nearestCellId } from "@/lib/tridoku"

const ROW_HEIGHT = Math.sqrt(3)
const SVG_WIDTH = 18
const SVG_HEIGHT = 9 * ROW_HEIGHT
const STROKE_MARGIN = 0.15 // Extra margin to prevent stroke clipping

// Cell fills by rule membership. The same on every difficulty (TRI-031).
const CELL_FILLS: Record<Cell["color"], string> = {
  outer: "var(--tridoku-cell-outer)",
  inner: "var(--tridoku-cell-inner)",
  overlap: "var(--tridoku-cell-overlap)",
  none: "var(--tridoku-cell-none)",
}

const SELECTED_FILL = "var(--tridoku-selected-fill)"
const TOUCHING_FILL = "var(--tridoku-touching-fill)"
const SELECTED_STROKE = "var(--tridoku-selected-stroke)"
const ERROR_FILL = "rgba(239, 68, 68, 0.3)"

function getTrianglePoints(row: number, col: number, direction: "up" | "down"): string {
  if (direction === "up") {
    const yBase = (row + 1) * ROW_HEIGHT
    const yTop = row * ROW_HEIGHT
    return `${col},${yBase} ${col + 1},${yTop} ${col + 2},${yBase}`
  } else {
    const yTop = row * ROW_HEIGHT
    const yBottom = (row + 1) * ROW_HEIGHT
    return `${col},${yTop} ${col + 2},${yTop} ${col + 1},${yBottom}`
  }
}

// For each non-hidden cell, check its 3 edges. If the neighbor across that edge
// is in a different boldedRegion (or doesn't exist), that edge is a region boundary.
type Edge = { x1: number; y1: number; x2: number; y2: number }

function getRegionFromBoard(row: number, col: number): number | null {
  if (row < 0 || row >= 9 || col < 0 || col >= 17) return null
  const cell = TRIDOKU_BOARD[row][col]
  if (cell.hidden) return null
  return cell.boldedRegion
}

function computeBoldEdges(): Edge[] {
  const edges: Edge[] = []

  for (const boardRow of TRIDOKU_BOARD) {
    for (const cell of boardRow) {
      if (cell.hidden) continue
      const { row, col, direction, boldedRegion } = cell

      if (direction === "up") {
        const yBase = (row + 1) * ROW_HEIGHT
        const yTop = row * ROW_HEIGHT

        // Left slant edge: (col, yBase) → (col+1, yTop) — neighbor is (row, col-1)
        if (getRegionFromBoard(row, col - 1) !== boldedRegion) {
          edges.push({ x1: col, y1: yBase, x2: col + 1, y2: yTop })
        }
        // Right slant edge: (col+1, yTop) → (col+2, yBase) — neighbor is (row, col+1)
        if (getRegionFromBoard(row, col + 1) !== boldedRegion) {
          edges.push({ x1: col + 1, y1: yTop, x2: col + 2, y2: yBase })
        }
        // Bottom horizontal edge: (col, yBase) → (col+2, yBase) — neighbor is (row+1, col)
        if (getRegionFromBoard(row + 1, col) !== boldedRegion) {
          edges.push({ x1: col, y1: yBase, x2: col + 2, y2: yBase })
        }
      } else {
        const yTop = row * ROW_HEIGHT
        const yBottom = (row + 1) * ROW_HEIGHT

        // Left slant edge: (col, yTop) → (col+1, yBottom) — neighbor is (row, col-1)
        if (getRegionFromBoard(row, col - 1) !== boldedRegion) {
          edges.push({ x1: col, y1: yTop, x2: col + 1, y2: yBottom })
        }
        // Right slant edge: (col+2, yTop) → (col+1, yBottom) — neighbor is (row, col+1)
        if (getRegionFromBoard(row, col + 1) !== boldedRegion) {
          edges.push({ x1: col + 2, y1: yTop, x2: col + 1, y2: yBottom })
        }
        // Top horizontal edge: (col, yTop) → (col+2, yTop) — neighbor is (row-1, col)
        if (getRegionFromBoard(row - 1, col) !== boldedRegion) {
          edges.push({ x1: col, y1: yTop, x2: col + 2, y2: yTop })
        }
      }
    }
  }

  return edges
}

const BOLD_EDGES = computeBoldEdges()

function getTriangleCentroid(row: number, col: number, direction: "up" | "down"): { x: number; y: number } {
  if (direction === "up") {
    return { x: col + 1, y: row * ROW_HEIGHT + ROW_HEIGHT * 2 / 3 }
  } else {
    return { x: col + 1, y: row * ROW_HEIGHT + ROW_HEIGHT / 3 }
  }
}

// Get positions for up to 6 pencil marks arranged in a triangular grid.
// Up-facing: row of 1 (top), row of 2, row of 3 (bottom)
// Down-facing: row of 3 (top), row of 2, row of 1 (bottom)
function getPencilMarkPositions(row: number, col: number, direction: "up" | "down"): { x: number; y: number }[] {
  const cx = col + 1 // horizontal center of cell
  const yTop = row * ROW_HEIGHT
  const h = ROW_HEIGHT

  if (direction === "up") {
    // Rows from top to bottom: 1 mark, 2 marks, 3 marks
    const y1 = yTop + h * 0.36
    const y2 = yTop + h * 0.58
    const y3 = yTop + h * 0.80
    const spread2 = 0.24
    const spread3 = 0.42
    return [
      { x: cx, y: y1 },                            // row 1: center
      { x: cx - spread2, y: y2 },                   // row 2: left
      { x: cx + spread2, y: y2 },                   // row 2: right
      { x: cx - spread3, y: y3 },                   // row 3: left
      { x: cx, y: y3 },                             // row 3: center
      { x: cx + spread3, y: y3 },                   // row 3: right
    ]
  } else {
    // Rows from top to bottom: 3 marks, 2 marks, 1 mark
    const y1 = yTop + h * 0.20
    const y2 = yTop + h * 0.42
    const y3 = yTop + h * 0.64
    const spread3 = 0.42
    const spread2 = 0.24
    return [
      { x: cx - spread3, y: y1 },                   // row 1: left
      { x: cx, y: y1 },                             // row 1: center
      { x: cx + spread3, y: y1 },                   // row 1: right
      { x: cx - spread2, y: y2 },                   // row 2: left
      { x: cx + spread2, y: y2 },                   // row 2: right
      { x: cx, y: y3 },                             // row 3: center
    ]
  }
}

// Get positions for up to 3 pencil marks placed near the 3 corners of the triangle.
// Each corner is inset toward the centroid so the digits sit comfortably inside the cell.
function getPencilMarkCornerPositions(row: number, col: number, direction: "up" | "down"): { x: number; y: number }[] {
  const yTop = row * ROW_HEIGHT
  const h = ROW_HEIGHT
  let verts: { x: number; y: number }[]
  if (direction === "up") {
    verts = [
      { x: col + 1, y: yTop },      // top
      { x: col, y: yTop + h },      // bottom-left
      { x: col + 2, y: yTop + h },  // bottom-right
    ]
  } else {
    verts = [
      { x: col, y: yTop },          // top-left
      { x: col + 2, y: yTop },      // top-right
      { x: col + 1, y: yTop + h },  // bottom
    ]
  }
  const centroid = getTriangleCentroid(row, col, direction)
  const t = 0.68 // how far to pull each corner toward the centroid
  return verts.map((v) => ({
    x: v.x + (centroid.x - v.x) * t,
    y: v.y + (centroid.y - v.y) * t,
  }))
}

interface TridokuBoardProps {
  cells: Board
  selectedCellId: CellId | null
  onCellClick: (cellId: CellId) => void
  isPaused: boolean
  highlightedValue?: number | null
  showErrors?: boolean
  /** Shown as a Resume button while paused. */
  onResume?: () => void
}

const HIGHLIGHTED_FILL = "var(--tridoku-highlighted-fill)"

const VIEWBOX_RATIO = `${SVG_WIDTH + STROKE_MARGIN * 2} / ${SVG_HEIGHT + STROKE_MARGIN * 2}`

export function TridokuBoard({ cells, selectedCellId, onCellClick, isPaused, highlightedValue, showErrors = false, onResume }: TridokuBoardProps) {
  if (isPaused) {
    // Same size as the board, so nothing around it moves (TRI-087)
    return (
      <div className="w-full p-2">
        <div
          className="flex w-full flex-col items-center justify-center gap-3 rounded-xl bg-secondary/50"
          style={{ aspectRatio: VIEWBOX_RATIO }}
        >
          <p className="text-2xl font-bold">Paused</p>
          {onResume && (
            <button
              type="button"
              onClick={onResume}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-[15px] font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Play className="h-4 w-4 fill-current" aria-hidden="true" />
              Resume
            </button>
          )}
        </div>
      </div>
    )
  }

  // TRI-059: a tap selects the cell whose centre is nearest, wherever it lands on the board
  const pickAt = (e: React.MouseEvent<SVGSVGElement>) => {
    const matrix = e.currentTarget.getScreenCTM()
    if (!matrix) return
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(matrix.inverse())
    const id = nearestCellId(p.x, p.y)
    if (id) onCellClick(id)
  }

  // TRI-032: lightly shade the cells touching the selected one, since the
  // no-touching rule is the one that's new compared with Sudoku.
  const touching = new Set(
    selectedCellId ? TRIDOKU_BOARD.flat().find((c) => c.id === selectedCellId && !c.hidden)?.neighbors ?? [] : [],
  )

  return (
    <div className="w-full">
      <svg
        viewBox={`${-STROKE_MARGIN} ${-STROKE_MARGIN} ${SVG_WIDTH + STROKE_MARGIN * 2} ${SVG_HEIGHT + STROKE_MARGIN * 2}`}
        className="w-full h-auto p-2"
        onClick={pickAt}
      >
        <style>
          {`
            @keyframes dash-animation {
              to {
                stroke-dashoffset: -0.6;
              }
            }
            .selected-cell {
              stroke-dasharray: 0.4 0.2;
              animation: dash-animation 1s linear infinite;
            }
          `}
        </style>
        {TRIDOKU_BOARD.map((row) =>
          row
            .filter((cell) => !cell.hidden)
            .map((cell) => {
              const gameCell = cells[cell.row]?.[cell.col]
              const isSelected = cell.id === selectedCellId
              const centroid = getTriangleCentroid(cell.row, cell.col, cell.direction)
              return (
                <g key={cell.id} className="cursor-pointer">
                  <polygon
                    points={getTrianglePoints(cell.row, cell.col, cell.direction)}
                    fill={CELL_FILLS[cell.color]}
                    stroke={isSelected ? "none" : "#000"}
                    strokeWidth={0.01}
                  />
                  {touching.has(cell.id) && (
                    <polygon
                      points={getTrianglePoints(cell.row, cell.col, cell.direction)}
                      fill={TOUCHING_FILL}
                      style={{ pointerEvents: "none" }}
                    />
                  )}
                  {showErrors && gameCell?.hasError && !isSelected && (
                    <polygon
                      points={getTrianglePoints(cell.row, cell.col, cell.direction)}
                      fill={ERROR_FILL}
                      style={{ pointerEvents: "none" }}
                    />
                  )}
                  {highlightedValue != null && gameCell?.value === highlightedValue && (
                    <polygon
                      points={getTrianglePoints(cell.row, cell.col, cell.direction)}
                      fill={HIGHLIGHTED_FILL}
                      style={{ pointerEvents: "none" }}
                    />
                  )}
                  {gameCell?.value != null ? (
                    <text
                      x={centroid.x}
                      y={centroid.y}
                      dy="0.05"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={0.85}
                      fontWeight={gameCell.isGiven ? "bold" : "normal"}
                      fill={showErrors && gameCell.hasError ? "#DC2626" : "#000"}
                      style={{ pointerEvents: "none", userSelect: "none" }}
                    >
                      {gameCell.value}
                    </text>
                  ) : (
                    // Render pencil marks if no value is set
                    gameCell?.pencilMarks && gameCell.pencilMarks.length > 0 && (
                      <>
                        {(() => {
                          const useCorners = gameCell.pencilMarks.length <= 3
                          const positions = useCorners
                            ? getPencilMarkCornerPositions(cell.row, cell.col, cell.direction)
                            : getPencilMarkPositions(cell.row, cell.col, cell.direction)
                          const fontSize = useCorners ? 0.62 : 0.32
                          return gameCell.pencilMarks.map((mark, idx) => {
                            const pos = positions[idx]
                            if (!pos) return null
                            return (
                              <text
                                key={mark}
                                x={pos.x}
                                y={pos.y}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fontSize={fontSize}
                                fontWeight="normal"
                                fill="#222"
                                style={{ pointerEvents: "none", userSelect: "none" }}
                              >
                                {mark}
                              </text>
                            )
                          })
                        })()}
                      </>
                    )
                  )}
                </g>
              )
            })
        )}
        {BOLD_EDGES.map((edge, i) => (
          <line
            key={`bold-${i}`}
            x1={edge.x1}
            y1={edge.y1}
            x2={edge.x2}
            y2={edge.y2}
            className="stroke-tridoku-region-stroke"
            strokeWidth={0.12}
            strokeLinecap="round"
          />
        ))}
        {/* Draw selected cell border on top of everything */}
        {selectedCellId && (() => {
          const selectedCell = TRIDOKU_BOARD.flat().find(cell => cell.id === selectedCellId && !cell.hidden)
          if (selectedCell) {
            return (
              <polygon
                points={getTrianglePoints(selectedCell.row, selectedCell.col, selectedCell.direction)}
                fill={SELECTED_FILL}
                stroke={SELECTED_STROKE}
                strokeWidth={0.15}
                strokeLinejoin="miter"
                strokeLinecap="butt"
                className="selected-cell"
                style={{ pointerEvents: "none" }}
              />
            )
          }
          return null
        })()}
      </svg>
    </div>
  )
}

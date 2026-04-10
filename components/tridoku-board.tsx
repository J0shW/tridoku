"use client"

import { Cell, CellId, Board, TRIDOKU_BOARD, Difficulty } from "@/lib/tridoku"

const ROW_HEIGHT = Math.sqrt(3)
const SVG_WIDTH = 18
const SVG_HEIGHT = 9 * ROW_HEIGHT
const STROKE_MARGIN = 0.15 // Extra margin to prevent stroke clipping

const EASY_FILL_COLORS: Record<Cell["color"], string> = {
  outer: "var(--tridoku-easy-outer)",
  inner: "var(--tridoku-easy-inner)",
  overlap: "var(--tridoku-easy-overlap)",
  none: "var(--tridoku-easy-none)",
}

const MEDIUM_FILL_COLORS: Record<Cell["color"], string> = {
  outer: "var(--tridoku-medium-outer)",
  inner: "var(--tridoku-medium-inner)",
  overlap: "var(--tridoku-medium-overlap)",
  none: "var(--tridoku-medium-none)",
}

const HARD_FILL_COLORS: Record<Cell["color"], string> = {
  outer: "var(--tridoku-hard-outer)",
  inner: "var(--tridoku-hard-inner)",
  overlap: "var(--tridoku-hard-overlap)",
  none: "var(--tridoku-hard-none)",
}

const SELECTED_FILL = "var(--tridoku-selected-fill)"
const SELECTED_STROKE = "var(--tridoku-selected-stroke)"
const ERROR_FILL = "rgba(239, 68, 68, 0.3)"

function getDifficultyBasedColor(color: Cell["color"], difficulty: Difficulty | null | undefined): string {
  if (!difficulty) return "var(--tridoku-easy-none)" // default to easy colors if difficulty is not provided
  switch (difficulty) {
    case "easy":
      return EASY_FILL_COLORS[color]
    case "medium":
      return MEDIUM_FILL_COLORS[color]
    case "hard":
      return HARD_FILL_COLORS[color]
    default:
      return "var(--tridoku-easy-none)"
  }
}

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

interface TridokuBoardProps {
  cells: Board
  selectedCellId: CellId | null
  onCellClick: (cellId: CellId) => void
  isPaused: boolean
  difficulty?: Difficulty | null
  highlightedValue?: number | null
}

const HIGHLIGHTED_FILL = "var(--tridoku-highlighted-fill)"

export function TridokuBoard({ cells, selectedCellId, onCellClick, isPaused, difficulty, highlightedValue }: TridokuBoardProps) {
  if (isPaused) {
    return (
      <div className="w-full flex items-center justify-center bg-secondary/50 rounded-xl py-20">
        <div className="text-center">
          <p className="text-2xl mb-2">Paused</p>
          <p className="text-muted-foreground">Click resume to continue</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <svg
        viewBox={`${-STROKE_MARGIN} ${-STROKE_MARGIN} ${SVG_WIDTH + STROKE_MARGIN * 2} ${SVG_HEIGHT + STROKE_MARGIN * 2}`}
        className="w-full h-auto p-2"
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
                <g key={cell.id} className="cursor-pointer" onClick={() => onCellClick(cell.id)}>
                  <polygon
                    points={getTrianglePoints(cell.row, cell.col, cell.direction)}
                    fill={getDifficultyBasedColor(cell.color, difficulty)}
                    stroke={isSelected ? "none" : "#000"}
                    strokeWidth={0.01}
                  />
                  {gameCell?.hasError && !isSelected && (
                    <polygon
                      points={getTrianglePoints(cell.row, cell.col, cell.direction)}
                      fill={ERROR_FILL}
                      style={{ pointerEvents: "none" }}
                    />
                  )}
                  {highlightedValue != null && gameCell?.value === highlightedValue && !isSelected && (
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
                      fill={gameCell.hasError ? "#DC2626" : "#000"}
                      style={{ pointerEvents: "none", userSelect: "none" }}
                    >
                      {gameCell.value}
                    </text>
                  ) : (
                    // Render pencil marks if no value is set
                    gameCell?.pencilMarks && gameCell.pencilMarks.length > 0 && (
                      <>
                        {gameCell.pencilMarks.map((mark, idx) => {
                          const positions = getPencilMarkPositions(cell.row, cell.col, cell.direction)
                          const pos = positions[idx]
                          if (!pos) return null
                          return (
                            <text
                              key={mark}
                              x={pos.x}
                              y={pos.y}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fontSize={0.32}
                              fontWeight="normal"
                              fill="#222"
                              style={{ pointerEvents: "none", userSelect: "none" }}
                            >
                              {mark}
                            </text>
                          )
                        })}
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

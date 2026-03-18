"use client"

import { Cell, CellId, TRIDOKU_BOARD } from "@/lib/tridoku"

const ROW_HEIGHT = Math.sqrt(3)
const SVG_WIDTH = 18
const SVG_HEIGHT = 9 * ROW_HEIGHT

const FILL_COLORS: Record<Cell["color"], string> = {
  yellow: "var(--tridoku-yellow)",
  blue: "var(--tridoku-blue)",
  green: "var(--tridoku-green)",
  white: "var(--tridoku-white)",
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

interface TridokuBoardProps {
  cells: Cell[]
  onCellClick: (cellId: CellId) => void
  isPaused: boolean
}

export function TridokuBoard({ cells, onCellClick, isPaused }: TridokuBoardProps) {
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
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="w-full h-auto"
      >
        {TRIDOKU_BOARD.map((row) =>
          row
            .filter((cell) => !cell.hidden)
            .map((cell) => (
              <polygon
                key={cell.id}
                points={getTrianglePoints(cell.row, cell.col, cell.direction)}
                fill={FILL_COLORS[cell.color]}
                stroke="#000"
                strokeWidth={0.04}
                className="cursor-pointer"
                onClick={() => onCellClick(cell.id)}
              />
            ))
        )}
      </svg>
    </div>
  )
}

"use client"

import { Cell } from "@/lib/tridoku"
import { useCallback, useMemo, useState } from "react"

interface TridokuBoardProps {
  cells: Cell[]
  onCellClick: (cellId: number) => void
  isPaused: boolean
}

// Triangle geometry constants
const SIDE = 50 // Base unit for triangle side length
const HEIGHT = SIDE * Math.sqrt(3) / 2 // Height of equilateral triangle

export function TridokuBoard({ cells, onCellClick, isPaused }: TridokuBoardProps) {
  const [hoveredCell, setHoveredCell] = useState<number | null>(null)

  // Calculate triangle positions
  const triangleData = useMemo(() => {
    const numRows = 9
    // Total width needed: bottom row has (2*numRows - 1) triangles
    // Each triangle takes SIDE/2 width except the first which takes SIDE
    const totalWidth = numRows * SIDE
    const totalHeight = numRows * HEIGHT

    return cells.map((cell) => {
      const row = cell.row
      const col = cell.col
      const isUpward = col % 2 === 0

      // Calculate x position
      // Row 0 has 1 triangle, row 1 has 3, row n has (2n+1)
      // Starting x for each row to center it
      const trianglesInRow = 2 * row + 1
      const rowWidth = trianglesInRow * (SIDE / 2)
      const startX = (totalWidth - rowWidth) / 2

      // Each triangle in the row is offset by SIDE/2
      const x = startX + col * (SIDE / 2)

      // Y position based on row
      const y = row * HEIGHT

      // Generate triangle points
      let points: string
      if (isUpward) {
        // Upward pointing triangle: top vertex, bottom-right, bottom-left
        const topX = x + SIDE / 2
        const topY = y
        const bottomLeftX = x
        const bottomLeftY = y + HEIGHT
        const bottomRightX = x + SIDE
        const bottomRightY = y + HEIGHT
        points = `${topX},${topY} ${bottomRightX},${bottomRightY} ${bottomLeftX},${bottomLeftY}`
      } else {
        // Downward pointing triangle: bottom vertex, top-left, top-right
        const bottomX = x + SIDE / 2
        const bottomY = y + HEIGHT
        const topLeftX = x
        const topLeftY = y
        const topRightX = x + SIDE
        const topRightY = y
        points = `${topLeftX},${topLeftY} ${topRightX},${topRightY} ${bottomX},${bottomY}`
      }

      // Calculate centroid for text placement
      const centroidX = x + SIDE / 2
      const centroidY = isUpward ? y + HEIGHT * 0.6 : y + HEIGHT * 0.4

      return {
        cell,
        points,
        centroidX,
        centroidY,
        isUpward,
      }
    })
  }, [cells])

  // Color functions - using explicit hex values for SVG compatibility
  const getBackgroundColor = useCallback((cell: Cell, isHovered: boolean) => {
    if (cell.hasError) return "#ef4444" // red-500
    if (cell.isSelected) return "#fcd34d" // amber-300
    if (isHovered) return "#fcd34d" // amber-300
    
    // Use color category for base coloring - explicit hex colors
    const colorMap = {
      'outer': '#d97706',      // dark orange (amber-600)
      'intersection': '#f59e0b', // medium orange (amber-500)
      'inner': '#fde047',      // light yellow (yellow-300)
      'white': '#ffffff',      // white
    }
    return colorMap[cell.colorCategory]
  }, [])

  const getTextColor = useCallback((cell: Cell) => {
    if (cell.hasError) return "#dc2626" // red-600
    if (cell.isGiven) return "#1f2937" // gray-800
    return "#3b82f6" // blue-500
  }, [])

  if (isPaused) {
    return (
      <div className="flex items-center justify-center w-full aspect-[1/0.866] bg-secondary/50 rounded-xl">
        <div className="text-center">
          <p className="text-2xl mb-2">Paused</p>
          <p className="text-muted-foreground">Click resume to continue</p>
        </div>
      </div>
    )
  }

  const numRows = 9
  const viewBoxWidth = numRows * SIDE
  const viewBoxHeight = numRows * HEIGHT

  return (
    <div className="w-full max-w-lg mx-auto select-none">
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        className="w-full h-auto"
        role="grid"
        aria-label="Tridoku puzzle grid"
      >
        {triangleData.map(({ cell, points, centroidX, centroidY }) => (
          <g key={cell.id} role="gridcell">
            {/* Triangle shape */}
            <polygon
              points={points}
              fill={getBackgroundColor(cell, hoveredCell === cell.id)}
              stroke="#e5e7eb"
              strokeWidth="1.5"
              className="cursor-pointer transition-colors duration-100"
              onClick={() => onCellClick(cell.id)}
              onMouseEnter={() => setHoveredCell(cell.id)}
              onMouseLeave={() => setHoveredCell(null)}
              aria-label={`Cell row ${cell.row + 1} column ${cell.col + 1}${cell.value ? ` value ${cell.value}` : " empty"}${cell.isGiven ? " given" : ""}`}
              aria-selected={cell.isSelected}
            />

            {/* Value text */}
            {cell.value && (
              <text
                x={centroidX}
                y={centroidY}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={getTextColor(cell)}
                fontSize="14"
                fontWeight="600"
                className="pointer-events-none select-none"
              >
                {cell.value}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  )
}

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

  // Calculate triangle positions and region boundaries
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
      let edges: Array<{x1: number, y1: number, x2: number, y2: number, side: 'left'|'right'|'base'}>
      
      if (isUpward) {
        // Upward pointing triangle: top vertex, bottom-right, bottom-left
        const topX = x + SIDE / 2
        const topY = y
        const bottomLeftX = x
        const bottomLeftY = y + HEIGHT
        const bottomRightX = x + SIDE
        const bottomRightY = y + HEIGHT
        points = `${topX},${topY} ${bottomRightX},${bottomRightY} ${bottomLeftX},${bottomLeftY}`
        
        edges = [
          { x1: topX, y1: topY, x2: bottomRightX, y2: bottomRightY, side: 'right' },
          { x1: bottomRightX, y1: bottomRightY, x2: bottomLeftX, y2: bottomLeftY, side: 'base' },
          { x1: bottomLeftX, y1: bottomLeftY, x2: topX, y2: topY, side: 'left' }
        ]
      } else {
        // Downward pointing triangle: bottom vertex, top-left, top-right
        const bottomX = x + SIDE / 2
        const bottomY = y + HEIGHT
        const topLeftX = x
        const topLeftY = y
        const topRightX = x + SIDE
        const topRightY = y
        points = `${topLeftX},${topLeftY} ${topRightX},${topRightY} ${bottomX},${bottomY}`
        
        edges = [
          { x1: topLeftX, y1: topLeftY, x2: topRightX, y2: topRightY, side: 'base' },
          { x1: topRightX, y1: topRightY, x2: bottomX, y2: bottomY, side: 'right' },
          { x1: bottomX, y1: bottomY, x2: topLeftX, y2: topLeftY, side: 'left' }
        ]
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
        edges,
      }
    })
  }, [cells])

  // Color functions - using explicit hex values for SVG compatibility
  const getBackgroundColor = useCallback((cell: Cell, isHovered: boolean) => {
    if (cell.hasError) return "#ef4444" // red-500
    if (cell.isSelected) return "#fde047" // yellow-300 (brighter when selected)
    if (isHovered) return "#fde047" // yellow-300
    
    // Use color category for base coloring - explicit hex colors matching reference
    const colorMap = {
      'yellow': '#fef08a',     // yellow-200 (pale yellow like reference)
      'blue': '#bfdbfe',       // blue-200 (light blue like reference)
      'green': '#bbf7d0',      // green-200 (light green for overlaps)
      'white': '#ffffff',      // white
    }
    return colorMap[cell.colorCategory]
  }, [])

  const getTextColor = useCallback((cell: Cell) => {
    if (cell.hasError) return "#dc2626" // red-600
    if (cell.isGiven) return "#1f2937" // gray-800
    return "#3b82f6" // blue-500
  }, [])

  // Helper to check if an edge is a region boundary
  const isRegionBoundary = useCallback((cell: Cell, neighborRow: number, neighborCol: number) => {
    if (neighborRow < 0 || neighborRow >= 9) return false
    const neighborIndex = neighborRow * neighborRow + neighborCol
    if (neighborIndex < 0 || neighborIndex >= cells.length) return false
    const neighbor = cells[neighborIndex]
    if (!neighbor) return false
    return cell.region !== neighbor.region
  }, [cells])

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
        {/* Draw triangles first */}
        {triangleData.map(({ cell, points, centroidX, centroidY }) => (
          <g key={cell.id} role="gridcell">
            {/* Triangle shape */}
            <polygon
              points={points}
              fill={getBackgroundColor(cell, hoveredCell === cell.id)}
              stroke="#d1d5db"
              strokeWidth="0.5"
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
        
        {/* Draw thick black borders */}
        {triangleData.map(({ cell, edges }) => {
          const row = cell.row
          const col = cell.col
          const isUpward = col % 2 === 0
          const colsInRow = 2 * row + 1
          
          return edges.map((edge, idx) => {
            let shouldDrawThick = false
            
            // 1. OUTER BORDER: Draw around entire board
            if (row === 8) {
              // Bottom row - draw base of all upward triangles
              if (isUpward && edge.side === 'base') shouldDrawThick = true
            }
            if (col === 0 && isUpward && edge.side === 'left') {
              // Leftmost edge
              shouldDrawThick = true
            }
            if (col === colsInRow - 1 && isUpward && edge.side === 'right') {
              // Rightmost edge
              shouldDrawThick = true
            }
            
            // 2. HORIZONTAL BORDER after row 2
            if (row === 2 && isUpward && edge.side === 'base') {
              shouldDrawThick = true
            }
            
            // 3. HORIZONTAL BORDER after row 5
            if (row === 5 && isUpward && edge.side === 'base') {
              shouldDrawThick = true
            }
            
            if (shouldDrawThick) {
              return (
                <line
                  key={`${cell.id}-border-${idx}`}
                  x1={edge.x1}
                  y1={edge.y1}
                  x2={edge.x2}
                  y2={edge.y2}
                  stroke="#000000"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="miter"
                  className="pointer-events-none"
                />
              )
            }
            return null
          })
        })}
      </svg>
    </div>
  )
}

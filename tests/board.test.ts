import { describe, expect, it } from "vitest"
import { createEmptyBoard, nearestCellId } from "@/lib/tridoku"

const cells = createEmptyBoard().flat().filter((c) => !c.hidden)
const EDGES = ["isOuterLeftEdge", "isOuterRightEdge", "isOuterBottomEdge", "isInnerLeftEdge", "isInnerRightEdge", "isInnerTopEdge"] as const

describe("board geometry", () => {
  it("has 81 playable cells", () => {
    expect(cells).toHaveLength(81)
  })

  it("has 9 regions of 9 cells", () => {
    for (let r = 0; r < 9; r++) expect(cells.filter((c) => c.boldedRegion === r)).toHaveLength(9)
  })

  it("has 6 edges of 9 cells", () => {
    for (const edge of EDGES) expect(cells.filter((c) => c[edge])).toHaveLength(9)
  })

  it("gives every cell between 3 and 12 touching neighbors", () => {
    for (const c of cells) {
      expect(c.neighbors.length).toBeGreaterThanOrEqual(3)
      expect(c.neighbors.length).toBeLessThanOrEqual(12)
    }
  })
})

describe("nearest-cell tapping (TRI-059)", () => {
  const h = Math.sqrt(3)
  it("picks the cell under a tap at its centre", () => {
    expect(nearestCellId(9, (2 * h) / 3)).toBe("0-8") // the top cell
    expect(nearestCellId(9, h + h / 3)).toBe("1-8") // the down cell below it
  })

  it("picks the obvious cell for a tap on a line or near a corner", () => {
    expect(nearestCellId(9, h - 0.02)).toBe("0-8") // just above the top cell's base line
    expect(nearestCellId(0.4, 9 * h - 0.1)).toBe("8-0") // bottom-left corner
  })

  it("accepts a tap just outside the board edge, but not far away", () => {
    expect(nearestCellId(9, 9 * h + 0.3)).toBe("8-8") // just below the bottom edge
    expect(nearestCellId(1, 1)).toBeNull() // empty top-left corner of the box
    expect(nearestCellId(9, 9 * h + 3)).toBeNull()
  })
})

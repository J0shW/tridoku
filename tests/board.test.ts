import { describe, expect, it } from "vitest"
import { createEmptyBoard } from "@/lib/tridoku"

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

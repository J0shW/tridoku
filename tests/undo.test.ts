// TRI-052: undo steps, the Undo button's label, and reading a saved history.
import { describe, expect, it } from "vitest"
import { createEmptyBoard, loadPuzzle } from "@/lib/tridoku"
import { describeUndo, parseUndoHistory, pushStep, UNDO_LIMIT, type UndoStep } from "@/lib/undo"

const step = (before: [number | null, number[]], after: [number | null, number[]], cellId = "4-4"): UndoStep => ({
  cellId,
  before: { value: before[0], pencilMarks: before[1] },
  after: { value: after[0], pencilMarks: after[1] },
})

describe("pushStep", () => {
  it("adds real changes and skips ones that changed nothing", () => {
    const h = pushStep([], step([null, []], [7, []]))
    expect(h).toHaveLength(1)
    expect(pushStep(h, step([7, [1, 2]], [7, [1, 2]]))).toBe(h)
  })

  it("keeps only the most recent steps", () => {
    let h: UndoStep[] = []
    for (let i = 0; i < UNDO_LIMIT + 5; i++) h = pushStep(h, step([null, []], [(i % 9) + 1, []]))
    expect(h).toHaveLength(UNDO_LIMIT)
    expect(h[h.length - 1].after.value).toBe(((UNDO_LIMIT + 4) % 9) + 1)
  })
})

describe("describeUndo", () => {
  it("says what the undo put back", () => {
    expect(describeUndo(step([null, []], [7, []]))).toBe("Removed 7")
    expect(describeUndo(step([3, []], [7, []]))).toBe("Back to 3")
    expect(describeUndo(step([3, [1]], [null, [1]]))).toBe("Restored 3")
    expect(describeUndo(step([null, [1]], [null, [1, 4]]))).toBe("Pencil 4 off")
    expect(describeUndo(step([null, [1, 4]], [null, [1]]))).toBe("Pencil 4 back")
    expect(describeUndo(step([null, [1, 4, 6]], [null, []]))).toBe("Notes back")
  })
})

describe("parseUndoHistory", () => {
  // The board is 9 rows by 17 columns; the top cell is 0-8 and is a given 5 here
  const cells = loadPuzzle("5" + "0".repeat(80))

  it("keeps well-formed steps for cells the player can change", () => {
    const saved = [step([null, []], [7, []], "1-7"), step([null, []], [2, [3]], "8-16")]
    expect(parseUndoHistory(saved, cells)).toEqual(saved)
  })

  it("drops malformed steps, givens and unknown cells", () => {
    const saved = [
      step([null, []], [7, []], "0-8"), // given
      step([null, []], [7, []], "0-5"), // hidden
      step([null, []], [7, []], "9-9"), // off the board
      { cellId: "1-7", before: { value: 12, pencilMarks: [] }, after: { value: null, pencilMarks: [] } },
      { cellId: "1-7", before: { value: null }, after: { value: 3, pencilMarks: [] } },
      "nonsense",
      null,
    ]
    expect(parseUndoHistory(saved, cells)).toEqual([])
    expect(parseUndoHistory(undefined, createEmptyBoard())).toEqual([])
    expect(parseUndoHistory({ length: 2 }, createEmptyBoard())).toEqual([])
  })
})

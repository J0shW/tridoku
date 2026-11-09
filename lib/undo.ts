// Undo history for the game (TRI-052). Each step records one cell before and after a
// change: a digit entered, overwritten or cleared, or a pencil mark added or removed.
// Undo puts the cell back to its "before" state. The history is saved with the
// puzzle's progress so it survives a reload.

import type { Cell, CellId } from "@/lib/tridoku"

export interface CellSnapshot {
  value: number | null
  pencilMarks: number[]
}

export interface UndoStep {
  cellId: CellId
  before: CellSnapshot
  after: CellSnapshot
}

/** Steps kept per puzzle. A full solve is roughly 50–100 steps. */
export const UNDO_LIMIT = 200

export function snapshot(cell: Pick<Cell, "value" | "pencilMarks">): CellSnapshot {
  return { value: cell.value, pencilMarks: [...(cell.pencilMarks ?? [])] }
}

function sameMarks(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((m, i) => m === b[i])
}

/** Adds a step, skipping changes that changed nothing and dropping the oldest past the limit. */
export function pushStep(history: UndoStep[], step: UndoStep): UndoStep[] {
  const { before, after } = step
  if (before.value === after.value && sameMarks(before.pencilMarks, after.pencilMarks)) return history
  return [...history, step].slice(-UNDO_LIMIT)
}

/** Short text for the Undo button saying what the undo put back, e.g. "Removed 7". */
export function describeUndo({ before, after }: UndoStep): string {
  if (before.value !== after.value) {
    if (before.value == null) return `Removed ${after.value}`
    if (after.value == null) return `Restored ${before.value}`
    return `Back to ${before.value}`
  }
  const added = after.pencilMarks.filter((m) => !before.pencilMarks.includes(m))
  const removed = before.pencilMarks.filter((m) => !after.pencilMarks.includes(m))
  if (added.length === 1 && removed.length === 0) return `Pencil ${added[0]} off`
  if (removed.length === 1 && added.length === 0) return `Pencil ${removed[0]} back`
  return "Notes back"
}

const isDigit = (n: unknown): n is number => Number.isInteger(n) && (n as number) >= 1 && (n as number) <= 9

function parseSnapshot(raw: unknown): CellSnapshot | null {
  if (!raw || typeof raw !== "object") return null
  const { value, pencilMarks } = raw as Record<string, unknown>
  if (value !== null && !isDigit(value)) return null
  if (!Array.isArray(pencilMarks) || !pencilMarks.every(isDigit)) return null
  return { value, pencilMarks: [...pencilMarks] }
}

/**
 * Reads a saved history, keeping only well-formed steps for cells the player can change
 * on this board. Anything malformed is dropped rather than failing the load.
 */
export function parseUndoHistory(raw: unknown, cells: Cell[][]): UndoStep[] {
  if (!Array.isArray(raw)) return []
  const steps: UndoStep[] = []
  for (const item of raw) {
    if (!item || typeof item !== "object") continue
    const { cellId, before, after } = item as Record<string, unknown>
    if (typeof cellId !== "string" || !/^\d+-\d+$/.test(cellId)) continue
    const [row, col] = cellId.split("-").map(Number)
    const cell = cells[row]?.[col]
    if (!cell || cell.hidden || cell.isGiven) continue
    const b = parseSnapshot(before)
    const a = parseSnapshot(after)
    if (b && a) steps.push({ cellId: cellId as CellId, before: b, after: a })
  }
  return steps.slice(-UNDO_LIMIT)
}

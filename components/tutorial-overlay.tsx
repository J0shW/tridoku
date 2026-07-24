"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  MousePointerClick,
  Sparkles,
} from "lucide-react"
import {
  TRIDOKU_BOARD,
  loadPuzzle,
  solvePuzzle,
  validateBoard,
  getArrowTarget,
  TEST_NEARLY_SOLVED,
  type Board,
  type CellId,
} from "@/lib/tridoku"
import { TridokuBoard } from "@/components/tridoku-board"
import { NumberPad } from "@/components/number-pad"
import { InputModeToggle } from "@/components/input-mode-toggle"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// ─── Build a complete, valid solution from the existing test puzzle ────────────
// This gives every tutorial step a real board where each blank has a unique answer.
const SOLUTION: Board = (() => {
  const partial = loadPuzzle(TEST_NEARLY_SOLVED)
  const solved = solvePuzzle(partial)
  if (!solved) {
    console.log("[v0] Tutorial: failed to solve base puzzle, using partial")
    return partial
  }
  return solved
})()

function solVal(id: CellId): number {
  const [r, c] = id.split("-").map(Number)
  return SOLUTION[r][c].value ?? 0
}

function idsWhere(predicate: (c: (typeof TRIDOKU_BOARD)[number][number]) => boolean): CellId[] {
  return TRIDOKU_BOARD.flat()
    .filter((c) => !c.hidden && predicate(c))
    .map((c) => c.id)
}

// Spotlight groups derived from the real board metadata
const REGION0_IDS = idsWhere((c) => c.boldedRegion === 0)
const OUTER_LEFT_IDS = idsWhere((c) => c.isOuterLeftEdge)
const INNER_TOP_IDS = idsWhere((c) => c.isInnerTopEdge)

// Target cells for the interactive challenges
const REGION_TARGET: CellId = "2-8" // inside the top region
const OUTER_TARGET: CellId = "5-3" // on the left outer edge
const INNER_TARGET: CellId = "4-8" // on the inner triangle's top edge
const ADJ_TARGET: CellId = "6-8" // cell we deliberately break

// A neighbor of the adjacency target — copying its value creates a "touching" conflict
const ADJ_NEIGHBOR: CellId = (() => {
  const [r, c] = ADJ_TARGET.split("-").map(Number)
  const neighbors = TRIDOKU_BOARD[r][c].neighbors
  // pick a neighbor whose solution value differs (always true in a valid grid)
  return neighbors.find((nid) => solVal(nid) !== solVal(ADJ_TARGET)) ?? neighbors[0]
})()
const ADJ_WRONG_VALUE = solVal(ADJ_NEIGHBOR)

// ─── Step definitions ──────────────────────────────────────────────────────────

type StepKind = "info" | "select" | "fill" | "fix"

interface TutorialStep {
  kind: StepKind
  title: string
  subtitle: string
  bubble: React.ReactNode
  successText?: string
  emptyIds?: CellId[]
  wrong?: { id: CellId; value: number }
  selectId?: CellId
  highlightIds?: CellId[]
  highlightValue?: number
  showPad?: boolean
  showInputToggle?: boolean
}

// Digit used by the "highlight a digit" demo step
const HIGHLIGHT_DEMO_VALUE = 5

const STEPS: TutorialStep[] = [
  {
    kind: "info",
    title: "Welcome to Tridoku",
    subtitle: "Let's learn by playing",
    bubble: (
      <>
        Tridoku is Sudoku with <strong className="text-foreground">triangles</strong>. Instead of
        reading about the rules, you&apos;ll fill in real cells on a real board. Tap{" "}
        <strong className="text-foreground">Next</strong> to begin.
      </>
    ),
  },
  {
    kind: "select",
    title: "Selecting a Cell",
    subtitle: "Click, tap, or use arrow keys",
    bubble: (
      <>
        Everything starts with picking a cell. Go ahead and{" "}
        <strong className="text-foreground">select the glowing triangle</strong> — click it, tap it,
        or move to it with the arrow keys.
      </>
    ),
    successText: "Nice — that cell is now selected.",
    selectId: INNER_TARGET,
    highlightIds: [INNER_TARGET],
  },
  {
    kind: "fill",
    title: "Rule 1: Regions",
    subtitle: "Each bold region holds 1–9",
    bubble: (
      <>
        Every <strong className="text-foreground">bold-outlined region</strong> contains the digits
        1 through 9 exactly once. This region is missing just one number — figure out which digit is
        absent and fill the empty cell.
      </>
    ),
    successText: "That's it! The region now has all of 1–9.",
    emptyIds: [REGION_TARGET],
    highlightIds: REGION0_IDS,
    showPad: true,
  },
  {
    kind: "fill",
    title: "Rule 2: Outer Edges",
    subtitle: "The three big sides hold 1–9",
    bubble: (
      <>
        Each of the triangle&apos;s <strong className="text-foreground">three outer sides</strong>{" "}
        must also contain 1 through 9. The highlighted left edge is missing one digit — complete it.
      </>
    ),
    successText: "Perfect — the outer edge is complete.",
    emptyIds: [OUTER_TARGET],
    highlightIds: OUTER_LEFT_IDS,
    showPad: true,
  },
  {
    kind: "fill",
    title: "Rule 3: Inner Triangle",
    subtitle: "The inverted triangle's edges hold 1–9",
    bubble: (
      <>
        There&apos;s an <strong className="text-foreground">inner (upside-down) triangle</strong> in
        the middle, and each of its edges also needs 1 through 9. Fill the last empty cell along its
        highlighted top edge.
      </>
    ),
    successText: "Great — the inner edge is complete.",
    emptyIds: [INNER_TARGET],
    highlightIds: INNER_TOP_IDS,
    showPad: true,
  },
  {
    kind: "fix",
    title: "Rule 4: No Touching",
    subtitle: "Keep matching digits apart",
    bubble: (
      <>
        Identical digits <strong className="text-foreground">cannot touch</strong> — not even at a
        single corner. The two highlighted cells share the same number, so they&apos;re flagged in
        red. Select the wrong cell and change it to the digit that fits without touching a match.
      </>
    ),
    successText: "Fixed! No two matching digits touch anymore.",
    wrong: { id: ADJ_TARGET, value: ADJ_WRONG_VALUE },
    highlightIds: [ADJ_TARGET, ADJ_NEIGHBOR],
    showPad: true,
  },
  {
    kind: "info",
    title: "Pen & Pencil",
    subtitle: "Final answers vs. candidate notes",
    bubble: (
      <>
        Use <strong className="text-foreground">Pen</strong> for final answers and{" "}
        <strong className="text-foreground">Pencil</strong> to jot small candidate notes when
        you&apos;re unsure. Tap the toggle any time to switch modes.
      </>
    ),
    showInputToggle: true,
  },
  {
    kind: "info",
    title: "Highlight a Digit",
    subtitle: "Spot matching numbers instantly",
    bubble: (
      <>
        Double-tap a filled cell to <strong className="text-foreground">highlight every matching
        digit</strong>. Here we&apos;ve highlighted every{" "}
        <strong className="text-foreground">{HIGHLIGHT_DEMO_VALUE}</strong> so you can see where it
        already lives.
      </>
    ),
    highlightValue: HIGHLIGHT_DEMO_VALUE,
  },
  {
    kind: "info",
    title: "Show Errors",
    subtitle: "Flag rule-breaking digits",
    bubble: (
      <>
        Stuck? The <strong className="text-foreground">Show Errors</strong> toggle flags any digit
        that breaks a rule. The red cells below show what a conflict looks like.
      </>
    ),
    wrong: { id: ADJ_TARGET, value: ADJ_WRONG_VALUE },
    highlightIds: [ADJ_TARGET, ADJ_NEIGHBOR],
  },
  {
    kind: "info",
    title: "Power Cells",
    subtitle: "Eliminate candidates fast",
    bubble: (
      <>
        A single digit just outside a region can, via the no-touching rule, rule out many cells at
        once — often leaving only one spot for a number. Hunting for these{" "}
        <strong className="text-foreground">power cells</strong> is the key to harder puzzles.
      </>
    ),
  },
  {
    kind: "info",
    title: "You're ready!",
    subtitle: "Go solve today's puzzle",
    bubble: (
      <>
        That&apos;s every rule: <strong className="text-foreground">regions</strong>,{" "}
        <strong className="text-foreground">outer edges</strong>,{" "}
        <strong className="text-foreground">inner edges</strong>, and{" "}
        <strong className="text-foreground">no touching</strong>. A fresh puzzle drops every day at
        midnight. Good luck!
      </>
    ),
  },
]

// ─── Board construction per step ────────────────────────────────────────────────

function cloneBoard(b: Board): Board {
  return b.map((row) =>
    row.map((cell) => ({ ...cell, pencilMarks: [], isSelected: false, hasError: false }))
  )
}

function buildStepBoard(step: TutorialStep): Board {
  const b = cloneBoard(SOLUTION)
  // Treat every filled cell as a locked "given"
  for (const row of b) {
    for (const cell of row) {
      if (cell.hidden) continue
      cell.isGiven = true
    }
  }
  // Carve out the empty target(s)
  for (const id of step.emptyIds ?? []) {
    const [r, c] = id.split("-").map(Number)
    b[r][c] = { ...b[r][c], value: null, isGiven: false }
  }
  // Place a deliberately wrong value (adjacency / show-errors demos)
  if (step.wrong) {
    const [r, c] = step.wrong.id.split("-").map(Number)
    b[r][c] = { ...b[r][c], value: step.wrong.value, isGiven: false }
  }
  return validateBoard(b)
}

function hasAnyError(board: Board): boolean {
  for (const row of board) {
    for (const cell of row) {
      if (!cell.hidden && cell.hasError) return true
    }
  }
  return false
}

// ─── Component ───────────────────────────────────────────────────────────────

interface TutorialOverlayProps {
  open: boolean
  onClose: () => void
}

export function TutorialOverlay({ open, onClose }: TutorialOverlayProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const [board, setBoard] = useState<Board>(() => buildStepBoard(STEPS[0]))
  const [selectedCellId, setSelectedCellId] = useState<CellId | null>(null)

  const step = STEPS[stepIndex]
  const isFirst = stepIndex === 0
  const isLast = stepIndex === STEPS.length - 1

  const highlightSet = useMemo(
    () => (step.highlightIds ? new Set(step.highlightIds) : undefined),
    [step],
  )

  // (Re)build the board whenever the step changes
  const loadStep = useCallback((index: number) => {
    const s = STEPS[index]
    setBoard(buildStepBoard(s))
    if (s.kind === "fill" && s.emptyIds?.length) {
      setSelectedCellId(s.emptyIds[0])
    } else if (s.kind === "fix" && s.wrong) {
      setSelectedCellId(s.wrong.id)
    } else {
      setSelectedCellId(null)
    }
  }, [])

  // Reset to the beginning each time the tutorial opens
  useEffect(() => {
    if (open) {
      setStepIndex(0)
      loadStep(0)
    }
  }, [open, loadStep])

  const goToStep = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(STEPS.length - 1, index))
      setStepIndex(clamped)
      loadStep(clamped)
    },
    [loadStep],
  )

  // Is the current interactive step satisfied?
  const complete = useMemo(() => {
    if (step.kind === "info") return true
    if (step.kind === "select") return selectedCellId === step.selectId
    // fill / fix: all targets filled and no rule violations remain
    const targets = [...(step.emptyIds ?? []), ...(step.wrong ? [step.wrong.id] : [])]
    for (const id of targets) {
      const [r, c] = id.split("-").map(Number)
      if (board[r][c].value == null) return false
    }
    return !hasAnyError(board)
  }, [step, selectedCellId, board])

  const handleSelect = useCallback((id: CellId) => {
    setSelectedCellId(id)
  }, [])

  const handleNumber = useCallback(
    (num: number) => {
      if (!selectedCellId) return
      const [r, c] = selectedCellId.split("-").map(Number)
      const cell = board[r][c]
      if (cell.hidden || cell.isGiven) return
      const next = board.map((row) => row.map((cc) => ({ ...cc })))
      next[r][c].value = num
      setBoard(validateBoard(next))
    },
    [board, selectedCellId],
  )

  const handleClear = useCallback(() => {
    if (!selectedCellId) return
    const [r, c] = selectedCellId.split("-").map(Number)
    const cell = board[r][c]
    if (cell.hidden || cell.isGiven) return
    const next = board.map((row) => row.map((cc) => ({ ...cc })))
    next[r][c].value = null
    setBoard(validateBoard(next))
  }, [board, selectedCellId])

  // Keyboard support inside the tutorial
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (key === "escape") {
        onClose()
        return
      }
      if (step.showPad && e.key >= "1" && e.key <= "9") {
        handleNumber(parseInt(e.key))
        return
      }
      if (step.showPad && (key === "delete" || key === "backspace")) {
        handleClear()
        return
      }
      if (
        selectedCellId &&
        (key === "arrowup" || key === "arrowdown" || key === "arrowleft" || key === "arrowright")
      ) {
        e.preventDefault()
        const dir =
          key === "arrowup" ? "up" : key === "arrowdown" ? "down" : key === "arrowleft" ? "left" : "right"
        const target = getArrowTarget(TRIDOKU_BOARD, selectedCellId, dir)
        if (target) setSelectedCellId(target)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, step, selectedCellId, handleNumber, handleClear, onClose])

  if (!open) return null

  const padDisabled =
    selectedCellId == null ||
    (() => {
      const [r, c] = selectedCellId.split("-").map(Number)
      return board[r][c].isGiven || board[r][c].hidden
    })()

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-lg font-bold text-foreground leading-tight">Interactive Tutorial</h2>
              <p className="text-xs text-muted-foreground">
                Step {stepIndex + 1} of {STEPS.length}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close tutorial">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 overflow-y-auto">
        <div className="container max-w-md mx-auto px-4 py-5 flex flex-col gap-4">
          {/* Instruction bubble */}
          <div className="relative rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
            <h3 className="text-base font-bold text-foreground text-balance">{step.title}</h3>
            <p className="text-xs text-muted-foreground mb-1.5">{step.subtitle}</p>
            <p className="text-sm text-muted-foreground leading-relaxed text-pretty">{step.bubble}</p>
          </div>

          {/* Success / feedback banner */}
          {step.kind !== "info" && (
            <div
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                complete
                  ? "border-primary/40 bg-primary/10 text-foreground"
                  : "border-border bg-muted/40 text-muted-foreground",
              )}
              aria-live="polite"
            >
              {complete ? (
                <>
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  <span>{step.successText ?? "Correct!"}</span>
                </>
              ) : (
                <>
                  <MousePointerClick className="h-4 w-4 shrink-0" />
                  <span>
                    {step.kind === "select"
                      ? "Waiting for you to select the highlighted cell…"
                      : "Fill the highlighted area to continue."}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Board */}
          <div className="w-full">
            <TridokuBoard
              cells={board}
              selectedCellId={selectedCellId}
              onCellClick={handleSelect}
              isPaused={false}
              difficulty="easy"
              highlightedValue={step.highlightValue ?? null}
              highlightedCellIds={highlightSet}
              showErrors
            />
          </div>

          {/* Pen/Pencil demo toggle */}
          {step.showInputToggle && (
            <div className="flex justify-center" aria-hidden="true">
              <div className="pointer-events-none">
                <InputModeToggle mode="pen" onModeChange={() => {}} />
              </div>
            </div>
          )}

          {/* Number pad for interactive steps */}
          {step.showPad && (
            <NumberPad onNumberClick={handleNumber} onClear={handleClear} disabled={padDisabled} />
          )}
        </div>
      </main>

      {/* Footer nav */}
      <footer className="border-t border-border">
        <div className="container max-w-md mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            onClick={() => goToStep(stepIndex - 1)}
            disabled={isFirst}
            className={cn(isFirst && "invisible")}
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>

          <div className="flex items-center gap-1.5" aria-hidden="true">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === stepIndex ? "w-5 bg-primary" : "w-2 bg-border",
                )}
              />
            ))}
          </div>

          {isLast ? (
            <Button onClick={onClose}>Finish</Button>
          ) : (
            <Button onClick={() => goToStep(stepIndex + 1)} disabled={!complete}>
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </footer>
    </div>
  )
}

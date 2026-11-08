"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, MousePointerClick, Hand, ArrowUpDown, Eye } from "lucide-react"
import { TRIDOKU_BOARD } from "@/lib/tridoku"
import { ROW_H, triPts, centroid, ExampleBox, RegionExample, OuterEdgesExample, InnerTriangleExample, NoTouchingExample, PowerCellExample } from "@/components/rule-diagrams"
import { Button } from "@/components/ui/button"
import { InputModeToggle } from "@/components/input-mode-toggle"
import { cn } from "@/lib/utils"
import { trackEvent } from "@/lib/analytics"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface RulesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Tab and card to open at (default: the first rule) */
  initialTab?: "rules" | "tips"
  initialStep?: number
  /** First visit: the last rules card says "Start playing" */
  firstTime?: boolean
}

// ─── Step content ────────────────────────────────────────────────────────────

function SelectCellStep() {
  const methods = [
    { icon: MousePointerClick, label: "Click", desc: "Click a cell with your mouse" },
    { icon: Hand, label: "Tap", desc: "Tap a cell on a touchscreen" },
    { icon: ArrowUpDown, label: "Arrow keys", desc: "Move the selection with your keyboard" },
  ]
  return (
    <div>
      <p className="text-muted-foreground leading-relaxed text-center text-pretty">
        First things first — you need to pick a cell to fill in. There are three ways to select one:
      </p>
      <ul className="mt-4 space-y-3">
        {methods.map(({ icon: Icon, label, desc }) => (
          <li key={label} className="flex items-center gap-3 rounded-md bg-muted/40 border border-border/60 p-3">
            <span className="shrink-0 w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Icon className="w-5 h-5" />
            </span>
            <div className="flex-1">
              <p className="font-semibold text-foreground text-sm">{label}</p>
              <p className="text-sm text-muted-foreground leading-snug">{desc}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted-foreground leading-relaxed mt-4 text-center text-pretty">
        Once a cell is selected, type a number or use the number pad to fill it in.
      </p>
    </div>
  )
}

function RuleStep({
  example,
  children,
}: {
  example: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="text-muted-foreground leading-relaxed text-center text-pretty">{children}</p>
      <div className="flex justify-center">{example}</div>
    </div>
  )
}

// ─── Tip: highlight matching cells ─────────────────────────────────────────────

function HighlightExample() {
  const visibleCells = TRIDOKU_BOARD.slice(0, 5).flat().filter((c) => !c.hidden)
  const highlightValue = 5

  const given: Record<string, number> = {
    "0-8": 5,
    "1-7": 2,
    "1-9": 5,
    "2-6": 1,
    "2-8": 3,
    "2-10": 5,
    "3-8": 8,
  }

  return (
    <ExampleBox caption="Double-tapping a 5 highlights every other 5 on the board">
      <svg
        viewBox={`3.7 -0.3 10.6 ${5 * ROW_H + 0.6}`}
        className="w-full max-w-48 mx-auto block"
        aria-hidden="true"
      >
        {visibleCells.map((cell) => {
          const c = centroid(cell.row, cell.col, cell.direction)
          const val = given[cell.id]
          const isHighlighted = val === highlightValue
          return (
            <g key={cell.id}>
              <polygon
                points={triPts(cell.row, cell.col, cell.direction)}
                fill={isHighlighted ? "var(--tridoku-highlighted-fill)" : "#e4e3d3"}
                stroke="#aaa"
                strokeWidth="0.05"
              />
              {val !== undefined && (
                <text
                  x={c.x}
                  y={c.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="0.72"
                  fontWeight="700"
                  fill={isHighlighted ? "#fff" : "#1a1a1a"}
                >
                  {val}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </ExampleBox>
  )
}

// ─── Tip steps ─────────────────────────────────────────────────────────────────

function PenPencilStep() {
  return (
    <div>
      <p className="text-muted-foreground leading-relaxed text-center text-pretty">
        Switch between two ways of entering digits:
      </p>
      <div className="mt-4 flex justify-center" aria-hidden="true">
        <div className="pointer-events-none">
          <InputModeToggle mode="pen" onModeChange={() => {}} />
        </div>
      </div>
      <ul className="mt-4 space-y-2 text-muted-foreground">
        <li className="flex items-start gap-2">
          <span className="text-accent">•</span>
          <span>
            <strong className="text-foreground">Pen:</strong> Place your final answer in a cell.
          </span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-accent">•</span>
          <span>
            <strong className="text-foreground">Pencil:</strong> Jot down small candidate notes when
            you&apos;re not sure yet.
          </span>
        </li>
      </ul>
      <p className="text-sm text-muted-foreground leading-relaxed mt-4 text-center text-pretty">
        Tap the Pen / Pencil toggle to change modes at any time.
      </p>
    </div>
  )
}

function HighlightStep() {
  return (
    <div>
      <p className="text-muted-foreground leading-relaxed text-center text-pretty">
        Double-tap (or double-click) a filled cell to highlight every other cell holding the same
        digit. It&apos;s a quick way to spot where a number already lives and where it still needs to go.
      </p>
      <div className="flex justify-center">
        <HighlightExample />
      </div>
    </div>
  )
}

function ShowErrorsStep() {
  return (
    <div>
      <p className="text-muted-foreground leading-relaxed text-center text-pretty">
        Stuck or want to double-check your work? Toggle the{" "}
        <strong className="text-foreground">Show Errors</strong> button to flag any digits that break a
        rule.
      </p>
      <div className="mt-4 flex flex-col items-center gap-2">
        <span className="w-12 h-12 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
          <Eye className="w-5 h-5" />
        </span>
        <span className="text-xs text-muted-foreground">Show Errors toggle</span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed mt-4 text-center text-pretty">
        Conflicting cells turn red so you can quickly track down mistakes.
      </p>
    </div>
  )
}

function PowerCellsStep() {
  return (
    <div>
      <p className="text-muted-foreground leading-relaxed text-center text-pretty">
        A single cell just outside a region can eliminate many candidates at once via the no-touching
        rule — often leaving only one valid cell in the region for that digit.
      </p>
      <div className="flex justify-center">
        <PowerCellExample />
      </div>
      <p className="text-sm text-muted-foreground text-center border-t border-border pt-4 mt-5">
        A new puzzle is available every day at midnight. Good luck!
      </p>
    </div>
  )
}

// ─── Modal ─────────────────────────────────────────────────────────────────────

interface Step {
  title: string
  subtitle: string
  content: React.ReactNode
}

// TRI-029: the rules fit in three cards; everything else is a tip.
const RULE_STEPS: Step[] = [
  {
    title: "Rule 1: Regions",
    subtitle: "Sudoku on a triangle",
    content: (
      <RuleStep example={<RegionExample />}>
        Fill every triangle with a digit from 1 to 9. Each bold-outlined region holds 1 to 9
        exactly once.
      </RuleStep>
    ),
  },
  {
    title: "Rule 2: Edges",
    subtitle: "The big triangle and the one inside it",
    content: (
      <div>
        <p className="text-muted-foreground leading-relaxed text-center text-pretty">
          Each of the three outer sides holds 1 to 9 once, and so does each side of the
          upside-down triangle in the middle.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <OuterEdgesExample />
          <InnerTriangleExample />
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mt-3 text-center text-pretty">
          On the board, <strong className="text-foreground">blue</strong> cells are on an outer side,{" "}
          <strong className="text-foreground">yellow</strong> cells on the inner triangle, and{" "}
          <strong className="text-foreground">green</strong> cells on both.
        </p>
      </div>
    ),
  },
  {
    title: "Rule 3: No Touching",
    subtitle: "The rule Sudoku doesn't have",
    content: (
      <RuleStep example={<NoTouchingExample />}>
        The same digit can never touch itself, not even at a single corner point.
      </RuleStep>
    ),
  },
]

const TIP_STEPS: Step[] = [
  { title: "Selecting a Cell", subtitle: "Click, tap, or use the arrow keys", content: <SelectCellStep /> },
  { title: "Pen & Pencil", subtitle: "Final answers vs. candidate notes", content: <PenPencilStep /> },
  { title: "Highlight a Digit", subtitle: "Double-tap to see matching cells", content: <HighlightStep /> },
  { title: "Show Errors", subtitle: "Flag rule-breaking digits", content: <ShowErrorsStep /> },
  { title: "Power Cells", subtitle: "Eliminate candidates fast", content: <PowerCellsStep /> },
]

export type RulesTab = "rules" | "tips"
export const POWER_CELLS_TIP_INDEX = TIP_STEPS.length - 1

export function RulesModal({ open, onOpenChange, initialTab = "rules", initialStep = 0, firstTime = false }: RulesModalProps) {
  const [tab, setTab] = useState<RulesTab>(initialTab)
  const [step, setStep] = useState(initialStep)

  // Start at the requested card whenever the modal is (re)opened
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setTab(initialTab)
      setStep(initialStep)
    }
  }

  const steps = tab === "rules" ? RULE_STEPS : TIP_STEPS

  // Track how far players get through the rules (TRI-019)
  const goTo = (next: number) => {
    const n = Math.max(0, Math.min(steps.length - 1, next))
    if (n === step) return
    setStep(n)
    trackEvent("rules_step", { tab, n: n + 1, of: steps.length })
    if (tab === "rules" && n === steps.length - 1) trackEvent("rules_completed")
  }

  const switchTab = (next: RulesTab) => {
    if (next === tab) return
    setTab(next)
    setStep(0)
    trackEvent("rules_tab", { tab: next })
  }

  const isFirst = step === 0
  const isLast = step === steps.length - 1
  const current = steps[step]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border space-y-3">
          <div className="mx-auto inline-flex rounded-lg border border-border bg-muted p-1 gap-1" role="tablist" aria-label="How to play">
            {(["rules", "tips"] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => switchTab(t)}
                className={cn(
                  "px-3 py-1 text-sm font-medium rounded-md transition-all",
                  tab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t === "rules" ? "Rules" : "Tips"}
              </button>
            ))}
          </div>
          <DialogTitle className="text-center text-2xl font-bold text-balance">{current.title}</DialogTitle>
          <DialogDescription className="text-center">{current.subtitle}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 min-h-[18rem]">{current.content}</div>

        <div className="flex items-center justify-between gap-4 border-t border-border px-6 py-4">
          <Button
            variant="ghost"
            onClick={() => goTo(step - 1)}
            disabled={isFirst}
            className={cn(isFirst && "invisible")}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>

          <div className="flex items-center gap-1.5" aria-hidden="true">
            {steps.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to step ${i + 1}`}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === step ? "w-5 bg-primary" : "w-2 bg-border hover:bg-muted-foreground/50",
                )}
              />
            ))}
          </div>

          {isLast ? (
            <Button onClick={() => onOpenChange(false)}>{firstTime && tab === "rules" ? "Start playing" : "Got it!"}</Button>
          ) : (
            <Button onClick={() => goTo(step + 1)}>
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
        {tab === "rules" && (
          <p className="pb-3 -mt-1 text-center text-xs text-muted-foreground">
            Tridoku was created by Japheth J. Light.
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}

"use client"

// The controls that sit in the empty top corners beside the board (TRI-087):
// the timer, which pauses when tapped, and Undo under it on the left (TRI-052);
// Check and a "More" menu holding Reset on the right.

import { useEffect, useRef, useState } from "react"
import { Check, Clock, MoreHorizontal, Pause, Play, RotateCcw, Undo2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatTime } from "@/lib/tridoku"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const PILL =
  "inline-flex h-9 items-center rounded-full border border-border bg-secondary text-foreground transition-colors hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"

interface TimerButtonProps {
  seconds: number
  isPaused: boolean
  onTogglePause: () => void
  /** Finished or viewing a solved puzzle: show the time without a pause control. */
  disabled?: boolean
}

/** The running time; tapping it pauses and resumes the game. */
export function TimerButton({ seconds, isPaused, onTogglePause, disabled }: TimerButtonProps) {
  const time = formatTime(seconds)
  if (disabled) {
    return (
      <div className={cn(PILL, "gap-1.5 pl-2.5 pr-3 hover:bg-secondary")} role="timer" aria-label={`Time: ${time}`}>
        <Clock className="h-4 w-4" aria-hidden="true" />
        <span className="font-mono text-[17px] tabular-nums">{time}</span>
      </div>
    )
  }
  return (
    <button
      type="button"
      onClick={onTogglePause}
      className={cn(PILL, "gap-1.5 pl-2.5 pr-3")}
      aria-label={isPaused ? `Resume, time ${time}` : `Pause, time ${time}`}
    >
      {isPaused ? (
        <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
      ) : (
        <Pause className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
      )}
      <span className={cn("font-mono text-[17px] tabular-nums", isPaused && "text-muted-foreground")}>{time}</span>
    </button>
  )
}

/** How long the Undo button shows what it put back before reading "Undo" again. */
const UNDO_LABEL_MS = 2000

interface UndoButtonProps {
  canUndo: boolean
  onUndo: () => void
  /** The last undo; while recent, the button says what it put back (e.g. "Removed 7"). */
  feedback: { label: string; key: number } | null
}

/** Undo, under the timer. Kept away from the number pad so it's hard to hit by accident. */
export function UndoButton({ canUndo, onUndo, feedback }: UndoButtonProps) {
  // The key of the undo whose label has timed out
  const [expiredKey, setExpiredKey] = useState<number | null>(null)
  useEffect(() => {
    if (!feedback) return
    const t = setTimeout(() => setExpiredKey(feedback.key), UNDO_LABEL_MS)
    return () => clearTimeout(t)
  }, [feedback])
  const note = feedback && feedback.key !== expiredKey ? feedback.label : null

  return (
    <>
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo && !note}
        aria-label="Undo"
        aria-keyshortcuts="Control+Z Meta+Z"
        title="Undo (Ctrl/⌘ Z)"
        className={cn(
          PILL,
          "gap-1.5 whitespace-nowrap pl-2.5 pr-3 text-sm font-semibold",
          note && "border-primary bg-primary text-primary-foreground hover:bg-primary/90",
        )}
      >
        <Undo2 className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
        {/* A narrow board's corner only has room for "Undo"; the cell flash still shows what changed */}
        <span aria-hidden="true" className={note ? "@max-[350px]:hidden" : undefined}>{note ?? "Undo"}</span>
        {note && <span aria-hidden="true" className="hidden @max-[350px]:inline">Undo</span>}
      </button>
      <span className="sr-only" role="status">
        {note ? `Undone: ${note}` : ""}
      </span>
    </>
  )
}

interface GameControlsProps {
  showErrors: boolean
  onToggleErrors: () => void
  onReset: () => void
  /** Finished, viewing a solved puzzle, or loading: Check and Reset don't apply. */
  disabled?: boolean
}

/** Check (error checking on/off) and a More menu with Reset. */
export function GameControls({ showErrors, onToggleErrors, onReset, disabled = false }: GameControlsProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close the menu on a tap outside it or on Escape
  useEffect(() => {
    if (!menuOpen) return
    const onPointer = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false)
    }
    document.addEventListener("pointerdown", onPointer)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onPointer)
      document.removeEventListener("keydown", onKey)
    }
  }, [menuOpen])

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={onToggleErrors}
        disabled={disabled}
        aria-pressed={showErrors}
        aria-label={showErrors ? "Check: turn off error checking" : "Check: turn on error checking"}
        title={showErrors ? "Error checking on" : "Error checking off"}
        className={cn(
          PILL,
          "gap-1.5 pl-2.5 pr-3 text-sm font-semibold @max-[325px]:w-9 @max-[325px]:justify-center @max-[325px]:px-0",
          showErrors && "border-primary bg-primary text-primary-foreground hover:bg-primary/90",
        )}
      >
        <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
        {/* On a narrow board the corner is too small for the label */}
        <span className="@max-[325px]:sr-only">Check</span>
      </button>

      <div ref={menuRef} className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          disabled={disabled}
          aria-label="More"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className={cn(PILL, "w-9 justify-center")}
        >
          <MoreHorizontal className="h-[18px] w-[18px]" aria-hidden="true" />
        </button>
        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 top-11 z-30 w-52 rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false)
                setShowResetConfirm(true)
              }}
              className="flex h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-sm font-medium hover:bg-secondary focus-visible:bg-secondary focus-visible:outline-none"
            >
              <RotateCcw className="h-[18px] w-[18px]" aria-hidden="true" />
              Reset puzzle
            </button>
          </div>
        )}
      </div>

      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Puzzle?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset the puzzle to its starting state. Your current progress will be lost. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onReset()
                setShowResetConfirm(false)
              }}
            >
              Reset Puzzle
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

"use client"

// The controls that sit in the empty top corners beside the board (TRI-087):
// the timer, which pauses when tapped, and Undo under it on the left (TRI-052);
// Check and a "More" menu holding Reset on the right.
// Each pill is 36 px to see and 44 px to touch (TRI-093): an invisible margin round it takes
// the tap, and the 8 px gaps between pills keep neighbouring hit areas from overlapping.

import { useEffect, useRef, useState } from "react"
import { Check, Clock, MoreHorizontal, Pause, Play, RotateCcw, Undo2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatTime } from "@/lib/tridoku"
import type { BoardTheme } from "@/lib/palettes"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  "relative inline-flex h-9 items-center before:absolute before:-inset-y-1 before:-inset-x-1 before:content-[''] rounded-full border border-border bg-secondary text-foreground transition-colors hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"

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
        // While it says what it put back, only the label changes: a filled pill would look
        // like a toggle that's on, like Check (TRI-093)
        className={cn(PILL, "gap-1.5 whitespace-nowrap pl-2.5 pr-3 text-sm font-semibold")}
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
  /** The board theme, when players can pick it (TRI-101). Omit to hide the picker. */
  boardTheme?: BoardTheme
  onBoardThemeChange?: (theme: BoardTheme) => void
}

const THEME_OPTIONS: { value: BoardTheme; label: string }[] = [
  { value: "classic", label: "Classic" },
  { value: "mountain", label: "Mountain" },
]

/** Check (error checking on/off) and a More menu with Reset. */
export function GameControls({ showErrors, onToggleErrors, onReset, disabled = false, boardTheme, onBoardThemeChange }: GameControlsProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const moreRef = useRef<HTMLButtonElement>(null)
  const resettingRef = useRef(false)

  return (
    // Check, with the More menu under it to mirror the timer and Undo on the left
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={onToggleErrors}
        disabled={disabled}
        aria-pressed={showErrors}
        aria-label={showErrors ? "Check: turn off error checking" : "Check: turn on error checking"}
        title={showErrors ? "Error checking on" : "Error checking off"}
        className={cn(
          PILL,
          "gap-1.5 pl-2.5 pr-3 text-sm font-semibold",
          showErrors && "border-toggle-on-border bg-toggle-on text-toggle-on-fg hover:bg-toggle-on/90",
        )}
      >
        <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
        <span>Check</span>
      </button>

      {/* Not modal, so opening the Reset dialog from it doesn't fight over focus */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild disabled={disabled}>
          <button type="button" ref={moreRef} aria-label="More" className={cn(PILL, "w-9 justify-center")}>
            <MoreHorizontal className="h-[18px] w-[18px]" aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          // The Reset dialog takes focus from here; it hands it back to More when it closes
          onCloseAutoFocus={(e) => {
            if (resettingRef.current) e.preventDefault()
          }}
        >
          <DropdownMenuItem
            tone="danger"
            onSelect={() => {
              resettingRef.current = true
              setShowResetConfirm(true)
            }}
          >
            <RotateCcw aria-hidden="true" />
            Reset puzzle
          </DropdownMenuItem>
          {boardTheme && onBoardThemeChange && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Look</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={boardTheme} onValueChange={(v) => onBoardThemeChange(v as BoardTheme)}>
                {THEME_OPTIONS.map((o) => (
                  <DropdownMenuRadioItem key={o.value} value={o.value}>
                    {o.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        {/* The menu item that opened it is gone, so focus goes back to the More button (TRI-094) */}
        <AlertDialogContent
          onCloseAutoFocus={(e) => {
            e.preventDefault()
            resettingRef.current = false
            moreRef.current?.focus({ preventScroll: true })
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Reset this puzzle?</AlertDialogTitle>
            <AlertDialogDescription>Everything you&apos;ve entered on this puzzle will be cleared.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-danger-solid text-on-danger-solid hover:bg-danger-solid/90"
              onClick={() => {
                onReset()
                setShowResetConfirm(false)
              }}
            >
              Reset puzzle
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

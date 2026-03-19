"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Pause, Play, RotateCcw, Eye, EyeOff, FlaskConical } from "lucide-react"
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

interface GameControlsProps {
  isPaused: boolean
  showErrors: boolean
  onTogglePause: () => void
  onToggleErrors: () => void
  onReset: () => void
  onTestSolve?: () => void
  onGenerateNew?: () => void
  isComplete: boolean
  isViewMode?: boolean
  isGenerating?: boolean
}

export function GameControls({
  isPaused,
  showErrors,
  onTogglePause,
  onToggleErrors,
  onReset,
  onTestSolve,
  isComplete,
  isViewMode = false,
  isGenerating = false,
}: GameControlsProps) {
  const isDev = process.env.NODE_ENV === 'development'
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const handleResetClick = () => {
    setShowResetConfirm(true)
  }

  const confirmReset = () => {
    onReset()
    setShowResetConfirm(false)
  }

  const cancelReset = () => {
    setShowResetConfirm(false)
  }

  return (
    <div className="flex items-center justify-center gap-3">
      <Button
        variant="ghost"
        size="icon"
        onClick={onTogglePause}
        disabled={isComplete || isGenerating}
        className={cn(
          "h-12 w-12 rounded-full transition-all duration-150",
          "hover:bg-secondary hover:scale-110"
        )}
        aria-label={isPaused ? "Resume game" : "Pause game"}
      >
        {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleErrors}
        disabled={isGenerating}
        className={cn(
          "h-12 w-12 rounded-full transition-all duration-150",
          showErrors && "bg-accent text-accent-foreground",
          "hover:bg-secondary hover:scale-110"
        )}
        aria-label={showErrors ? "Hide error highlights" : "Show error highlights"}
      >
        {showErrors ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleResetClick}
        disabled={isGenerating || isComplete || isViewMode}
        className={cn(
          "h-12 w-12 rounded-full transition-all duration-150",
          "hover:bg-secondary hover:scale-110"
        )}
        aria-label="Reset puzzle"
      >
        <RotateCcw className="h-5 w-5" />
      </Button>

      {isDev && onTestSolve && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onTestSolve}
          disabled={isComplete}
          className={cn(
            "h-12 w-12 rounded-full transition-all duration-150",
            "hover:bg-secondary hover:scale-110",
            "border border-dashed border-orange-500/50"
          )}
          aria-label="Load nearly-solved puzzle (dev)"
          title="Dev: Load test solve"
        >
          <FlaskConical className="h-5 w-5 text-orange-500" />
        </Button>
      )}

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Puzzle?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset the puzzle to its starting state. Your current progress will be lost. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelReset}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReset}>Reset Puzzle</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

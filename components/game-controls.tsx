"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Pause, Play, RotateCcw, Eye, EyeOff, FlaskConical } from "lucide-react"

interface GameControlsProps {
  isPaused: boolean
  showErrors: boolean
  onTogglePause: () => void
  onToggleErrors: () => void
  onReset: () => void
  onTestSolve?: () => void
  isComplete: boolean
}

export function GameControls({
  isPaused,
  showErrors,
  onTogglePause,
  onToggleErrors,
  onReset,
  onTestSolve,
  isComplete,
}: GameControlsProps) {
  const isDev = process.env.NODE_ENV === 'development'

  return (
    <div className="flex items-center justify-center gap-3">
      <Button
        variant="ghost"
        size="icon"
        onClick={onTogglePause}
        disabled={isComplete}
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
        onClick={onReset}
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
    </div>
  )
}

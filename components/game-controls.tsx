"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Pause, Play, RotateCcw, Eye, EyeOff } from "lucide-react"

interface GameControlsProps {
  isPaused: boolean
  showErrors: boolean
  onTogglePause: () => void
  onToggleErrors: () => void
  onReset: () => void
  isComplete: boolean
}

export function GameControls({
  isPaused,
  showErrors,
  onTogglePause,
  onToggleErrors,
  onReset,
  isComplete,
}: GameControlsProps) {
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
    </div>
  )
}

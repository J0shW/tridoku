"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Pause, Play, RotateCcw, Eye, EyeOff, FlaskConical, Sparkles } from "lucide-react"
import { DifficultySelector, useStoredDifficulty } from "@/components/difficulty-selector"
import { Difficulty } from "@/lib/tridoku"
import { Spinner } from "@/components/ui/spinner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface GameControlsProps {
  isPaused: boolean
  showErrors: boolean
  onTogglePause: () => void
  onToggleErrors: () => void
  onReset: () => void
  onTestSolve?: () => void
  onGenerateNew?: (difficulty: Difficulty) => void
  isComplete: boolean
  isGenerating?: boolean
}

export function GameControls({
  isPaused,
  showErrors,
  onTogglePause,
  onToggleErrors,
  onReset,
  onTestSolve,
  onGenerateNew,
  isComplete,
  isGenerating = false,
}: GameControlsProps) {
  const isDev = process.env.NODE_ENV === 'development'
  const storedDifficulty = useStoredDifficulty()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleGenerateNew = (difficulty: Difficulty) => {
    onGenerateNew?.(difficulty)
    setIsDialogOpen(false)
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
        onClick={onReset}
        disabled={isGenerating}
        className={cn(
          "h-12 w-12 rounded-full transition-all duration-150",
          "hover:bg-secondary hover:scale-110"
        )}
        aria-label="Reset puzzle"
      >
        <RotateCcw className="h-5 w-5" />
      </Button>

      {onGenerateNew && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              disabled={isGenerating}
              className={cn(
                "h-12 w-12 rounded-full transition-all duration-150",
                "hover:bg-secondary hover:scale-110",
                "border-2 border-primary/20"
              )}
              aria-label="Generate new puzzle"
            >
              {isGenerating ? (
                <Spinner className="h-5 w-5" />
              ) : (
                <Sparkles className="h-5 w-5" />
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Generate New Puzzle</DialogTitle>
              <DialogDescription>
                Select a difficulty level. Generation may take a few seconds.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <DifficultySelector 
                onDifficultyChange={handleGenerateNew}
                disabled={isGenerating}
              />
              <div className="text-xs text-muted-foreground">
                <p><strong>Easy:</strong> 60-65 starting numbers</p>
                <p><strong>Medium:</strong> 50-55 starting numbers</p>
                <p><strong>Hard:</strong> 40-45 starting numbers</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

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

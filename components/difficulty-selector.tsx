"use client"

import { Difficulty, formatTime } from "@/lib/tridoku"
import type { DifficultyStats, PuzzleInProgress } from "@/hooks/use-tridoku"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"

interface DifficultySelectorProps {
  currentDifficulty: Difficulty
  stats: {
    easy: DifficultyStats
    medium: DifficultyStats
    hard: DifficultyStats
  }
  /** Puzzles started today and not finished, shown on the other tabs (TRI-033) */
  inProgress?: Partial<Record<Difficulty, PuzzleInProgress>>
  onDifficultyChange: (difficulty: Difficulty) => void
  disabled?: boolean
}

/** Half-filled circle: "partly done", next to the ✓ for "done". */
function InProgressIcon() {
  return (
    <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden="true">
      <circle cx="6" cy="6" r="4.5" fill="none" stroke="white" strokeWidth="1.5" />
      <path d="M6 1.5 A4.5 4.5 0 0 0 6 10.5 Z" fill="white" />
    </svg>
  )
}

export function DifficultySelector({ 
  currentDifficulty, 
  stats,
  inProgress = {},
  onDifficultyChange,
  disabled = false
}: DifficultySelectorProps) {
  const difficulties: Array<{ value: Difficulty; label: string; bgColor: string; darkBgColor: string; textColor: string; darkTextColor: string; borderColor: string }> = [
    { value: 'easy', label: 'Easy', bgColor: 'bg-[#bfdde2] hover:bg-[#bfdde2]', darkBgColor: 'dark:bg-[#bfdde2]/90 hover:dark:bg-[#bfdde2]/90', textColor: 'text-[#2d5a3a]', darkTextColor: 'dark:text-[#1a3324]', borderColor: 'border-[#98ac8b] dark:border-[#bfdde2]' },
    { value: 'medium', label: 'Medium', bgColor: 'bg-[#ecbd6c] hover:bg-[#ecbd6c]', darkBgColor: 'dark:bg-[#ecbd6c]/90 hover:dark:bg-[#ecbd6c]/90', textColor: 'text-[#6b4423]', darkTextColor: 'dark:text-[#3d2614]', borderColor: 'border-[#e2885b] dark:border-[#ecbd6c]' },
    { value: 'hard', label: 'Hard', bgColor: 'bg-[#e26495] hover:bg-[#e26495]', darkBgColor: 'dark:bg-[#e26495]/90 hover:dark:bg-[#e26495]/90', textColor: 'text-[#2e0f1f]', darkTextColor: 'dark:text-[#2e0f1f]', borderColor: 'border-[#b47098] dark:border-[#e26495]' },
  ]

  return (
    <div className="flex gap-3 justify-center items-center">
      {difficulties.map(({ value, label, bgColor, darkBgColor, textColor, darkTextColor, borderColor }) => {
        const isActive = currentDifficulty === value
        const isCompleted = stats[value].completedToday
        // The tab being played is obviously in progress, so only mark the others.
        const progress = !isActive && !isCompleted ? inProgress[value] : undefined
        const status = isCompleted
          ? "completed today"
          : progress
            ? `in progress, ${formatTime(progress.elapsedTime)}`
            : null

        return (
          <Button
            key={value}
            onClick={() => !isActive && onDifficultyChange(value)}
            disabled={disabled}
            aria-label={status ? `${label}, ${status}` : label}
            title={status ? `${label}: ${status}` : undefined}
            variant={isActive ? "default" : "outline"}
            className={`
              relative min-w-22.5 border-2
              border-t-0 border-l-0 border-r-0 rounded-b-none
              ${isActive ? `${bgColor} ${darkBgColor} ${textColor} ${darkTextColor} ${borderColor}` : `${borderColor} dark:text-foreground hover:bg-foreground/20!`}
            `}
          >
            {label}
            {isCompleted && (
              <Badge 
                variant="secondary" 
                className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-green-600 hover:bg-green-600"
              >
                <Check className="h-3 w-3 text-white" />
              </Badge>
            )}
            {progress && (
              <Badge
                variant="secondary"
                className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-amber-600 hover:bg-amber-600"
              >
                <InProgressIcon />
              </Badge>
            )}
          </Button>
        )
      })}
    </div>
  )
}

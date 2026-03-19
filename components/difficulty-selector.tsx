"use client"

import { Difficulty } from "@/lib/tridoku"
import { DifficultyStats } from "@/hooks/use-tridoku"
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
  onDifficultyChange: (difficulty: Difficulty) => void
  disabled?: boolean
}

export function DifficultySelector({ 
  currentDifficulty, 
  stats,
  onDifficultyChange,
  disabled = false
}: DifficultySelectorProps) {
  const difficulties: Array<{ value: Difficulty; label: string; bgColor: string; hoverColor: string }> = [
    { value: 'easy', label: 'Easy', bgColor: 'bg-[var(--tridoku-easy-outer)]', hoverColor: 'hover:bg-white hover:border-[var(--tridoku-easy-overlap)]' },
    { value: 'medium', label: 'Medium', bgColor: 'bg-[var(--tridoku-medium-outer)]', hoverColor: 'hover:bg-white hover:border-[var(--tridoku-medium-overlap)]' },
    { value: 'hard', label: 'Hard', bgColor: 'bg-[var(--tridoku-hard-outer)]', hoverColor: 'hover:bg-white hover:border-[var(--tridoku-hard-overlap)]' },
  ]

  return (
    <div className="flex gap-3 justify-center items-center">
      {difficulties.map(({ value, label, bgColor, hoverColor }) => {
        const isActive = currentDifficulty === value
        const isCompleted = stats[value].completedToday
        
        return (
          <Button
            key={value}
            onClick={() => !isActive && onDifficultyChange(value)}
            disabled={disabled}
            variant={isActive ? "default" : "outline"}
            className={`
              relative min-w-22.5 text-black
              ${isActive ? bgColor : 'border-2'}
              ${isActive ? `hover:${bgColor}` : hoverColor}
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
          </Button>
        )
      })}
    </div>
  )
}

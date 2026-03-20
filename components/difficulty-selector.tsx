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
  const difficulties: Array<{ value: Difficulty; label: string; bgColor: string; darkBgColor: string; textColor: string; darkTextColor: string; borderColor: string }> = [
    { value: 'easy', label: 'Easy', bgColor: 'bg-[#bfdde2]', darkBgColor: 'dark:bg-[#bfdde2]/90', textColor: 'text-[#2d5a3a]', darkTextColor: 'dark:text-[#1a3324]', borderColor: 'border-[#98ac8b] dark:border-[#bfdde2]' },
    { value: 'medium', label: 'Medium', bgColor: 'bg-[#ecbd6c]', darkBgColor: 'dark:bg-[#ecbd6c]/90', textColor: 'text-[#6b4423]', darkTextColor: 'dark:text-[#3d2614]', borderColor: 'border-[#e2885b] dark:border-[#ecbd6c]' },
    { value: 'hard', label: 'Hard', bgColor: 'bg-[#e26495]', darkBgColor: 'dark:bg-[#e26495]/90', textColor: 'text-[#6b2447]', darkTextColor: 'dark:text-[#3d1529]', borderColor: 'border-[#b47098] dark:border-[#e26495]' },
  ]

  return (
    <div className="flex gap-3 justify-center items-center">
      {difficulties.map(({ value, label, bgColor, darkBgColor, textColor, darkTextColor, borderColor }) => {
        const isActive = currentDifficulty === value
        const isCompleted = stats[value].completedToday
        
        return (
          <Button
            key={value}
            onClick={() => !isActive && onDifficultyChange(value)}
            disabled={disabled}
            variant={isActive ? "default" : "outline"}
            className={`
              relative min-w-22.5 border-2
              ${isActive ? `${bgColor} ${darkBgColor} ${textColor} ${darkTextColor} ${borderColor}` : `${borderColor} dark:text-foreground hover:bg-background/80`}
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

"use client"

import { useState, useEffect } from "react"
import { Difficulty } from "@/lib/tridoku"
import { Button } from "@/components/ui/button"

interface DifficultySelectorProps {
  onDifficultyChange?: (difficulty: Difficulty) => void
  disabled?: boolean
}

const STORAGE_KEY = "tridoku-difficulty"

function getStoredDifficulty(): Difficulty {
  if (typeof window === "undefined") return "medium"
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === "easy" || stored === "medium" || stored === "hard") {
    return stored
  }
  return "medium"
}

function saveDifficulty(difficulty: Difficulty) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, difficulty)
  }
}

export function DifficultySelector({ onDifficultyChange, disabled }: DifficultySelectorProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("medium")

  useEffect(() => {
    const stored = getStoredDifficulty()
    setSelectedDifficulty(stored)
  }, [])

  const handleSelect = (difficulty: Difficulty) => {
    setSelectedDifficulty(difficulty)
    saveDifficulty(difficulty)
    onDifficultyChange?.(difficulty)
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant={selectedDifficulty === "easy" ? "default" : "outline"}
        onClick={() => handleSelect("easy")}
        disabled={disabled}
      >
        Easy
      </Button>
      <Button
        size="sm"
        variant={selectedDifficulty === "medium" ? "default" : "outline"}
        onClick={() => handleSelect("medium")}
        disabled={disabled}
      >
        Medium
      </Button>
      <Button
        size="sm"
        variant={selectedDifficulty === "hard" ? "default" : "outline"}
        onClick={() => handleSelect("hard")}
        disabled={disabled}
      >
        Hard
      </Button>
    </div>
  )
}

export function useStoredDifficulty(): Difficulty {
  const [difficulty, setDifficulty] = useState<Difficulty>("medium")

  useEffect(() => {
    const stored = getStoredDifficulty()
    setDifficulty(stored)
  }, [])

  return difficulty
}

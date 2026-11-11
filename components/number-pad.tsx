"use client"

import { Button } from "@/components/ui/legacy-button"
import { cn } from "@/lib/utils"
import { Delete } from "lucide-react"

interface NumberPadProps {
  onNumberClick: (num: number) => void
  onClear: () => void
  disabled?: boolean
  activePencilMarks?: number[]
  /** In Pencil mode the keys look like notes: a small digit in the corner (TRI-090). */
  mode?: "pen" | "pencil"
}

export function NumberPad({ onNumberClick, onClear, disabled, activePencilMarks, mode = "pen" }: NumberPadProps) {
  const pencil = mode === "pencil"
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9]

  return (
    <div className="grid grid-cols-5 gap-2 max-w-sm mx-auto" role="group" aria-label="Number input pad">
      {numbers.map((num) => {
        const isActive = activePencilMarks?.includes(num)
        return (
          <Button
            key={num}
            variant="secondary"
            size="lg"
            onClick={() => onNumberClick(num)}
            disabled={disabled}
            className={cn(
              "h-14 w-14 rounded-xl transition-all duration-150",
              pencil ? "items-start justify-start p-2 text-base font-semibold" : "text-xl font-bold",
              "hover:bg-primary hover:text-primary-foreground hover:scale-105",
              "active:scale-95",
              isActive && "bg-primary text-primary-foreground"
            )}
            aria-label={pencil ? `Note ${num}` : `Enter ${num}`}
            aria-pressed={pencil ? !!isActive : undefined}
          >
            {num}
          </Button>
        )
      })}
      <Button
        variant="outline"
        size="lg"
        onClick={onClear}
        disabled={disabled}
        className={cn(
          "h-14 w-14 rounded-xl transition-all duration-150",
          "hover:bg-destructive hover:text-white hover:scale-105 hover:border-destructive",
          "active:scale-95"
        )}
        aria-label="Clear cell"
      >
        <Delete className="size-6 -ml-0.5"/>
      </Button>
    </div>
  )
}

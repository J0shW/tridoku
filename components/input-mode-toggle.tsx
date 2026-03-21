"use client"

import { cn } from "@/lib/utils"
import { Pen, Pencil } from "lucide-react"
import type { InputMode } from "@/hooks/use-tridoku"

interface InputModeToggleProps {
  mode: InputMode
  onModeChange: (mode: InputMode) => void
  disabled?: boolean
}

export function InputModeToggle({ mode, onModeChange, disabled }: InputModeToggleProps) {
  return (
    <div 
      className={cn(
        "inline-flex rounded-lg border border-border bg-muted p-1 gap-1",
        disabled && "opacity-50 pointer-events-none"
      )}
      role="group"
      aria-label="Input mode"
    >
      <button
        type="button"
        onClick={() => onModeChange('pen')}
        disabled={disabled}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all",
          mode === 'pen' 
            ? "bg-background text-foreground shadow-sm" 
            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
        )}
        aria-pressed={mode === 'pen'}
      >
        <Pen className="h-4 w-4" />
        <span>Pen</span>
      </button>
      <button
        type="button"
        onClick={() => onModeChange('pencil')}
        disabled={disabled}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all",
          mode === 'pencil' 
            ? "bg-background text-foreground shadow-sm" 
            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
        )}
        aria-pressed={mode === 'pencil'}
      >
        <Pencil className="h-4 w-4" />
        <span>Pencil</span>
      </button>
    </div>
  )
}

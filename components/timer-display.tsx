"use client"

import { formatTime } from "@/lib/tridoku"
import { cn } from "@/lib/utils"
import { Clock } from "lucide-react"

interface TimerDisplayProps {
  seconds: number
  isPaused?: boolean
  className?: string
}

export function TimerDisplay({ seconds, isPaused, className }: TimerDisplayProps) {
  return (
    <div 
      className={cn(
        "flex items-center gap-2 font-mono text-lg",
        isPaused && "text-muted-foreground",
        className
      )}
      aria-label={`Time: ${formatTime(seconds)}`}
      role="timer"
    >
      <Clock className="h-5 w-5" />
      <span className="tabular-nums">{formatTime(seconds)}</span>
    </div>
  )
}

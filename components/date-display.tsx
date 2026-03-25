"use client"

import { Calendar, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DateDisplayProps {
  selectedDate: Date
  isArchive: boolean
  onCalendarClick: () => void
  onGoToToday: () => void
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

export function DateDisplay({
  selectedDate,
  isArchive,
  onCalendarClick,
  onGoToToday,
}: DateDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onCalendarClick}
          aria-label="Open calendar"
          className="h-10 w-10"
        >
          <Calendar className="h-5 w-5" />
        </Button>
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          {formatDate(selectedDate)}
        </h2>
      </div>
      
      {isArchive && (
        <Button
          variant="outline"
          size="sm"
          onClick={onGoToToday}
          className="gap-1.5"
        >
          {"Today's Puzzle"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

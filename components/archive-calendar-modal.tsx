"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Launch date - puzzles are only available from this date forward
const LAUNCH_DATE = new Date(2026, 0, 1) // January 1, 2026

interface ArchiveCalendarModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate: Date
  onDateSelect: (date: Date) => void
}

export function ArchiveCalendarModal({
  open,
  onOpenChange,
  selectedDate,
  onDateSelect,
}: ArchiveCalendarModalProps) {
  const [month, setMonth] = useState<Date>(selectedDate)
  const today = new Date()

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onDateSelect(date)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Puzzle Archive</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center py-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            month={month}
            onMonthChange={setMonth}
            disabled={(date) => {
              // Disable dates before launch and after today
              return date < LAUNCH_DATE || date > today
            }}
            initialFocus
          />
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Select a date to play that day&apos;s puzzle
        </p>
      </DialogContent>
    </Dialog>
  )
}

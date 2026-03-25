"use client"

import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface CalendarPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate: Date
  onDateSelect: (date: Date) => void
}

export function CalendarPicker({
  open,
  onOpenChange,
  selectedDate,
  onDateSelect,
}: CalendarPickerProps) {
  const today = new Date()
  
  // Disable future dates
  const disabledDays = { after: today }
  
  // First available date (Jan 1, 2026 - when puzzles started)
  const fromDate = new Date(2026, 0, 1)

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onDateSelect(date)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-fit">
        <DialogHeader>
          <DialogTitle className="text-center">Select a Date</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            disabled={disabledDays}
            fromDate={fromDate}
            toDate={today}
            defaultMonth={selectedDate}
            captionLayout="dropdown"
            classNames={{
              months: "flex flex-col",
              month: "space-y-4",
              nav: "flex items-center justify-between w-full px-1",
              caption_label: "text-sm font-medium",
              table: "w-full border-collapse",
              head_row: "flex",
              head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
              row: "flex w-full mt-2",
              cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground",
              day_outside: "text-muted-foreground opacity-50",
              day_disabled: "text-muted-foreground opacity-50 cursor-not-allowed",
              day_hidden: "invisible",
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

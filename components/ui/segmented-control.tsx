"use client"

// SegmentedControl (design system §3.4, TRI-089). Two roles:
// - "group": modes, like Pen/Pencil or a rating. Each segment is a button with aria-pressed.
// - "tablist": views, like Rules/Tips or Easy/Medium/Hard in Statistics. Each segment is a
//   tab with aria-selected; arrow keys, Home and End move between tabs (roving tabindex).

import * as React from "react"
import { cn } from "@/lib/utils"

export interface Segment<T extends string> {
  value: T
  label: React.ReactNode
  icon?: React.ReactNode
  /** Accessible name when the label isn't plain text */
  ariaLabel?: string
}

interface SegmentedControlProps<T extends string> {
  /** Names the whole control for screen readers, e.g. "Input mode". */
  label: string
  role?: "group" | "tablist"
  segments: Segment<T>[]
  value: T
  onChange: (value: T) => void
  disabled?: boolean
  /** Stretch the segments to fill the width. */
  fill?: boolean
  className?: string
}

export function SegmentedControl<T extends string>({
  label,
  role = "group",
  segments,
  value,
  onChange,
  disabled = false,
  fill = false,
  className,
}: SegmentedControlProps<T>) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([])
  const isTabs = role === "tablist"

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (!isTabs) return
    const last = segments.length - 1
    const next =
      e.key === "ArrowRight" ? (index === last ? 0 : index + 1)
      : e.key === "ArrowLeft" ? (index === 0 ? last : index - 1)
      : e.key === "Home" ? 0
      : e.key === "End" ? last
      : null
    if (next == null) return
    e.preventDefault()
    onChange(segments[next].value)
    refs.current[next]?.focus()
  }

  return (
    <div
      role={role}
      aria-label={label}
      aria-disabled={disabled || undefined}
      className={cn(
        "inline-flex gap-1 rounded-control border border-border bg-surface-sunken p-1",
        fill && "flex w-full",
        disabled && "pointer-events-none opacity-45",
        className,
      )}
    >
      {segments.map((s, i) => {
        const selected = s.value === value
        return (
          <button
            key={s.value}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            disabled={disabled}
            role={isTabs ? "tab" : undefined}
            aria-selected={isTabs ? selected : undefined}
            aria-pressed={isTabs ? undefined : selected}
            aria-label={s.ariaLabel}
            tabIndex={isTabs && !selected ? -1 : undefined}
            onClick={() => onChange(s.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              // 36 px to see, 44 px to touch
              "relative inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-3.5 text-label font-medium",
              "before:absolute before:-inset-y-1 before:inset-x-0 before:content-['']",
              "transition-[background-color,color,box-shadow] duration-(--dur-fast) ease-standard",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
              "[&_svg]:size-4 [&_svg]:shrink-0",
              fill && "flex-1",
              selected
                ? "bg-surface-raised text-fg shadow-thumb ring-1 ring-border"
                : "text-fg-muted hover:text-fg",
            )}
          >
            {s.icon}
            {s.label}
          </button>
        )
      })}
    </div>
  )
}

// Badge and StatTile (design system §3.10–3.11, TRI-089).

import * as React from "react"
import { cn } from "@/lib/utils"

type BadgeTone = "success" | "neutral"

const BADGE: Record<BadgeTone, string> = {
  success: "bg-success text-on-action",
  neutral: "border border-border-strong bg-surface-sunken text-fg-muted",
}

interface BadgeProps extends React.ComponentProps<"span"> {
  tone?: BadgeTone
}

/** A small status mark: solved today (success), or in progress with its time (neutral). */
export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(
        "inline-flex h-5.5 min-w-5.5 items-center justify-center gap-1 rounded-full px-1.5 text-caption font-semibold tabular-nums [&_svg]:size-3",
        BADGE[tone],
        className,
      )}
      {...props}
    />
  )
}

interface StatTileProps {
  value: React.ReactNode
  label: string
  className?: string
}

/** One number and its label, as in the win card and Statistics. */
export function StatTile({ value, label, className }: StatTileProps) {
  return (
    <div className={cn("rounded-card bg-surface-sunken px-1 py-2.5 text-center", className)}>
      <div className="text-heading font-bold tabular-nums text-fg">{value}</div>
      <div className="truncate text-label-sm text-fg-muted">{label}</div>
    </div>
  )
}

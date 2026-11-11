"use client"

// A short message that slides in over the top of the screen (TRI-090). It floats, so it
// never moves the board or the number pad, and it hides itself after a while.

import { useEffect } from "react"
import { X } from "lucide-react"

interface TipBannerProps {
  children: React.ReactNode
  onDismiss: () => void
  /** Hide automatically after this many milliseconds. */
  autoHideMs?: number
}

export function TipBanner({ children, onDismiss, autoHideMs }: TipBannerProps) {
  useEffect(() => {
    if (!autoHideMs) return
    const t = setTimeout(onDismiss, autoHideMs)
    return () => clearTimeout(t)
  }, [autoHideMs, onDismiss])

  return (
    <div className="pointer-events-none fixed inset-x-0 top-2 z-40 flex justify-center px-4">
      <div
        role="status"
        className="pointer-events-auto relative w-full max-w-md rounded-xl border border-border bg-popover py-3 pl-4 pr-11 text-sm text-popover-foreground shadow-lg motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-2"
      >
        {children}
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="absolute right-1 top-1 inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

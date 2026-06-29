"use client"

import { Coffee } from "lucide-react"
import { KOFI_OPEN_EVENT } from "@/components/kofi-widget"

export function KofiButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(KOFI_OPEN_EVENT))}
      className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-[#00b9fe] px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 ${className ?? ""}`}
    >
      <Coffee className="h-3.5 w-3.5" />
      Support me on Ko-fi
    </button>
  )
}

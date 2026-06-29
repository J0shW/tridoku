"use client"

import Image from "next/image"
import { KOFI_OPEN_EVENT } from "@/components/kofi-widget"

export function KofiButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      aria-label="Support me on Ko-fi"
      onClick={() => window.dispatchEvent(new Event(KOFI_OPEN_EVENT))}
      className={`inline-flex min-h-[44px] items-center justify-center rounded-xl transition-opacity hover:opacity-90 ${className ?? ""}`}
    >
      <Image
        src="/images/kofi-support-button.png"
        alt="Support me on Ko-fi"
        width={245}
        height={49}
        className="h-11 w-auto"
        priority
      />
    </button>
  )
}

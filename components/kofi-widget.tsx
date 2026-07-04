"use client"

import { useState } from "react"
import Image from "next/image"
import { X } from "lucide-react"
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog"

/** A custom "Support me" button (matching the feedback button) that opens the Ko-fi donation panel in a dialog. */
export function KofiWidget() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Support me on Ko-fi"
        className="inline-flex items-center gap-2 rounded-md bg-foreground/5 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Image src="/kofi-symbol.png" alt="" width={25} height={20} className="h-5 w-auto object-contain" />
        Support me
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="w-[360px] max-w-[calc(100vw-5rem)] left-[calc(50%-1.5rem)] gap-0 overflow-visible rounded-2xl border-0 p-0 shadow-2xl"
        >
          <DialogTitle className="sr-only">Support me on Ko-fi</DialogTitle>
          <DialogClose className="absolute -right-3 -top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-background text-foreground shadow-lg ring-offset-background transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
          <iframe
            id="kofiframe"
            src="https://ko-fi.com/joshwhitney/?hidefeed=true&widget=true&embed=true&preview=true"
            title="joshwhitney"
            className="h-[680px] max-h-[80vh] w-full overflow-hidden rounded-2xl border-0"
            style={{ background: "#f9f9f9" }}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

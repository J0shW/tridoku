"use client"

import Image from "next/image"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

/** A clickable Ko-fi image that opens the donation panel in a dialog. */
export function KofiWidget() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Support me on Ko-fi"
          className="inline-block rounded-lg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Image
            src="/support-me-on-kofi.png"
            alt="Support me on Ko-fi"
            width={490}
            height={98}
            className="h-auto w-full max-w-[240px]"
          />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogTitle className="sr-only">Support me on Ko-fi</DialogTitle>
        <iframe
          id="kofiframe"
          src="https://ko-fi.com/joshwhitney/?hidefeed=true&widget=true&embed=true&preview=true"
          title="joshwhitney"
          className="w-full"
          style={{ border: "none", padding: 4, background: "#f9f9f9" }}
          height={712}
        />
      </DialogContent>
    </Dialog>
  )
}

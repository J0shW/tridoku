"use client"

import { useEffect, useRef, useState } from "react"
import { X } from "lucide-react"
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog"

const SCRIPT_SRC = "https://storage.ko-fi.com/cdn/widget/Widget_2.js"

declare global {
  interface Window {
    kofiwidget2?: {
      init: (text: string, color: string, id: string) => void
      getHTML: () => string
    }
  }
}

/** Renders the official Ko-fi "Support me" button, opening the donation panel in a dialog. */
export function KofiWidget() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function renderButton() {
      if (window.kofiwidget2 && containerRef.current) {
        window.kofiwidget2.init("Support me", "#bfdde2", "H1K5228SC2")
        containerRef.current.innerHTML = window.kofiwidget2.getHTML()
        // Ko-fi defaults the label to white; force a dark color for contrast on the light background
        containerRef.current
          .querySelector<HTMLElement>(".kofitext")
          ?.style.setProperty("color", "#2d5a3a", "important")
      }
    }

    if (window.kofiwidget2) {
      renderButton()
      return
    }

    let script = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`)

    if (!script) {
      script = document.createElement("script")
      script.src = SCRIPT_SRC
      script.async = true
      document.body.appendChild(script)
    }

    script.addEventListener("load", renderButton)
    return () => script?.removeEventListener("load", renderButton)
  }, [])

  // Intercept clicks on the injected Ko-fi link so it opens the dialog instead of a new tab.
  function handleClick(event: React.MouseEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("a")) {
      event.preventDefault()
      setOpen(true)
    }
  }

  return (
    <>
      <div ref={containerRef} className="kofi-btn-wrap flex justify-center" onClick={handleClick} />

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

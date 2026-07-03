"use client"

import { useEffect, useRef, useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

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
        window.kofiwidget2.init("Support me", "Bfdde2", "H1K5228SC2")
        containerRef.current.innerHTML = window.kofiwidget2.getHTML()
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
      <div ref={containerRef} className="flex justify-center" onClick={handleClick} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md overflow-hidden p-0">
          <DialogTitle className="sr-only">Support me on Ko-fi</DialogTitle>
          <iframe
            id="kofiframe"
            src="https://ko-fi.com/joshwhitney/?hidefeed=true&widget=true&embed=true&preview=true"
            title="joshwhitney"
            className="h-[712px] w-full border-0"
            style={{ background: "#f9f9f9" }}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

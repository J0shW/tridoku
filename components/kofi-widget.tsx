"use client"

import { useEffect, useRef } from "react"

const SCRIPT_SRC = "https://storage.ko-fi.com/cdn/widget/Widget_2.js"

declare global {
  interface Window {
    kofiwidget2?: {
      init: (text: string, color: string, id: string) => void
      getHTML: () => string
    }
  }
}

/** Renders the official Ko-fi "Support me" button via their widget script. */
export function KofiWidget() {
  const containerRef = useRef<HTMLDivElement>(null)

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
    const created = !script

    if (!script) {
      script = document.createElement("script")
      script.src = SCRIPT_SRC
      script.async = true
      document.body.appendChild(script)
    }

    script.addEventListener("load", renderButton)
    return () => script?.removeEventListener("load", renderButton)
  }, [])

  return <div ref={containerRef} className="flex justify-center" />
}

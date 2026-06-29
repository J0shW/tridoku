"use client"

import Script from "next/script"

const KOFI_USERNAME = "joshwhitney"

declare global {
  interface Window {
    kofiWidgetOverlay?: {
      draw: (username: string, config: Record<string, string>) => void
    }
  }
}

function drawWidget() {
  if (!window.kofiWidgetOverlay) return
  window.kofiWidgetOverlay.draw(KOFI_USERNAME, {
    type: "floating-chat",
    "floating-chat.donateButton.text": "Support me",
    "floating-chat.donateButton.background-color": "#00b9fe",
    "floating-chat.donateButton.text-color": "#fff",
  })
}

/** Loads Ko-fi's default floating button + slide-up donation panel. */
export function KofiWidget() {
  return (
    <Script
      src="https://storage.ko-fi.com/cdn/scripts/overlay-widget.js"
      strategy="lazyOnload"
      onLoad={drawWidget}
      onReady={drawWidget}
    />
  )
}

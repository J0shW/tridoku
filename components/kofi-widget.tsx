"use client"

import { useEffect } from "react"
import Script from "next/script"

const KOFI_USERNAME = "joshwhitney"
export const KOFI_OPEN_EVENT = "kofi:open"

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

/**
 * Loads Ko-fi's overlay widget so we can reuse its slide-up donation panel,
 * but hides Ko-fi's own floating button. The panel is instead opened from our
 * in-footer <KofiButton />, so nothing floats over the page content.
 */
export function KofiWidget() {
  useEffect(() => {
    // Hide Ko-fi's default floating buttons (desktop + mobile).
    const style = document.createElement("style")
    style.textContent =
      ".floatingchat-container-wrap,.floatingchat-container-wrap-mobi{display:none!important;}"
    document.head.appendChild(style)

    // Open Ko-fi's panel by clicking the (hidden) donate button inside whichever
    // widget iframe is active for the current viewport.
    function openKofi() {
      const isVisible = (el: Element | null) =>
        !!el && getComputedStyle(el).display !== "none"
      const useMobi = isVisible(
        document.querySelector(".floatingchat-container-wrap-mobi"),
      )
      const iframe = (
        useMobi
          ? document.querySelector(".floatingchat-container-mobi")
          : document.querySelector(".floatingchat-container")
      ) as HTMLIFrameElement | null
      const button = iframe?.contentDocument?.querySelector(
        ".floatingchat-donate-button",
      ) as HTMLElement | undefined
      button?.click()
    }

    window.addEventListener(KOFI_OPEN_EVENT, openKofi)
    return () => {
      window.removeEventListener(KOFI_OPEN_EVENT, openKofi)
      style.remove()
    }
  }, [])

  return (
    <Script
      src="https://storage.ko-fi.com/cdn/scripts/overlay-widget.js"
      strategy="lazyOnload"
      onLoad={drawWidget}
      onReady={drawWidget}
    />
  )
}

"use client"

import Script from "next/script"
import { MessageSquare } from "lucide-react"

const TALLY_FORM_ID = "44qzGB"

declare global {
  interface Window {
    Tally?: {
      openPopup: (formId: string, options?: Record<string, unknown>) => void
      loadEmbeds: () => void
    }
  }
}

/** Floating feedback button that opens a Tally form in a popup. */
export function FeedbackWidget() {
  function openForm() {
    window.Tally?.openPopup(TALLY_FORM_ID, {
      layout: "modal",
      width: 540,
      overlay: true,
    })
  }

  return (
    <>
      <Script src="https://tally.so/widgets/embed.js" strategy="lazyOnload" />
      <button
        type="button"
        onClick={openForm}
        className="fixed bottom-4 left-4 z-50 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label="Open feedback form"
      >
        <MessageSquare className="size-4" aria-hidden="true" />
        Feedback
      </button>
    </>
  )
}

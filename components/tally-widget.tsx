"use client"

import Script from "next/script"
import { MessageSquare } from "lucide-react"
import { trackEvent } from "@/lib/analytics"
import { BUILD_COMMIT } from "@/lib/app-env"
import { deviceType, FEEDBACK_FORM_ID, feedbackFields, feedbackUrl } from "@/lib/feedback-context"
import type { DateKey } from "@/lib/dates"
import type { Difficulty } from "@/lib/tridoku"

declare global {
  interface Window {
    Tally?: {
      openPopup: (formId: string, options?: Record<string, unknown>) => void
    }
  }
}

interface TallyWidgetProps {
  /** The puzzle on screen, if any, sent to the form as hidden fields (TRI-043). */
  puzzleDate: DateKey | null
  difficulty: Difficulty | null
  solved: boolean
}

/** Loads Tally's embed script and renders a feedback button that opens the form with context. */
export function TallyWidget({ puzzleDate, difficulty, solved }: TallyWidgetProps) {
  const open = () => {
    trackEvent("feedback_opened")
    const fields = feedbackFields({
      puzzleDate,
      difficulty,
      solved,
      device: deviceType(window.innerWidth, window.matchMedia("(pointer: coarse)").matches),
      appVersion: BUILD_COMMIT ?? "dev",
    })
    if (window.Tally) {
      window.Tally.openPopup(FEEDBACK_FORM_ID, {
        hiddenFields: fields,
        emoji: { text: "👋", animation: "wave" },
      })
    } else {
      window.open(feedbackUrl(fields), "_blank", "noopener")
    }
  }

  return (
    <>
      <Script src="https://tally.so/widgets/embed.js" strategy="afterInteractive" />
      <button
        type="button"
        aria-label="Open feedback form"
        onClick={open}
        className="inline-flex items-center gap-2 rounded-md bg-foreground/5 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <MessageSquare className="h-4 w-4" />
        Feedback
      </button>
    </>
  )
}

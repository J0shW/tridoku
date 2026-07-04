import Script from "next/script"
import { MessageSquare } from "lucide-react"

/** Loads Tally's embed script and renders an inline feedback button. */
export function TallyWidget() {
  return (
    <>
      <Script src="https://tally.so/widgets/embed.js" strategy="afterInteractive" />
      <button
        type="button"
        aria-label="Open feedback form"
        data-tally-open="44qzGB"
        data-tally-emoji-text="👋"
        data-tally-emoji-animation="wave"
        className="inline-flex items-center gap-2 rounded-md bg-foreground/5 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <MessageSquare className="h-4 w-4" />
        Feedback
      </button>
    </>
  )
}

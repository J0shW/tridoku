import Script from "next/script"
import { MessageSquare } from "lucide-react"

/** Loads Tally's embed script and renders a floating feedback button. */
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
        className="fixed bottom-4 right-4 z-40 rounded-full bg-foreground/5 p-2 text-foreground/40 backdrop-blur-sm transition-colors hover:bg-foreground/10 hover:text-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <MessageSquare className="h-5 w-5" />
      </button>
    </>
  )
}

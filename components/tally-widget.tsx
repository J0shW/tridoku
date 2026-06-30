import Script from "next/script"

/** Loads Tally's embed script and renders a floating feedback button. */
export function TallyWidget() {
  return (
    <>
      <Script src="https://tally.so/widgets/embed.js" strategy="afterInteractive" />
      <button
        type="button"
        data-tally-open="44qzGB"
        data-tally-emoji-text="👋"
        data-tally-emoji-animation="wave"
        className="fixed bottom-24 right-5 z-40 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-lg transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        Feedback
      </button>
    </>
  )
}

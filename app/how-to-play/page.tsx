// "How to play Tridoku" (TRI-040): a static page that search engines can find for
// "triangular sudoku" and "tridoku rules", using the same diagrams as the rules modal.

import type { Metadata } from "next"
import Link from "next/link"
import { ChevronLeft, Play } from "lucide-react"
import {
  InnerTriangleExample,
  NoTouchingExample,
  OuterEdgesExample,
  PowerCellExample,
  RegionExample,
} from "@/components/rule-diagrams"
import { OG_IMAGE_SIZE, ogImagePath } from "@/lib/og"

const TITLE = "How to Play Tridoku: Rules of Triangular Sudoku"
const DESCRIPTION =
  "Tridoku is Sudoku on a triangle: 81 triangular cells, digits 1 to 9 and four rules. Learn the rules with diagrams, then play today's free daily puzzle."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/how-to-play" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://www.tridokupuzzle.com/how-to-play",
    siteName: "Tridoku",
    type: "article",
    images: [{ url: ogImagePath(), ...OG_IMAGE_SIZE, alt: "A Tridoku board: a triangular Sudoku, partly filled" }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
}

function PlayButton() {
  return (
    <Link
      href="/"
      className="inline-flex h-12 items-center gap-2 rounded-md bg-primary px-6 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Play className="h-5 w-5" aria-hidden="true" />
      Play today&apos;s puzzle
    </Link>
  )
}

function Rule({ n, title, children, diagram }: { n: number; title: string; children: React.ReactNode; diagram: React.ReactNode }) {
  return (
    <section aria-labelledby={`rule-${n}`} className="grid gap-4 sm:grid-cols-[1fr_200px] sm:items-center">
      <div>
        <h3 id={`rule-${n}`} className="text-xl font-semibold text-foreground">
          <span className="mr-2 text-primary">{n}.</span>
          {title}
        </h3>
        <div className="mt-2 space-y-2 text-muted-foreground leading-relaxed">{children}</div>
      </div>
      <div className="mx-auto w-full max-w-[220px]">{diagram}</div>
    </section>
  )
}

export default function HowToPlayPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Back to the game
          </Link>
          <span className="text-sm font-semibold text-foreground">Daily Tridoku</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-12 px-4 py-10">
        <div className="space-y-4 text-center">
          <h1 className="text-balance text-4xl font-bold text-foreground sm:text-5xl">How to play Tridoku</h1>
          <p className="text-pretty text-lg text-muted-foreground">
            Tridoku is Sudoku on a triangle. The board is one big triangle made of 81 small triangular cells,
            and you fill every cell with a digit from 1 to 9. There are four rules. A new puzzle comes out every
            day, in Easy, Medium and Hard.
          </p>
          <PlayButton />
        </div>

        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-foreground">The four rules</h2>

          <Rule n={1} title="Each region holds 1 to 9" diagram={<RegionExample />}>
            <p>
              Bold lines split the board into nine regions of nine cells each. Every region contains the
              digits 1 to 9 exactly once, like a 3×3 box in Sudoku.
            </p>
          </Rule>

          <Rule n={2} title="Each outer side holds 1 to 9" diagram={<OuterEdgesExample />}>
            <p>
              The nine cells along each of the big triangle&apos;s three sides contain 1 to 9 once each. On the
              board these cells are <strong className="text-foreground">lightly shaded</strong>.
            </p>
          </Rule>

          <Rule n={3} title="Each side of the inner triangle holds 1 to 9" diagram={<InnerTriangleExample />}>
            <p>
              An upside-down triangle sits in the middle of the board. The nine cells along each of its sides
              also contain 1 to 9 once each. These cells are a <strong className="text-foreground">shade deeper</strong>.
              A cell on both an outer side and the inner triangle has the <strong className="text-foreground">deepest shade</strong>,
              and follows both rules.
            </p>
          </Rule>

          <Rule n={4} title="The same digit never touches itself" diagram={<NoTouchingExample />}>
            <p>
              This is the rule Sudoku doesn&apos;t have. Two cells with the same digit may not touch, not even at
              a single corner point. Each cell touches up to 12 others.
            </p>
          </Rule>
        </div>

        <section aria-labelledby="first-tip" className="space-y-4">
          <h2 id="first-tip" className="text-2xl font-bold text-foreground">A tip for your first puzzle</h2>
          <div className="grid gap-4 sm:grid-cols-[1fr_240px] sm:items-center">
            <p className="text-muted-foreground leading-relaxed">
              Look just outside a region. A digit placed next to it rules out every cell inside the region that
              it touches, because of rule 4. One well-placed digit can rule out a whole row of a region, often
              leaving only one cell where that digit can go.
            </p>
            <div className="mx-auto w-full max-w-[260px]">
              <PowerCellExample />
            </div>
          </div>
        </section>

        <section aria-labelledby="difficulty" className="space-y-3">
          <h2 id="difficulty" className="text-2xl font-bold text-foreground">Easy, Medium and Hard</h2>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground leading-relaxed">
            <li><strong className="text-foreground">Easy</strong> is a great first puzzle.</li>
            <li><strong className="text-foreground">Medium</strong> needs one trick, like the tip above.</li>
            <li><strong className="text-foreground">Hard</strong> is for Sudoku regulars.</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed">
            Each difficulty has its own daily puzzle and its own streak. It&apos;s free, with no sign-up.
          </p>
        </section>

        <div className="border-t border-border pt-8 text-center">
          <PlayButton />
        </div>
      </main>
    </div>
  )
}

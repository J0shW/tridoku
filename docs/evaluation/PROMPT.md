# Evaluation brief

The brief used for the [baseline review](../reviews/2026-11-06-baseline.md). Re-use it unchanged at each milestone so results stay comparable. Add the milestone instructions from [README.md](README.md) after it.

---

# Role

You are a senior product expert with 15+ years of experience shipping consumer
products, especially casual and daily puzzle games (think of the habit loops
behind daily-puzzle hits, though you judge this product on its own merits).
You combine the instincts of a product manager, a UX/UI designer, a game
designer, a growth marketer and a staff-level engineer. You are direct and
specific, and your job is to make this product better, not to make its creator
feel good. Praise only what is actually working, and say why it works.

# Context

Tridoku is a Sudoku-style logic puzzle played on a triangular board. It is a
Next.js web app in the current repository. Key areas to examine:

- `app/page.tsx`, `app/layout.tsx`: entry point, metadata, SEO, OG image
- `components/tridoku-game.tsx`, `tridoku-board.tsx`, `number-pad.tsx`,
  `input-mode-toggle.tsx`, `game-controls.tsx`, `timer-display.tsx`,
  `difficulty-selector.tsx`: core gameplay and interaction
- `components/rules-modal.tsx`, `win-modal.tsx`, `stats-modal.tsx`:
  onboarding, reward moment, retention
- `components/kofi-widget.tsx`, `tally-widget.tsx`: monetization and feedback
- `hooks/use-tridoku.ts`, `lib/tridoku.ts`, `lib/puzzle-service.ts`: game
  state, rules, validation, generator, puzzle delivery
- `lib/analytics.ts`: what gets measured
- `scripts/generate-puzzles.mjs`, `.github/workflows/daily-puzzle.yml`,
  `public/puzzles/`: daily content pipeline
- `app/bts/`, `app/test/`: internal or behind-the-scenes routes
- `GENERATOR_IMPLEMENTATION.md`, `scripts/README.md`, `tutorial-intro.png`

# Process

1. **Explore first.** Read the code above and anything else relevant before
   judging. Do not guess at behavior you can verify.
2. **Run the app.** Start it (`pnpm install && pnpm dev`). With a headless
   browser, play at least one full puzzle on desktop (1440px) and mobile (390px)
   widths. Take screenshots of the first screen, the rules, mid-game, an error
   state, the win screen and the stats. Try it as a first-time player who has
   never heard of Tridoku.
3. **Run the build and lint** (`pnpm build`, `pnpm lint`) and note any problems.
4. **Analyze every area below.** For each one, ground your points in evidence:
   a file and line (`path:line`), a screenshot, or a reproduction step.

# Areas to evaluate

1. **Value proposition and positioning.** Is it clear within 5 seconds what
   Tridoku is and why someone should play? How does it stand apart from
   standard Sudoku and other daily puzzles? Who is the target player?
2. **First-time experience and onboarding.** Rules clarity, the triangular
   geometry and its constraints (adjacency, edges, regions), the time to the
   first successful move, and the risk of confusion or quitting.
3. **Core gameplay and puzzle design.** Fun, fairness, how well each difficulty
   tier matches its label, whether puzzles have a unique solution and can be
   solved by logic alone without guessing, error feedback, notes/pencil marks,
   undo, hints, and the pacing of the "aha" moments.
4. **UX and interaction design.** Touch targets, input modes, the number pad,
   keyboard support, cell selection on a triangular grid, mobile ergonomics,
   and any friction points.
5. **Visual design and brand.** Hierarchy, typography, color, dark mode,
   polish, consistency, the logo/icon/OG image, and whether it feels like a
   product people would want to share.
6. **Accessibility.** Contrast, color-only signals, screen-reader semantics for
   the board, focus management in modals, reduced motion, and keyboard-only play.
7. **Retention and habit loop.** Daily cadence, streaks, stats, the win moment,
   reasons to come back tomorrow, and notifications or reminders (present or
   missing).
8. **Virality and growth.** Shareable results (for example a spoiler-free
   share card), SEO, metadata, social previews, referral hooks.
9. **Monetization.** Effectiveness and placement of Ko-fi, whether it hurts the
   experience, and realistic alternatives (premium archive, ad-free, puzzle
   packs) with tradeoffs.
10. **Analytics and learning.** What events are tracked and what is missing.
    Define the 5–8 metrics that matter (D1/D7 retention, completion rate by
    difficulty, time-to-solve, abandonment point, share rate) and the events
    needed to measure them.
11. **Feedback loop.** Placement and value of the Tally widget, and how player
    feedback gets turned into decisions.
12. **Technical quality as it affects the product.** Performance (load time,
    bundle size, unused dependencies such as unused UI components), reliability
    of the daily puzzle pipeline (what happens if the Action fails, timezones,
    date rollover at midnight), state persistence, error handling, and
    exposure of internal routes (`/bts`, `/test`) or future puzzles in
    `public/`.
13. **Content strategy.** Puzzle supply, difficulty curve across the week,
    archive and back catalog, special or themed puzzles.

# Output format

Start with:

- **Executive summary**: 5 sentences max. What the product is, its biggest
  strength, its biggest risk, and the single highest-leverage change.
- **Scorecard**: a table rating each of the 13 areas from 1 to 10, with a
  one-line justification.

Then, for each area:

- **What's working** (brief)
- **Issues**: each with severity (Critical / High / Medium / Low), evidence
  (file:line, screenshot or reproduction steps), and why it matters to players
  or the business
- **Recommendations**: concrete and specific (what to change and where), not
  generic advice like "improve onboarding"

Finish with:

- **Prioritized roadmap**: a ranked list of the top 10 changes, each tagged
  with impact (H/M/L), effort (S/M/L), and which metric it should move.
  Separate "quick wins this week" from "bigger bets."
- **Open questions**: things you could not determine from the code or the
  running app that I should answer or test with real players.

# Rules

- Be specific and evidence-based. Every claim about the product should point
  to something you saw or read.
- Distinguish clearly between verified issues and hypotheses that need
  user testing.
- Don't pad. If an area is genuinely strong, say so in one line and move on.
- Don't modify any code. This is an analysis, not an implementation task.
- Think from the player's point of view first, then the business, then the
  engineering.

# M1 · First impression and sharing

**Goal.** Help first-time players understand the game in seconds, and give winners something worth sharing.

**Done when**
- A first-time visitor sees what the game is and the rules intro without looking for it.
- Rule colors are the same on every difficulty.
- Shares carry a spoiler-free grid, a correct puzzle number and an attributable link.
- Activation rate and share rate are measured against the M0 baseline.
- The milestone evaluation has been run and saved in `docs/reviews/` (see [evaluation](../evaluation/README.md)).

Items are listed in the suggested order of work. Status lives in [BACKLOG.md](BACKLOG.md).

<a id="tri-026"></a>
## TRI-026 · Say what Tridoku is on the first screen

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| High | H | S | Activation rate | none | 1.1, 1.a |

**Problem.** The welcome screen never says what the game is, that it's daily, or that it's Sudoku-like, and the board isn't shown.

**Done when**
- [x] The welcome hero shows a static preview of today's board.
- [x] One line explains the game, e.g. "Sudoku on a triangle. 81 cells, 4 rules, a new puzzle every day."

**Check it in a preview.** Dev tools → Clear all saved data, then view the first screen on a phone.

<a id="tri-027"></a>
## TRI-027 · First-time visitors get one clear way to start

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | H | S | Activation rate | [TRI-026](m1-first-impression.md#tri-026) | 1.c, 1.3 |

**Problem.** New players face three equal choices with no guidance.

**Done when**
- [x] With no saved stats, the welcome screen shows a primary "Play today's puzzle" button that starts Easy, with the tier picker below.
- [x] Returning players see the tier picker as now.

<a id="tri-028"></a>
## TRI-028 · Describe difficulties by experience, not givens

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | M | S | Completion rate by difficulty | [TRI-020](m0-foundations.md#tri-020) | 1.2, 1.b, 3.2 |

**Problem.** "40–50 starting numbers" means nothing to players, and the stated ranges are wrong (Hard says 24–30; actual 27–36).

**Done when**
- [x] Cards read e.g. "Easy · great first puzzle", "Medium · needs one trick", "Hard · for Sudoku regulars".
- [ ] Median solve times are added once TRI-020 has two weeks of data.
- [x] Given counts are removed from the UI.

<a id="tri-029"></a>
## TRI-029 · Rules intro opens automatically on first visit

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| High | H | M | Activation rate, Easy completion rate | none | 2.1, 2.3, 2.a |

**Problem.** The rules never open on their own, and the modal has 10 steps of which only 4 are rules.

**Done when**
- [x] On first visit the rules open as three cards: regions; edges and inner triangle; no touching.
- [x] Control tips move to a separate "Tips" tab in the same modal.
- [x] "How to Play" still opens the full rules any time.
- [x] `rules_step` events show how far players get.

**Check it in a preview.** Dev tools → Clear all saved data → reload.

<a id="tri-030"></a>
## TRI-030 · "Power Cells" tip appears when a player is stuck

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | M | S | Completion rate | [TRI-029](m1-first-impression.md#tri-029) | 2.b, 2.3 |

**Problem.** The most useful deduction is taught last in a long modal.

**Done when**
- [x] After 60 seconds without a correct entry, a dismissible tip explains power cells once per player.

<a id="tri-031"></a>
## TRI-031 · Same rule colors on every difficulty

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| High | H | S | Completion rate on Medium/Hard | none | 2.2, 2.c |

**Problem.** Blue means outer edge on Easy and inner triangle on Hard (`app/globals.css:52-63`); the rules teach only Easy's colors.

**Done when**
- [x] Outer edge, inner triangle and overlap use the same fills on all difficulties.
- [x] Difficulty is signalled by an accent (tab underline, board outline).
- [x] The rules modal diagrams match the board.

<a id="tri-032"></a>
## TRI-032 · Shade touching cells of the selected cell

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Low | M | S | Rule comprehension | none | 2.4, 2.d |

**Problem.** The no-touch rule is new compared with Sudoku and has no in-game cue.

**Done when**
- [x] Selecting a cell lightly shades its 12 touching neighbors.
- [x] The shade is subtle enough not to compete with errors or highlights, in both themes.

<a id="tri-033"></a>
## TRI-033 · Returning players continue where they left off

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | H | S | D1 retention | none | 4.3, 4.c |

**Problem.** A reload mid-puzzle drops players on the welcome screen; cards don't show progress.

**Done when**
- [x] If a puzzle is in progress today, the app opens it directly.
- [x] Difficulty cards show "Continue · 04:12" or "✓ Completed".

<a id="tri-034"></a>
## TRI-034 · Better win moment

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | H | S | D1 retention, multi-tier days | none | 7.4, 7.e |

**Problem.** The win modal says "Come back tomorrow" with no countdown and no next step.

**Done when**
- [x] A live countdown to the next puzzle.
- [x] A "Next: Medium →" button when another tier is unfinished.
- [x] Time compared with the player's best for that tier.

**Check it in a preview.** Dev tools → Fill all but 3 → finish.

<a id="tri-035"></a>
## TRI-035 · Share button stays available after winning

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | M | S | Share rate | none | 7.4 |

**Problem.** After closing the win modal, view mode has no way to share.

**Done when**
- [x] View mode shows a Share button that reopens the result card.

<a id="tri-036"></a>
## TRI-036 · Spoiler-free share grid

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| High | H | M | Share rate | [TRI-008](m0-foundations.md#tri-008) | 8.2, 8.b |

**Problem.** Share text is plain (time and streak only, `use-tridoku.ts:576`).

**Done when**
- [x] Share text includes a 9-region triangle grid (1/3/5 rows), colored by time or notes per region, plus number, difficulty, time and streak. *Colored by wrong entries: green for a region with none, yellow for one with at least one (`lib/share.ts`).*
- [x] The grid reveals nothing about the solution.
- [ ] It renders correctly in iMessage, WhatsApp, X and Discord. *Owner checked on iPhone (Notes, iMessage, WhatsApp, Discord), 7 Nov: top rows leaned left. A regular space per tile of indent fixed it; owner confirmed it looks right after the fix. Still to check: WhatsApp, Discord and X.*

<a id="tri-037"></a>
## TRI-037 · Share links are attributable

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | M | S | Share-driven visits | none | 8.2, 8.b |

**Problem.** Shared links are `window.location.href` with no tracking parameter.

**Done when**
- [x] Shared links use the canonical URL plus `?utm_source=share&utm_content=<difficulty>`.
- [ ] Umami reports visits by `utm_source`. *Owner check after release: Umami → UTM report.*

<a id="tri-038"></a>
## TRI-038 · Daily social preview image

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | M | M | Share click-through | [TRI-008](m0-foundations.md#tri-008) | 5.2, 5.b, 8.4 |

**Problem.** The OG image is a square generic triangle declared as a 2:1 card, so it's cropped and doesn't show the game.

**Done when**
- [x] A 1200×630 image generated with `next/og` shows a partly filled board, the tagline and today's puzzle number. *`/og?date=…`: that day's Easy givens. "Today" is the date in Edmonton (`lib/og.ts`).*
- [x] Twitter and Open Graph metadata point to it with correct sizes.

<a id="tri-039"></a>
## TRI-039 · robots.txt and sitemap

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | M | S | Organic visits | none | 8.3, 8.c, 12.8 |

**Problem.** `/robots.txt` and `/sitemap.xml` return 404.

**Done when**
- [x] `app/robots.ts` and `app/sitemap.ts` exist.
- [x] `/test` is disallowed; previews stay noindex. *Previews' robots.txt disallows everything, on top of the existing noindex tag.*

<a id="tri-040"></a>
## TRI-040 · "How to play Tridoku" page

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | M | S | Organic visits | [TRI-029](m1-first-impression.md#tri-029) | 8.3, 8.c |

**Problem.** Nothing on the site targets searches like "triangular sudoku" or "tridoku online".

**Done when**
- [x] A static `/how-to-play` page explains the four rules in text with diagrams. *Same diagrams as the rules modal, now in `components/rule-diagrams.tsx`.*
- [x] It has its own title and description and links to today's puzzle. *Also linked from the footer and listed in the sitemap.*

<a id="tri-041"></a>
## TRI-041 · Ko-fi prompt at the win moment

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | M | S | Ko-fi conversion | [TRI-019](m0-foundations.md#tri-019) | 9.1, 9.d |

**Problem.** Ko-fi is only in the footer, never at the moment of peak goodwill.

**Done when**
- [x] The win modal shows one line, "Enjoying Tridoku? Buy me a coffee ☕", at most once a week per player.
- [x] Clicks are tracked. *`kofi_opened {source: "win_modal"}`, plus `kofi_prompt_shown` for conversion.*

<a id="tri-042"></a>
## TRI-042 · One-tap difficulty rating after a win

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | H | S | Difficulty calibration | none | 11.b, 11.2 |

**Problem.** There's no signal for whether a puzzle felt too easy or too hard.

**Done when**
- [x] The win modal offers Too easy / Just right / Too hard.
- [x] The choice is sent as `difficulty_rated {difficulty, tier, rating, time}`. *Without `tier` until TRI-046 adds tiers.*

<a id="tri-043"></a>
## TRI-043 · Feedback form knows the context

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | M | S | Feedback usefulness | none | 11.1, 11.a |

**Problem.** Tally responses don't say which puzzle, difficulty or device.

**Done when**
- [x] The Feedback button passes hidden fields: puzzle number, date, difficulty, solved, device type, app version. *Sent as `puzzle_number`, `puzzle_date`, `difficulty`, `solved`, `device_type`, `app_version` (`lib/feedback-context.ts`). Each must also exist as a hidden field in the Tally form, or Tally drops it. Owner added them and confirmed a test response carried the values (8 Nov).*

<a id="tri-044"></a>
## TRI-044 · Weekly feedback review routine

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Low | M | S | Feedback turned into decisions | [TRI-043](m1-first-impression.md#tri-043) | 11.c, 11.2 |

**Problem.** Feedback isn't turned into decisions on a schedule.

**Done when**
- [ ] `docs/feedback.md` describes a weekly routine: tag responses (bug, rules confusion, difficulty, idea), file backlog items, note the related metric.
- [ ] Optionally ask for feedback after a Reset or long stall (test against the win-modal prompt).

<a id="tri-045"></a>
## TRI-045 · Launch post using the Behind the Scenes story

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Low | M | S | New visitors | [TRI-005](m0-foundations.md#tri-005), [TRI-008](m0-foundations.md#tri-008), [TRI-029](m1-first-impression.md#tri-029), [TRI-036](m1-first-impression.md#tri-036) | 8.5 |

**Problem.** `/bts` is a strong story for HN or Reddit but sharing it before the streak and onboarding fixes would waste the traffic.

**Done when**
- [ ] Post after M0 and the M1 onboarding and sharing items ship.
- [ ] Track the spike and D7 retention of that cohort.

<a id="tri-082"></a>
## TRI-082 · Evaluate PostHog as the analytics tool

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | H | S | Every metric in docs/metrics.md | [TRI-081](m0-foundations.md#tri-081) | Found in M0 (analytics tool review) |

**Problem.** Umami's free plan fits our needs poorly: funnels can't split by event property, retention is basic, data is kept 6 months, and Claude can't read the data (MCP needs Pro; free-plan API access unconfirmed). PostHog's free plan (1M events/month, 1-year retention) has property-filtered funnels, retention cohorts, identified players and session replay.

**Done when**
- [ ] Confirm on PostHog's site that the free plan includes API access and the PostHog MCP; if not, record that and stop.
- [ ] Add PostHog alongside Umami through `lib/analytics.ts`, loaded after the game is interactive, storing its ID in localStorage rather than a cookie, and identified with the existing anonymous player ID.
- [ ] Serve PostHog through the site's own domain with the visitor's real IP passed through, as TRI-081 does for Umami.
- [ ] Run both for 2–4 weeks; compare visitor and event counts, and check funnels and D1/D7 retention can be built for each difficulty.
- [ ] Decide: keep PostHog and remove Umami, or keep Umami. Update `docs/metrics.md` and the footer privacy note to match.

<a id="tri-084"></a>
## TRI-084 · Footer has side margins on phones

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Low | L | S | Polish | none | Found in M0 review |

**Problem.** At 390 px the footer privacy note runs edge to edge; the footer has no horizontal padding.

**Done when**
- [x] The footer keeps at least a 16 px side margin at every width.

<a id="tri-085"></a>
## TRI-085 · Update GitHub Actions to Node 24 versions

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Low | L | S | Pipeline reliability | none | Found in M0 review |

**Problem.** GitHub warns that actions/checkout@v4 and actions/setup-node@v4 target the deprecated Node 20 and are being forced onto Node 24.

**Done when**
- [ ] Both workflows use action versions that run on Node 24 (e.g. checkout@v5, setup-node@v5), with no deprecation warning in the run log. *checkout, setup-node and pnpm/action-setup are on v5, all `node24`. Tick once a CI run and a daily-puzzle run show no warning.*

<a id="tri-086"></a>
## TRI-086 · Completed checkmarks refresh after midnight in an open tab

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Low | M | S | D1 retention | none | Found in M0 review |

**Problem.** Stats are normalised once on page load, so in a tab left open past midnight the welcome cards and difficulty tabs still show yesterday's "✓ Completed" until reload. Opening the difficulty correctly loads today's puzzle.

**Done when**
- [x] When the local date changes (checked on focus, visibility change or a timer), stats are re-normalised and the checkmarks update. *`lib/date-watch.ts`: every minute, plus on focus and visibility change.*
- [x] Covered by a test using the dev-tools clock or fake timers. *`tests/date-watch.test.ts`.*

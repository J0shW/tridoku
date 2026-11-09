# Backlog

The list of everything we plan to do, built from the [baseline review](../reviews/2026-11-06-baseline.md). How it works: [README](README.md).

**87 items** · 31 todo · 2 in progress · 3 in review · 49 done · 2 won't do · plus 13 [research items](research.md)

## [M0 · Foundations and critical fixes](m0-foundations.md)

Make the game trustworthy and start measuring before changing anything players see.

| ID | Item | Severity | Impact | Effort | Depends on | Status |
|---|---|---|---|---|---|---|
| [TRI-001](m0-foundations.md#tri-001) | Test runner and CI checks on every PR | High | H | S | — | Done |
| [TRI-002](m0-foundations.md#tri-002) | Working ESLint setup | Medium | L | S | TRI-001 | Done |
| [TRI-003](m0-foundations.md#tri-003) | Turn type checking back on in builds | Medium | M | S | TRI-001 | Done |
| [TRI-004](m0-foundations.md#tri-004) | One date-key helper used everywhere | High | H | S | TRI-001 | Done |
| [TRI-005](m0-foundations.md#tri-005) | Fix streaks resetting to 1 | Critical | H | S | TRI-004 | Done |
| [TRI-006](m0-foundations.md#tri-006) | Credit each completion to the puzzle's own date | High | H | S | TRI-004 | Done |
| [TRI-007](m0-foundations.md#tri-007) | Make win % meaningful | High | M | S | — | Done |
| [TRI-008](m0-foundations.md#tri-008) | Same puzzle number for everyone on the same date | High | H | S | TRI-004 | Done |
| [TRI-009](m0-foundations.md#tri-009) | Replace the unsolvable backup puzzle | Critical | H | S | TRI-001 | Done |
| [TRI-010](m0-foundations.md#tri-010) | Fall back to the most recent real puzzle | Medium | M | M | TRI-009 | Done |
| [TRI-011](m0-foundations.md#tri-011) | Show an error and Retry when puzzles fail to load | High | H | S | — | Done |
| [TRI-012](m0-foundations.md#tri-012) | Alert when the puzzle pipeline falls behind | High | H | S | — | Done |
| [TRI-013](m0-foundations.md#tri-013) | Validate every puzzle in CI | High | M | S | TRI-001 | Done |
| [TRI-014](m0-foundations.md#tri-014) | Exercise the year rollover | Medium | M | S | TRI-001 | Done |
| [TRI-015](m0-foundations.md#tri-015) | Anonymous player ID and days-since-first-play on events | High | H | S | — | Done |
| [TRI-016](m0-foundations.md#tri-016) | Track puzzle starts | High | H | S | TRI-015 | Done |
| [TRI-017](m0-foundations.md#tri-017) | Track where players stop | High | H | S | TRI-015 | Done |
| [TRI-018](m0-foundations.md#tri-018) | Accurate share tracking | Medium | M | S | — | Done |
| [TRI-019](m0-foundations.md#tri-019) | Track rules depth, Ko-fi, Feedback and play style | Medium | M | S | TRI-015 | Done |
| [TRI-020](m0-foundations.md#tri-020) | Metrics definitions and dashboard | Medium | H | S | TRI-016, TRI-017, TRI-018 | In progress |
| [TRI-021](m0-foundations.md#tri-021) | Fix the stray "0" in Statistics | Low | L | S | — | Done |
| [TRI-022](m0-foundations.md#tri-022) | Hide /test outside development | Low | L | S | — | Done |
| [TRI-023](m0-foundations.md#tri-023) | Remove unused UI components and dependencies | Medium | L | S | TRI-001 | Done |
| [TRI-024](m0-foundations.md#tri-024) | Project housekeeping | Low | L | S | — | Done |
| [TRI-025](m0-foundations.md#tri-025) | Repeatable evaluation harness | Medium | M | S | — | Done |
| [TRI-081](m0-foundations.md#tri-081) | Serve Umami from the site's own domain | High | H | S | TRI-015 | In review |
| [TRI-083](m0-foundations.md#tri-083) | Daily Action installs dependencies; CI runs the Action's grader | Critical | H | S | TRI-013 | Done |

## [M1 · First impression and sharing](m1-first-impression.md)

Help first-time players understand the game in seconds, and give winners something worth sharing.

| ID | Item | Severity | Impact | Effort | Depends on | Status |
|---|---|---|---|---|---|---|
| [TRI-026](m1-first-impression.md#tri-026) | Say what Tridoku is on the first screen | High | H | S | — | Done |
| [TRI-027](m1-first-impression.md#tri-027) | First-time visitors get one clear way to start | Medium | H | S | TRI-026 | Done |
| [TRI-028](m1-first-impression.md#tri-028) | Describe difficulties by experience, not givens | Medium | M | S | TRI-020 | In progress |
| [TRI-029](m1-first-impression.md#tri-029) | Rules intro opens automatically on first visit | High | H | M | — | Done |
| [TRI-030](m1-first-impression.md#tri-030) | "Power Cells" tip appears when a player is stuck | Medium | M | S | TRI-029 | Done |
| [TRI-031](m1-first-impression.md#tri-031) | Same rule colors on every difficulty | High | H | S | — | Done |
| [TRI-032](m1-first-impression.md#tri-032) | Shade touching cells of the selected cell | Low | M | S | — | Done |
| [TRI-033](m1-first-impression.md#tri-033) | Returning players continue where they left off | Medium | H | S | — | Done |
| [TRI-034](m1-first-impression.md#tri-034) | Better win moment | Medium | H | S | — | Done |
| [TRI-035](m1-first-impression.md#tri-035) | Share button stays available after winning | Medium | M | S | — | Done |
| [TRI-036](m1-first-impression.md#tri-036) | Spoiler-free share grid | High | H | M | TRI-008 | Done |
| [TRI-037](m1-first-impression.md#tri-037) | Share links are attributable | Medium | M | S | — | In review |
| [TRI-038](m1-first-impression.md#tri-038) | Daily social preview image | Medium | M | M | TRI-008 | Done |
| [TRI-039](m1-first-impression.md#tri-039) | robots.txt and sitemap | Medium | M | S | — | Done |
| [TRI-040](m1-first-impression.md#tri-040) | "How to play Tridoku" page | Medium | M | S | TRI-029 | Done |
| [TRI-041](m1-first-impression.md#tri-041) | Ko-fi prompt at the win moment | Medium | M | S | TRI-019 | Done |
| [TRI-042](m1-first-impression.md#tri-042) | One-tap difficulty rating after a win | Medium | H | S | — | Done |
| [TRI-043](m1-first-impression.md#tri-043) | Feedback form knows the context | Medium | M | S | — | Done |
| [TRI-044](m1-first-impression.md#tri-044) | Weekly feedback review routine | Low | M | S | TRI-043 | Won't do |
| [TRI-045](m1-first-impression.md#tri-045) | Launch post using the Behind the Scenes story | Low | M | S | TRI-005, TRI-008, TRI-029, TRI-036 | Todo |
| [TRI-082](m1-first-impression.md#tri-082) | Evaluate PostHog as the analytics tool | Medium | H | S | TRI-081 | Todo |
| [TRI-084](m1-first-impression.md#tri-084) | Footer has side margins on phones | Low | L | S | — | Done |
| [TRI-085](m1-first-impression.md#tri-085) | Update GitHub Actions to Node 24 versions | Low | L | S | — | Done |
| [TRI-086](m1-first-impression.md#tri-086) | Completed checkmarks refresh after midnight in an open tab | Low | M | S | — | Done |

## [M2 · Puzzle quality and gameplay](m2-puzzle-quality.md)

Make every label honest and every puzzle fair, and give stuck players a way forward.

| ID | Item | Severity | Impact | Effort | Depends on | Status |
|---|---|---|---|---|---|---|
| [TRI-046](m2-puzzle-quality.md#tri-046) | Grade puzzles by solving technique | Critical | H | M | TRI-013, R-13 | Todo |
| [TRI-047](m2-puzzle-quality.md#tri-047) | Accept puzzles only at the right tier | Critical | H | S | TRI-046 | Todo |
| [TRI-048](m2-puzzle-quality.md#tri-048) | Uniqueness check can't report a false "unique" | Low | M | S | — | Todo |
| [TRI-049](m2-puzzle-quality.md#tri-049) | Weekly difficulty rhythm | Medium | M | S | TRI-047 | Todo |
| [TRI-050](m2-puzzle-quality.md#tri-050) | Grade puzzles in the daily Action | Medium | M | S | TRI-046 | Todo |
| [TRI-051](m2-puzzle-quality.md#tri-051) | Serve one puzzle file per day | Medium | M | M | TRI-010 | Todo |
| [TRI-052](m2-puzzle-quality.md#tri-052) | Undo | High | H | S | — | Done |
| [TRI-053](m2-puzzle-quality.md#tri-053) | Remove placed digits from notes automatically | High | H | S | — | Todo |
| [TRI-054](m2-puzzle-quality.md#tri-054) | Hint: show a cell that can be solved now | Medium | H | M | TRI-046 | Todo |
| [TRI-055](m2-puzzle-quality.md#tri-055) | Tell players when a full board is wrong | Medium | M | S | — | Todo |
| [TRI-056](m2-puzzle-quality.md#tri-056) | Dim digits that are fully placed | Low | M | S | — | Todo |
| [TRI-057](m2-puzzle-quality.md#tri-057) | Make highlight-a-digit discoverable | Low | L | S | — | Todo |
| [TRI-080](m2-puzzle-quality.md#tri-080) | Restructure the game-state hook | Medium | M | M | TRI-052 | Done |

## [M3 · Mobile and accessibility](m3-mobile-accessibility.md)

Make the game comfortable on small phones and playable without a mouse, a touchscreen or full sight.

| ID | Item | Severity | Impact | Effort | Depends on | Status |
|---|---|---|---|---|---|---|
| [TRI-058](m3-mobile-accessibility.md#tri-058) | Board and number pad fit small phones | High | H | M | — | Done |
| [TRI-059](m3-mobile-accessibility.md#tri-059) | Larger, more forgiving tap targets | High | H | S | — | In review |
| [TRI-087](m3-mobile-accessibility.md#tri-087) | Clearer game controls | Medium | M | S | — | Done |
| [TRI-060](m3-mobile-accessibility.md#tri-060) | Readable pencil marks | Medium | M | S | — | Todo |
| [TRI-061](m3-mobile-accessibility.md#tri-061) | Player entries look different from givens | Medium | M | S | — | Todo |
| [TRI-062](m3-mobile-accessibility.md#tri-062) | Keyboard-playable board | Critical | M | M | — | Todo |
| [TRI-063](m3-mobile-accessibility.md#tri-063) | Screen-reader labels for the board | High | M | M | TRI-062 | Todo |
| [TRI-064](m3-mobile-accessibility.md#tri-064) | Spoken announcements | Medium | M | S | TRI-063 | Todo |
| [TRI-065](m3-mobile-accessibility.md#tri-065) | Errors visible without color | High | H | S | — | Todo |
| [TRI-066](m3-mobile-accessibility.md#tri-066) | Respect reduced motion | Medium | L | S | — | Todo |
| [TRI-067](m3-mobile-accessibility.md#tri-067) | Readable welcome card text | Medium | M | S | — | Done |
| [TRI-068](m3-mobile-accessibility.md#tri-068) | Region lines visible in dark mode | High | M | S | — | Todo |

## [M4 · Depth and revenue](m4-depth-revenue.md)

Give committed players more to do and test whether they will pay for it.

| ID | Item | Severity | Impact | Effort | Depends on | Status |
|---|---|---|---|---|---|---|
| [TRI-069](m4-depth-revenue.md#tri-069) | A daily streak that counts any difficulty | Medium | H | S | TRI-005 | Todo |
| [TRI-070](m4-depth-revenue.md#tri-070) | Installable app | Medium | M | S | — | Todo |
| [TRI-071](m4-depth-revenue.md#tri-071) | Opt-in daily reminders (experiment) | Medium | M | M | TRI-070 | Todo |
| [TRI-072](m4-depth-revenue.md#tri-072) | Keep stats when switching devices | Medium | M | M | — | Todo |
| [TRI-073](m4-depth-revenue.md#tri-073) | Puzzle archive | Medium | H | M | TRI-051 | Todo |
| [TRI-074](m4-depth-revenue.md#tri-074) | Paid full archive (experiment) | Low | M | M | TRI-073, TRI-015 | Todo |
| [TRI-075](m4-depth-revenue.md#tri-075) | Printable puzzle packs | Low | M | M | TRI-046 | Todo |
| [TRI-076](m4-depth-revenue.md#tri-076) | Sunday Expert puzzle | Low | M | S | TRI-046 | Todo |
| [TRI-077](m4-depth-revenue.md#tri-077) | Special and themed puzzles | Low | L | M | TRI-046 | Todo |
| [TRI-078](m4-depth-revenue.md#tri-078) | Logo and favicon | Low | M | S | — | Todo |
| [TRI-079](m4-depth-revenue.md#tri-079) | No ads | — | — | — | — | Won't do |

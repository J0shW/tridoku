# M0 · Foundations and critical fixes

**Goal.** Make the game trustworthy and start measuring before changing anything players see.

**Done when**
- Streaks, puzzle numbers and midnight behave correctly (TRI-005, TRI-006, TRI-008).
- No path can show players an unsolvable or missing puzzle without an error and a Retry (TRI-009, TRI-011, TRI-012).
- Analytics events for starts, stops and retention are live, and two weeks of baseline data are collected before M1 ships (TRI-015 to TRI-020).
- `pnpm test`, `pnpm lint` and type checks pass in CI.
- The milestone evaluation has been run and saved in `docs/reviews/` (see [evaluation](../evaluation/README.md)).

Items are listed in the suggested order of work. Status lives in [BACKLOG.md](BACKLOG.md).

<a id="tri-001"></a>
## TRI-001 · Test runner and CI checks on every PR

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| High | H | S | Regressions caught before merge | none | 12.5, 12.c |

**Problem.** There are no automated tests, type checking is skipped during builds and nothing runs on pull requests. Most M0 fixes touch date logic that is easy to break silently.

**Done when**
- [x] Vitest added as a dev dependency with a `pnpm test` script.
- [x] A GitHub Actions workflow runs `pnpm test`, `pnpm lint` and `tsc --noEmit` on every pull request.
- [x] At least one smoke test exists (e.g. `createEmptyBoard()` has 81 visible cells, 9 regions of 9).

<a id="tri-002"></a>
## TRI-002 · Working ESLint setup

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | L | S | Code quality | [TRI-001](m0-foundations.md#tri-001) | 12.5, 12.e |

**Problem.** `pnpm lint` fails: ESLint 10 finds no config file and ESLint isn't a dependency.

**Done when**
- [x] `eslint` and `eslint-config-next` added as dev dependencies.
- [x] An `eslint.config.mjs` flat config exists.
- [x] `pnpm lint` passes (fix or explicitly disable existing violations).

<a id="tri-003"></a>
## TRI-003 · Turn type checking back on in builds

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | M | S | Code quality | [TRI-001](m0-foundations.md#tri-001) | 12.5, 12.e |

**Problem.** `next.config.mjs:4` sets `ignoreBuildErrors: true`. `tsc` reports one error (`components/win-modal.tsx:36`, `navigator.share` checked as a function reference).

**Done when**
- [x] The `win-modal.tsx:36` error is fixed.
- [x] `ignoreBuildErrors` is removed.
- [x] `pnpm build` passes with type checking.

<a id="tri-004"></a>
## TRI-004 · One date-key helper used everywhere

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| High | H | S | Prevents date bugs | [TRI-001](m0-foundations.md#tri-001) | 7.a, 7.1 |

**Problem.** Dates are formatted in at least three different ways (`getTodayString`, the inline `yesterdayStr`, `puzzle-service`), which caused the streak bug.

**Done when**
- [ ] `lib/dates.ts` exports `toDateKey(date)` (local `YYYY-MM-DD`, zero-padded) and `daysBetween(a, b)` (calendar days, via `date-fns` `differenceInCalendarDays`).
- [ ] Every place that builds or compares a date key uses these helpers.
- [ ] Unit tests cover single-digit months/days, month and year boundaries, and DST change days.

<a id="tri-005"></a>
## TRI-005 · Fix streaks resetting to 1

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Critical | H | S | D7 retention, average streak length | [TRI-004](m0-foundations.md#tri-004) | 7.1 |

**Problem.** `lastPlayedDate` is saved zero-padded (`2026-11-05`, `hooks/use-tridoku.ts:185`) but "yesterday" is built unpadded (`2026-11-5`, `use-tridoku.ts:282`). They only match on ~73 days a year, so streaks reset to 1 about 80% of the time.

**Done when**
- [ ] Streak continues when the previous completion was the previous calendar day, on every date of the year.
- [ ] Streak resets to 1 after a missed day.
- [ ] Existing saved stats in both date formats are read correctly (no player loses their history).
- [ ] Unit tests cover 1–9 Nov, 31 Dec → 1 Jan and a missed day.

**Check it in a preview.** Dev tools → Seed 5-day streak → Fill all but 3 → finish: streak reads 6. Then +1 day, solve again: 7.

<a id="tri-006"></a>
## TRI-006 · Credit each completion to the puzzle's own date

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| High | H | S | Data integrity, D1 retention | [TRI-004](m0-foundations.md#tri-004) | 7.3, 7.b |

**Problem.** Finishing a puzzle after midnight records it as the next day's completion. The real next-day puzzle then opens in view mode showing yesterday's board and can't be played.

**Done when**
- [ ] Completions, streaks and `todaysPuzzle` are keyed to the date of the puzzle being solved.
- [ ] A puzzle started before midnight and finished after it counts for its own date.
- [ ] After midnight, the next day's puzzle is playable even if yesterday's was finished late.

**Check it in a preview.** Dev tools → Tonight 23:58 → start Easy → wait 2 minutes → finish. Reload: today's Easy is playable, not in view mode.

<a id="tri-007"></a>
## TRI-007 · Make win % meaningful

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| High | M | S | Completion rate | none | 7.2, 7.d |

**Problem.** `gamesPlayed` only increments on a win (`use-tridoku.ts:274`), so win % is always 100%.

**Done when**
- [ ] A game counts as played on its first digit or pencil mark (once per puzzle per day).
- [ ] Win % = won ÷ played.
- [ ] Existing stats are migrated without inflating or zeroing counts.

<a id="tri-008"></a>
## TRI-008 · Same puzzle number for everyone on the same date

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| High | H | S | Share accuracy | [TRI-004](m0-foundations.md#tri-004) | 8.1, 8.a, 13.3 |

**Problem.** The number is counted from UTC midnight on 1 Jan 2026 and rounded up (`lib/tridoku.ts:311-314`), but puzzles change at local midnight. On 6 Nov LA showed #310 in the morning and #311 in the evening; Tokyo showed #309.

**Done when**
- [ ] The puzzle number is derived from the puzzle's date key, so the same date gives the same number in every time zone.
- [ ] Decide and document whether #1 stays 1 Jan 2026 or moves to the first published puzzle (21 Mar). Changing it renumbers every past share, so the default is to keep 1 Jan.
- [ ] Unit tests cover several time zones.

**Check it in a preview.** Dev tools → Tonight 23:58: the number stays the same until the puzzle changes at midnight.

<a id="tri-009"></a>
## TRI-009 · Replace the unsolvable backup puzzle

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Critical | H | S | Puzzle availability | [TRI-001](m0-foundations.md#tri-001) | 12.1, 12.a |

**Problem.** The fallback in `lib/puzzle-service.ts:78` is 82 characters; its first 81 put two 3s on the same outer edge. If the Action fails for 3+ days, every player gets an impossible puzzle on all three difficulties.

**Done when**
- [ ] The fallback is a known-good puzzle per difficulty.
- [ ] A unit test proves each fallback has exactly one solution and no conflicting givens.

<a id="tri-010"></a>
## TRI-010 · Fall back to the most recent real puzzle

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | M | M | Puzzle availability | [TRI-009](m0-foundations.md#tri-009) | 12.a |

**Problem.** Even a valid static fallback is the same puzzle every time. A recent real puzzle is a better experience during an outage.

**Done when**
- [ ] If today's date is missing, the app serves the most recent available date's puzzle for that difficulty and shows a small notice.
- [ ] The static fallback is used only if no puzzles load at all.

<a id="tri-011"></a>
## TRI-011 · Show an error and Retry when puzzles fail to load

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| High | H | S | Puzzle availability | none | 12.2, 12.b |

**Problem.** If `/puzzles/<year>.json` fails, choosing a difficulty does nothing: no board, no message (`use-tridoku.ts:544`).

**Done when**
- [ ] A failed load shows "Couldn't load today's puzzle" with a Retry button.
- [ ] Retry refetches without reloading the page.
- [ ] The failure is tracked as an analytics event.

<a id="tri-012"></a>
## TRI-012 · Alert when the puzzle pipeline falls behind

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| High | H | S | Puzzle availability | none | 12.3, 12.c |

**Problem.** The daily Action has no alerting. If it stops (failure, or GitHub disabling scheduled workflows after 60 days of repo inactivity) players get the fallback after 3 days.

**Done when**
- [ ] The Action fails when fewer than 3 future days exist after it runs, which emails the repo owner.
- [ ] A second scheduled check (or the same job) verifies the live site serves today's puzzle.
- [ ] Document whether bot commits keep the schedule alive; if not, add a keep-alive.

<a id="tri-013"></a>
## TRI-013 · Validate every puzzle in CI

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| High | M | S | Puzzle quality | [TRI-001](m0-foundations.md#tri-001) | 12.c, 3.5 |

**Problem.** Nothing checks generated puzzles after the generator runs. A bad puzzle would ship silently.

**Done when**
- [x] A test checks every puzzle in `public/puzzles/*.json`: 81 characters, no conflicting givens, exactly one solution (independent solver, no iteration cap).
- [x] The test runs on PRs and in the daily Action before committing.

<a id="tri-014"></a>
## TRI-014 · Exercise the year rollover

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | M | S | Puzzle availability | [TRI-001](m0-foundations.md#tri-001) | 12.4 |

**Problem.** On 1 Jan the app fetches `2027.json`, which the Action creates on 29 Dec. The path has never run.

**Done when**
- [ ] Tests cover fetching across 31 Dec → 1 Jan, including a player who keeps the tab open across New Year.
- [ ] Confirm the Action writes `2027.json` correctly (dry run with a 2027 date).

**Check it in a preview.** Dev tools: shift the clock to 31 Dec 23:58 and finish a puzzle after midnight.

<a id="tri-015"></a>
## TRI-015 · Anonymous player ID and days-since-first-play on events

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| High | H | S | D1/D7 retention (measurable) | none | 10.6 |

**Problem.** Without a stable ID, retention can't be measured.

**Done when**
- [ ] A random anonymous ID and `first_play_date` are created in localStorage on first visit.
- [ ] Every event includes `days_since_first` (and the ID if Umami's plan supports distinct IDs).
- [ ] No personal data is collected; the privacy note in the footer says so.

<a id="tri-016"></a>
## TRI-016 · Track puzzle starts

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| High | H | S | Activation rate, completion rate | [TRI-015](m0-foundations.md#tri-015) | 10.1 |

**Problem.** `{diff}_loaded` fires on load and on Reset, so it isn't a start signal.

**Done when**
- [ ] `puzzle_started {difficulty, ms_since_load, rules_seen}` fires on the first entry of each puzzle.
- [ ] Reset fires its own event instead of `_loaded`.

<a id="tri-017"></a>
## TRI-017 · Track where players stop

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| High | H | S | Abandonment point | [TRI-015](m0-foundations.md#tri-015) | 10.2 |

**Problem.** Closing the tab mid-puzzle is the most common way to quit and isn't recorded.

**Done when**
- [ ] `session_end {difficulty, pct_filled, time}` is sent with `navigator.sendBeacon` when the page is hidden with an unfinished puzzle.
- [ ] It fires at most once per visit.

<a id="tri-018"></a>
## TRI-018 · Accurate share tracking

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | M | S | Share rate | none | 10.3 |

**Problem.** `result_shared` fires before the share sheet resolves, so cancels count. The copy button isn't tracked (`win-modal.tsx:55`).

**Done when**
- [ ] Share is tracked after the outcome (`shared` or `cancelled`).
- [ ] Copy is tracked as `result_copied`.

<a id="tri-019"></a>
## TRI-019 · Track rules depth, Ko-fi, Feedback and play style

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | M | S | Rules effect, monetization | [TRI-015](m0-foundations.md#tri-015) | 10.4, 10.5, 10.7, 9.2 |

**Problem.** Rules depth, Ko-fi and Feedback opens, errors and note usage are invisible.

**Done when**
- [ ] `rules_step {n}` and `rules_completed` events.
- [ ] `kofi_opened` and `feedback_opened` events.
- [ ] Completion events include `errors`, `pencil_marks`, `resets` (and `undos` once TRI-052 ships).

<a id="tri-020"></a>
## TRI-020 · Metrics definitions and dashboard

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | H | S | All metrics | [TRI-016](m0-foundations.md#tri-016), [TRI-017](m0-foundations.md#tri-017), [TRI-018](m0-foundations.md#tri-018) | 10 (metrics table) |

**Problem.** The eight metrics in the review need one agreed definition and a place to read them.

**Done when**
- [ ] `docs/metrics.md` defines each metric, its formula and its events.
- [ ] An Umami dashboard (or saved reports) shows them.
- [ ] Decide whether to keep Vercel Analytics alongside Umami; remove it if unused.

<a id="tri-021"></a>
## TRI-021 · Fix the stray "0" in Statistics

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Low | L | S | Polish | none | 5.4 |

**Problem.** `stats-modal.tsx:93` uses `{stats.bestTime && …}`, which renders `0` when best time is 0.

**Done when**
- [x] Numeric conditions use explicit checks (`!= null`) across the codebase.

<a id="tri-022"></a>
## TRI-022 · Hide /test outside development

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Low | L | S | Polish | none | 12.8, 12.f |

**Problem.** `/test` is public and runs the generator on the main thread, freezing the tab.

**Done when**
- [x] `/test` returns 404 in production (previews and `pnpm dev` keep it).
- [x] `/bts` stays public (it's a growth asset) but `/test` is excluded from search.

<a id="tri-023"></a>
## TRI-023 · Remove unused UI components and dependencies

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | L | S | Install time, maintenance | [TRI-001](m0-foundations.md#tri-001) | 12.6, 12.e |

**Problem.** Only 8 of ~57 `components/ui` files are imported. recharts, react-hook-form, zod, cmdk, embla, vaul, react-day-picker, input-otp and sonner are unused.

**Done when**
- [x] Unused `components/ui` files and dependencies are deleted.
- [x] `pnpm build` and the app work unchanged.

<a id="tri-024"></a>
## TRI-024 · Project housekeeping

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Low | L | S | Maintenance | none | 12.5, 12.e |

**Problem.** Both `yarn.lock` and `pnpm-lock.yaml` exist, the package is named `my-project`, the metadata says `generator: 'v0.app'`, and `scripts/README.md` describes placeholder puzzles that no longer exist.

**Done when**
- [x] `yarn.lock` removed; `packageManager` set in `package.json`.
- [x] Package renamed to `tridoku`.
- [x] `generator` meta removed.
- [x] `scripts/README.md` updated to describe the real pipeline.

<a id="tri-025"></a>
## TRI-025 · Repeatable evaluation harness

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | M | S | Review quality | none | Evaluation plan |

**Problem.** Milestone reviews need to be comparable with the baseline.

**Done when**
- [x] `docs/evaluation/PROMPT.md` holds the original brief.
- [x] `scripts/eval/` holds the puzzle grader and the browser play-through.
- [x] `docs/evaluation/README.md` explains how to run a milestone review.

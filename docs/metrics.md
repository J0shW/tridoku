# Metrics

What we measure, how, and where to read it. Events are sent to Umami (`lib/analytics.ts`) only from the production domain.

## Baseline (before M0 analytics)

From Vercel Analytics, which only keeps 31 days on the current plan:

| Period | Visitors | Page views | Mobile visitors |
|---|---|---|---|
| 8 Oct – 6 Nov 2026 | 44 | 55 | 27 (61%) |

Traffic is small, so expect weekly numbers to swing a lot. Compare four-week windows, and treat any metric built on fewer than ~30 players as a hint, not a result.

## The eight metrics

| Metric | Formula | Events |
|---|---|---|
| **Activation** | Players with a `puzzle_started` within 3 minutes of load ÷ players who loaded the page | `puzzle_started.ms_since_load`, page views |
| **Completion rate** | `{difficulty}_completed` ÷ `puzzle_started`, by difficulty (and by tier once TRI-046 adds it) | `puzzle_started.difficulty`, `{difficulty}_completed` |
| **D1 / D7 retention** | Of players whose first visit was day N, the share with any event on day N+1 / N+7 | Every event's `days_since_first`; Umami's identified player ID |
| **Median solve time** | Median `time` on `{difficulty}_completed`, by difficulty | `{difficulty}_completed.time` |
| **Abandonment point** | Distribution of `pct_filled` when players leave without finishing | `session_end`, `{difficulty}_abandoned` (both have `pct_filled`) |
| **Share rate** | (`result_shared` with outcome `shared` or `copied`, plus `result_copied`) ÷ completions; share-driven visits once TRI-037 adds `utm_source=share` | `result_shared.outcome`, `result_copied` |
| **Multi-tier days** | Players completing 2+ difficulties on the same day ÷ players completing any | `{difficulty}_completed` per player per day |
| **Rules effect** | Completion rate for players with `rules_seen = true` vs `false` on `puzzle_started`; share of `rules_opened` that reach `rules_completed` | `puzzle_started.rules_seen`, `rules_step`, `rules_completed` |

## All events

Every event also carries `days_since_first` (whole days since this browser's first visit). The browser is identified to Umami with a random anonymous ID (`tridoku-player` in localStorage), so per-player counts work. No personal data is collected; the footer says so.

| Event | When | Data |
|---|---|---|
| `{difficulty}_loaded` | A difficulty is chosen | — |
| `puzzle_started` | First digit or note in a puzzle (once per puzzle) | `difficulty`, `ms_since_load`, `rules_seen` |
| `{difficulty}_completed` | Puzzle solved (once per puzzle) | `difficulty`, `time` (s), `errors` (entries that broke a rule), `pencil_marks` (notes added), `resets` |
| `{difficulty}_abandoned` | Reset, or switching difficulty mid-puzzle | `difficulty`, `reason` (`reset` / `switch_difficulty`), `time`, `pct_filled` |
| `session_end` | Page hidden with an unfinished, started puzzle (once per page load) | `difficulty`, `pct_filled`, `time` |
| `result_shared` | Share button | `difficulty`, `method` (`native_share` / `clipboard`), `outcome` (`shared` / `cancelled` / `copied` / `failed`) |
| `result_copied` | Copy button | `difficulty` |
| `rules_opened` | How to Play opened | — |
| `rules_step` | Rules page changed | `n` (1-based), `of` |
| `rules_completed` | Last rules page reached | — |
| `error_check_toggled` | Show errors on/off | `enabled`, `difficulty` |
| `kofi_opened` | Support me opened | — |
| `feedback_opened` | Feedback opened | — |
| `puzzle_load_failed` | Puzzles couldn't be downloaded | `difficulty`, `reason` |
| `puzzle_fallback_served` | Today's puzzle missing; another was served | `difficulty`, `source` (date or `backup`) |

`session_end` is sent through Umami's tracker as the page is hidden. Browsers usually deliver such requests, but some may be lost, so treat abandonment counts as a lower bound.

## Setting up Umami reports

To do in the Umami dashboard (Claude has no access to it):

1. **Funnel**: page view → `puzzle_started` → `easy_completed` (repeat for medium and hard), window 1 day. Gives activation and completion.
2. **Retention**: on any event, break down by `days_since_first`. Players active on day N+1 or N+7 of their first visit show up as `days_since_first` = 1 or 7. Umami's built-in Retention report is a cross-check, but it groups by Umami's own visitor tracking, which may not match the anonymous ID.
3. **Event data**: `easy_completed` / `medium_completed` / `hard_completed` by `time`, `errors`, `pencil_marks`; `session_end` and `*_abandoned` by `pct_filled`; `result_shared` by `outcome`; `puzzle_started` by `rules_seen`.
4. **Goals**: `result_shared` (outcome = shared or copied) and `kofi_opened`.

## Vercel Analytics

Kept for now. It's free on the current plan, needs no setup, and gives device, country and referrer for page views, and it's the source of the baseline above. Umami holds all game events. If the Umami dashboard ends up covering page views well enough, remove `<Analytics />` from `app/layout.tsx` to save a script.

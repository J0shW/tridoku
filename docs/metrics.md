# Metrics

What we measure, how, and where to read it. Events are sent to Umami (`lib/analytics.ts`) only from the production domain.

## Baseline (before M0 analytics)

Last 30 days to 7 Nov 2026, recorded before the M0 analytics changes shipped.

### Traffic

| Source | Visitors | Visits | Page views | Mobile |
|---|---|---|---|---|
| Vercel Analytics (8 Oct – 6 Nov) | 44 | — | 55 | 27 of 44 (61%) |
| Umami overview | 12 | 29 | 32 | 2 of 12 (17%); laptop 9, desktop 1 |
| Umami, visitors who triggered any event | 5 | 22 | — | — |

Umami's bounce rate was 38%. Its visit duration reads 0 s, because the game is a single page: Umami measures time between page views. Ignore that number.

**The two tools disagree.** Umami saw about a quarter of Vercel's visitors, and far fewer of them on mobile. The likely cause is that Umami's script loads from `cloud.umami.is`, which ad and tracker blockers commonly block (Safari's tracking protection among them). Vercel's script loads from the site's own domain. If that's right, Umami is missing most players, mobile players especially, and every Umami-based metric is skewed toward desktop users who don't block trackers. TRI-081 serves Umami from the site's own domain to fix this: the script loads from `/p/t.js` and events go to `/p/api/send`, forwarded to `cloud.umami.is/script.js` (a rewrite in `next.config.mjs`) and to `gateway.umami.is/api/send`, the collector Umami Cloud's own tracker uses. Events pass through `app/p/api/send/route.ts`, which adds the visitor's IP so Umami shows the right location; a plain rewrite made every visitor appear to be in Oregon, where Vercel's server is. Use Vercel for traffic and device numbers until a week of data after that change shows how close the two tools get.

### Events (Umami)

| Event | Count |
|---|---|
| `error_check_toggled` | 28 |
| `easy_loaded` | 15 |
| `medium_loaded` | 14 |
| `hard_loaded` | 6 |
| `easy_completed` | 8 |
| `medium_completed` | 3 |
| `hard_completed` | 0 |
| `easy_abandoned` | 3 |
| `medium_abandoned` | 4 |
| `hard_abandoned` | 1 |
| `rules_opened` | 0 |
| `result_shared` | 0 |

Completed ÷ loaded is **Easy 53% (8/15), Medium 21% (3/14), Hard 0% (0/6)**. Those rates are low estimates: before M0, `*_loaded` also fired on every Reset and every return to a puzzle, so it counts more than real starts.

What stands out:
- **Nobody opened How to Play, and nobody shared**, out of the 5 players with any event. Onboarding (TRI-029) and the share grid (TRI-036) start from zero.
- **Error checking was toggled 28 times**, a third of all events, about 6 per player. Players lean on it heavily, so making errors clear (TRI-055, TRI-065) matters.
- **No Hard puzzle was finished**, consistent with the review finding that many Hard puzzles need advanced techniques (TRI-046, TRI-047).
- With 5 event-sending players, possibly including the owner, these are anecdotes, not rates.

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

To do in the Umami dashboard (Claude has no access to it). Menu names may differ slightly by Umami version.

**Status (7 Nov 2026):**
- Goals (step 5) are set up.
- The Activation funnel (step 2) is still to do. Its step 2 event, `puzzle_started`, doesn't exist in Umami until the M0 analytics change is live and someone has played.

1. **Check events arrive** after the M0 analytics change deploys: play one puzzle on the live site (open How to Play, enter a digit, finish, tap Copy). **Realtime** or **Events** should show `puzzle_started`, `rules_step`, an `*_completed` event with `errors` / `pencil_marks` / `resets`, and `result_copied`.
2. **Activation funnel**: Reports → Funnel, named "Activation": step 1 viewed page `/`, step 2 event `puzzle_started`, window 1 day. Umami funnels can't filter steps by event property, so don't build per-difficulty "started → completed" funnels; they'd mix difficulties. Use step 3 instead.
3. **Event property breakdowns** (Events → click an event):
   - `puzzle_started` by `difficulty`: divide each `*_completed` count by it for **completion rate**.
   - `puzzle_started` by `rules_seen`: rules effect.
   - `*_completed` by `time` (solve time), `errors`, `pencil_marks`.
   - `session_end` and `*_abandoned` by `pct_filled`: **where players give up**.
   - `result_shared` by `outcome`; `rules_step` by `n`.
   - Any event by `days_since_first`: values 1 and 7 are **D1 and D7 returning players**.
4. **Retention**: Reports → Retention, if your plan has it, as a cross-check. It uses Umami's own visitor tracking, not the anonymous ID.
5. **Goals**: Reports → Goals: event `result_shared` and event `kofi_opened`.

Check once a month and compare four-week windows.

## Vercel Analytics

Kept for now. It's free on the current plan, needs no setup, and gives device, country and referrer for page views, and its first-party script sees more visitors than Umami does (see the baseline). Umami holds all game events. If the Umami dashboard ends up covering page views well enough, remove `<Analytics />` from `app/layout.tsx` to save a script.

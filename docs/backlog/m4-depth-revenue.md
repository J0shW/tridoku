# M4 · Depth and revenue

**Goal.** Give committed players more to do and test whether they will pay for it.

**Done when**
- A global streak, installable app and archive exist.
- At least one revenue experiment has run with a clear result.
- The milestone evaluation has been run and saved in `docs/reviews/` (see [evaluation](../evaluation/README.md)).

Items are listed in the suggested order of work. Status lives in [BACKLOG.md](BACKLOG.md).

<a id="tri-069"></a>
## TRI-069 · A daily streak that counts any difficulty

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | H | S | D7 retention | [TRI-005](m0-foundations.md#tri-005) | 7.6, 7.c |

**Problem.** Per-difficulty streaks mean players who alternate tiers never build one.

**Done when**
- [ ] A global daily streak counts any completed difficulty and is the headline number.
- [ ] Per-difficulty streaks remain in Statistics.

<a id="tri-070"></a>
## TRI-070 · Installable app

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | M | S | D7 retention | none | 7.5, 7.f |

**Problem.** There's no web manifest, so the game can't be added to a home screen properly.

**Done when**
- [ ] `app/manifest.ts` with name, icons and theme colors.
- [ ] Passes the browser's installability check.

<a id="tri-071"></a>
## TRI-071 · Opt-in daily reminders (experiment)

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | M | M | D7 retention | [TRI-070](m4-depth-revenue.md#tri-070) | 7.5, 7.f |

**Problem.** Nothing brings players back each day.

**Done when**
- [ ] Test one channel (web push for installed players, or email) behind an explicit opt-in.
- [ ] Measure D7 retention for opted-in vs not.

<a id="tri-072"></a>
## TRI-072 · Keep stats when switching devices

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | M | M | Long-term retention | none | 7.5 |

**Problem.** Streaks and stats live only in localStorage; a new device or cleared storage loses them.

**Done when**
- [ ] Players can export a code and import it on another device (no account needed).
- [ ] Consider accounts later only if demand appears in feedback.

<a id="tri-073"></a>
## TRI-073 · Puzzle archive

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | H | M | Sessions per player | [TRI-051](m2-puzzle-quality.md#tri-051) | 13.1, 13.b, 9.a |

**Problem.** About 230 past days exist but can't be played.

**Done when**
- [ ] `/archive` shows a calendar of past dates with completion state per difficulty.
- [ ] The last 7 days are free.
- [ ] Archive plays don't affect daily streaks.

<a id="tri-074"></a>
## TRI-074 · Paid full archive (experiment)

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Low | M | M | Revenue | [TRI-073](m4-depth-revenue.md#tri-073), [TRI-015](m0-foundations.md#tri-015) | 9.a |

**Problem.** Ko-fi is the only revenue; an archive is the best-fitting paid option once D7 retention exists.

**Done when**
- [ ] Decide pricing ($2–3/month or ~$15 once) and payment provider.
- [ ] Gate dates older than 7 days.
- [ ] Only start once D7 retention is measured and acceptable.

<a id="tri-075"></a>
## TRI-075 · Printable puzzle packs

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Low | M | M | Revenue | [TRI-046](m2-puzzle-quality.md#tri-046) | 9.b |

**Problem.** Paper-puzzle fans have no way to buy puzzles.

**Done when**
- [ ] A script builds a PDF pack (e.g. 30 Hard puzzles with solutions) from graded puzzles.
- [ ] Sold through Ko-fi shop or similar.

<a id="tri-076"></a>
## TRI-076 · Sunday Expert puzzle

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Low | M | S | Engagement of top players | [TRI-046](m2-puzzle-quality.md#tri-046) | 13.4, 13.c |

**Problem.** Tier 4+ puzzles are currently mislabeled as Medium/Hard; they could be their own tier.

**Done when**
- [ ] A fourth "Expert" difficulty appears on Sundays using Tier 4 puzzles.
- [ ] Its own stats and streak column.

<a id="tri-077"></a>
## TRI-077 · Special and themed puzzles

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Low | L | M | Engagement | [TRI-046](m2-puzzle-quality.md#tri-046) | 13.4 |

**Problem.** No holiday or themed puzzles.

**Done when**
- [ ] A way to hand-pick or constrain puzzles for given dates (e.g. givens forming a pattern on holidays).
- [ ] At least one themed puzzle scheduled.

<a id="tri-078"></a>
## TRI-078 · Logo and favicon

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Low | M | S | Brand recognition | none | 5.3, 5.c |

**Problem.** The header uses a generic icon-library triangle.

**Done when**
- [ ] A mark of 9 small triangles forming one large triangle, used in the header, favicon, apple icon and share card.

<a id="tri-079"></a>
## TRI-079 · No ads

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| — | — | — | — | none | 9.c |

**Problem.** Ads would hurt the habit loop and earn little at current traffic.

**Done when**
- [ ] Decision recorded: no ads. Revisit only if traffic grows 10×.

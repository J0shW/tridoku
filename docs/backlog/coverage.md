# Review coverage

Every numbered finding and recommendation in the [baseline review](../reviews/2026-11-06-baseline.md) and the backlog or research items that cover it. A finding with no item here would mean the backlog is incomplete.

**126 findings, all covered.** The [UI audit](../reviews/2026-11-09-ui-audit.md) (9 Nov) adds 42 findings, also all covered; see [UI audit](#ui-audit-9-nov).

## §1 Value proposition

| Ref | Finding | Covered by |
|---|---|---|
| 1.1 | First screen doesn't say what Tridoku is; board not shown | [TRI-026](m1-first-impression.md#tri-026) |
| 1.2 | Difficulty cards describe given counts | [TRI-028](m1-first-impression.md#tri-028) |
| 1.3 | Target player undefined [H] | [TRI-027](m1-first-impression.md#tri-027), [R-04](research.md) |
| 1.a | Board preview and one-line pitch on welcome | [TRI-026](m1-first-impression.md#tri-026) |
| 1.b | Label difficulties by experience, add median times | [TRI-028](m1-first-impression.md#tri-028) |
| 1.c | Single "Play today's puzzle" for first-timers | [TRI-027](m1-first-impression.md#tri-027) |

## §2 Onboarding

| Ref | Finding | Covered by |
|---|---|---|
| 2.1 | Rules never open on their own | [TRI-029](m1-first-impression.md#tri-029) |
| 2.2 | Cell colors change meaning per difficulty | [TRI-031](m1-first-impression.md#tri-031) |
| 2.3 | Rules modal is 10 steps; Power Cells last [H] | [TRI-029](m1-first-impression.md#tri-029), [TRI-030](m1-first-impression.md#tri-030), [R-05](research.md) |
| 2.4 | No in-game cue for the no-touch rule | [TRI-032](m1-first-impression.md#tri-032) |
| 2.a | Three-card rules on first visit; tips tab | [TRI-029](m1-first-impression.md#tri-029) |
| 2.b | Power Cells as a contextual tip | [TRI-030](m1-first-impression.md#tri-030) |
| 2.c | Same rule colors on every difficulty | [TRI-031](m1-first-impression.md#tri-031) |
| 2.d | Shade touching neighbors of the selected cell | [TRI-032](m1-first-impression.md#tri-032) |

## §3 Gameplay and puzzles

| Ref | Finding | Covered by |
|---|---|---|
| 3.1 | Difficulty labels unreliable (tier audit) | [TRI-046](m2-puzzle-quality.md#tri-046), [TRI-047](m2-puzzle-quality.md#tri-047), [R-06](research.md) |
| 3.2 | Advertised given ranges are wrong | [TRI-028](m1-first-impression.md#tri-028), [TRI-047](m2-puzzle-quality.md#tri-047) |
| 3.3 | No undo, no hints, notes not cleaned up | [TRI-052](m2-puzzle-quality.md#tri-052), [TRI-053](m2-puzzle-quality.md#tri-053), [TRI-054](m2-puzzle-quality.md#tri-054) |
| 3.4 | Full but invalid board gives no feedback | [TRI-055](m2-puzzle-quality.md#tri-055) |
| 3.5 | Uniqueness check can falsely report unique | [TRI-013](m0-foundations.md#tri-013), [TRI-048](m2-puzzle-quality.md#tri-048) |
| 3.a | Technique grader and tier acceptance in generator | [TRI-046](m2-puzzle-quality.md#tri-046), [TRI-047](m2-puzzle-quality.md#tri-047) |
| 3.b | Undo | [TRI-052](m2-puzzle-quality.md#tri-052) |
| 3.c | Auto-remove placed digits from notes | [TRI-053](m2-puzzle-quality.md#tri-053) |
| 3.d | Hint: highlight a solvable cell | [TRI-054](m2-puzzle-quality.md#tri-054) |
| 3.e | Toast when the full board is wrong | [TRI-055](m2-puzzle-quality.md#tri-055) |

## §4 UX and interaction

| Ref | Finding | Covered by |
|---|---|---|
| 4.1 | Number pad below the fold at 360×640 | [TRI-058](m3-mobile-accessibility.md#tri-058) |
| 4.2 | Small triangle tap targets | [TRI-059](m3-mobile-accessibility.md#tri-059), [R-07](research.md) |
| 4.3 | Reload returns to welcome; no in-progress state | [TRI-033](m1-first-impression.md#tri-033) |
| 4.4 | Pencil marks up to 6, ~7 px on mobile | [TRI-060](m3-mobile-accessibility.md#tri-060) |
| 4.5 | Givens and entries look alike | [TRI-061](m3-mobile-accessibility.md#tri-061) |
| 4.6 | Hidden highlight gesture; pad doesn't dim finished digits | [TRI-056](m2-puzzle-quality.md#tri-056), [TRI-057](m2-puzzle-quality.md#tri-057) |
| 4.a | Compact layout under 700 px tall | [TRI-058](m3-mobile-accessibility.md#tri-058) |
| 4.b | Snap taps to nearest cell | [TRI-059](m3-mobile-accessibility.md#tri-059) |
| 4.c | Skip welcome for returning players; Continue state | [TRI-033](m1-first-impression.md#tri-033) |
| 4.d | Readable notes; color player entries | [TRI-060](m3-mobile-accessibility.md#tri-060), [TRI-061](m3-mobile-accessibility.md#tri-061) |
| 4.e | Dim fully placed digits | [TRI-056](m2-puzzle-quality.md#tri-056) |

## §5 Visual design

| Ref | Finding | Covered by |
|---|---|---|
| 5.1 | Region lines faint in dark mode | [TRI-068](m3-mobile-accessibility.md#tri-068) |
| 5.2 | Square, generic OG image | [TRI-038](m1-first-impression.md#tri-038) |
| 5.3 | No real logo | [TRI-078](m4-depth-revenue.md#tri-078) |
| 5.4 | Stray "0" in Statistics | [TRI-021](m0-foundations.md#tri-021) |
| 5.a | Dark-mode region contrast ≥4.5:1 | [TRI-068](m3-mobile-accessibility.md#tri-068) |
| 5.b | Daily 1200×630 OG image | [TRI-038](m1-first-impression.md#tri-038) |
| 5.c | Nine-triangle logo mark | [TRI-078](m4-depth-revenue.md#tri-078) |

## §6 Accessibility

| Ref | Finding | Covered by |
|---|---|---|
| 6.1 | Board not keyboard-playable | [TRI-062](m3-mobile-accessibility.md#tri-062) |
| 6.2 | Board has no screen-reader semantics | [TRI-063](m3-mobile-accessibility.md#tri-063) |
| 6.3 | Errors shown by color only, low contrast | [TRI-065](m3-mobile-accessibility.md#tri-065) |
| 6.4 | Selection animation ignores reduced motion | [TRI-066](m3-mobile-accessibility.md#tri-066) |
| 6.5 | Low-contrast welcome card text | [TRI-067](m3-mobile-accessibility.md#tri-067) |
| 6.a | Grid role and roving tabindex | [TRI-062](m3-mobile-accessibility.md#tri-062) |
| 6.b | Per-cell labels | [TRI-063](m3-mobile-accessibility.md#tri-063) |
| 6.c | Live-region announcements | [TRI-064](m3-mobile-accessibility.md#tri-064) |
| 6.d | Shape-based error marks | [TRI-065](m3-mobile-accessibility.md#tri-065) |
| 6.e | Reduced-motion media query | [TRI-066](m3-mobile-accessibility.md#tri-066) |

## §7 Retention

| Ref | Finding | Covered by |
|---|---|---|
| 7.1 | Streaks reset to 1 on most days | [TRI-004](m0-foundations.md#tri-004), [TRI-005](m0-foundations.md#tri-005) |
| 7.2 | Win % always 100% | [TRI-007](m0-foundations.md#tri-007) |
| 7.3 | Midnight solve credits the wrong day | [TRI-006](m0-foundations.md#tri-006) |
| 7.4 | Weak win moment; no share in view mode | [TRI-034](m1-first-impression.md#tri-034), [TRI-035](m1-first-impression.md#tri-035) |
| 7.5 | No reminders; stats only in localStorage | [TRI-070](m4-depth-revenue.md#tri-070), [TRI-071](m4-depth-revenue.md#tri-071), [TRI-072](m4-depth-revenue.md#tri-072) |
| 7.6 | Per-difficulty streaks [H] | [TRI-069](m4-depth-revenue.md#tri-069), [R-09](research.md) |
| 7.a | One date-key helper | [TRI-004](m0-foundations.md#tri-004) |
| 7.b | Credit completion to the puzzle's date | [TRI-006](m0-foundations.md#tri-006) |
| 7.c | Global daily streak | [TRI-069](m4-depth-revenue.md#tri-069) |
| 7.d | Count played on first entry | [TRI-007](m0-foundations.md#tri-007) |
| 7.e | Countdown, next tier, time vs best | [TRI-034](m1-first-impression.md#tri-034) |
| 7.f | Web manifest, then reminders | [TRI-070](m4-depth-revenue.md#tri-070), [TRI-071](m4-depth-revenue.md#tri-071) |

## §8 Virality and growth

| Ref | Finding | Covered by |
|---|---|---|
| 8.1 | Puzzle number depends on time zone | [TRI-008](m0-foundations.md#tri-008) |
| 8.2 | Plain share text, no tracking parameter | [TRI-036](m1-first-impression.md#tri-036), [TRI-037](m1-first-impression.md#tri-037) |
| 8.3 | No robots.txt, sitemap or SEO content | [TRI-039](m1-first-impression.md#tri-039), [TRI-040](m1-first-impression.md#tri-040) |
| 8.4 | Social image cropped | [TRI-038](m1-first-impression.md#tri-038) |
| 8.5 | /bts as a launch story | [TRI-045](m1-first-impression.md#tri-045) |
| 8.a | Number puzzles from the date key | [TRI-008](m0-foundations.md#tri-008) |
| 8.b | Share grid and utm_source | [TRI-036](m1-first-impression.md#tri-036), [TRI-037](m1-first-impression.md#tri-037) |
| 8.c | robots, sitemap, how-to-play page | [TRI-039](m1-first-impression.md#tri-039), [TRI-040](m1-first-impression.md#tri-040) |

## §9 Monetization

| Ref | Finding | Covered by |
|---|---|---|
| 9.1 | Ko-fi never offered at the win moment | [TRI-041](m1-first-impression.md#tri-041) |
| 9.2 | Ko-fi opens not tracked | [TRI-019](m0-foundations.md#tri-019) |
| 9.a | Past-puzzle archive (free 7 days, paid rest) | [TRI-073](m4-depth-revenue.md#tri-073), [TRI-074](m4-depth-revenue.md#tri-074) |
| 9.b | Printable puzzle packs | [TRI-075](m4-depth-revenue.md#tri-075) |
| 9.c | No ads | [TRI-079](m4-depth-revenue.md#tri-079) |
| 9.d | Weekly Ko-fi line in win modal | [TRI-041](m1-first-impression.md#tri-041) |

## §10 Analytics

| Ref | Finding | Covered by |
|---|---|---|
| 10.1 | No start event | [TRI-016](m0-foundations.md#tri-016) |
| 10.2 | Tab close mid-puzzle not recorded | [TRI-017](m0-foundations.md#tri-017) |
| 10.3 | Share counts cancels; copy not tracked | [TRI-018](m0-foundations.md#tri-018) |
| 10.4 | Rules depth not tracked | [TRI-019](m0-foundations.md#tri-019) |
| 10.5 | Ko-fi and Feedback opens not tracked | [TRI-019](m0-foundations.md#tri-019) |
| 10.6 | No anonymous ID for retention | [TRI-015](m0-foundations.md#tri-015) |
| 10.7 | Errors, notes, undo/reset counts not recorded | [TRI-019](m0-foundations.md#tri-019) |
| 10 (metrics table) | Eight metrics and their events | [TRI-020](m0-foundations.md#tri-020) |

## §11 Feedback loop

| Ref | Finding | Covered by |
|---|---|---|
| 11.1 | Feedback has no context | [TRI-043](m1-first-impression.md#tri-043) |
| 11.2 | Feedback asked at the wrong moment [H] | [TRI-042](m1-first-impression.md#tri-042), [TRI-044](m1-first-impression.md#tri-044), [R-10](research.md) |
| 11.a | Tally hidden fields | [TRI-043](m1-first-impression.md#tri-043) |
| 11.b | One-tap difficulty rating | [TRI-042](m1-first-impression.md#tri-042) |
| 11.c | Weekly feedback review | [TRI-044](m1-first-impression.md#tri-044) |

## §12 Technical quality

| Ref | Finding | Covered by |
|---|---|---|
| 12.1 | Backup puzzle unsolvable | [TRI-009](m0-foundations.md#tri-009) |
| 12.2 | Failed download fails silently | [TRI-011](m0-foundations.md#tri-011) |
| 12.3 | No pipeline alert; 60-day schedule risk | [TRI-012](m0-foundations.md#tri-012), [R-08](research.md) |
| 12.4 | Year rollover untested | [TRI-014](m0-foundations.md#tri-014) |
| 12.5 | Type checks skipped, lint broken, two lockfiles, naming | [TRI-001](m0-foundations.md#tri-001), [TRI-002](m0-foundations.md#tri-002), [TRI-003](m0-foundations.md#tri-003), [TRI-024](m0-foundations.md#tri-024) |
| 12.6 | Unused UI components and dependencies | [TRI-023](m0-foundations.md#tri-023) |
| 12.7 | Whole year downloaded; future puzzles public | [TRI-051](m2-puzzle-quality.md#tri-051) |
| 12.8 | /test public; internal routes not excluded from search | [TRI-022](m0-foundations.md#tri-022), [TRI-039](m1-first-impression.md#tri-039) |
| 12.a | Known-good backup; fall back to recent puzzle | [TRI-009](m0-foundations.md#tri-009), [TRI-010](m0-foundations.md#tri-010) |
| 12.b | Error with Retry | [TRI-011](m0-foundations.md#tri-011) |
| 12.c | Action fails when behind; uniqueness test | [TRI-001](m0-foundations.md#tri-001), [TRI-012](m0-foundations.md#tri-012), [TRI-013](m0-foundations.md#tri-013), [TRI-050](m2-puzzle-quality.md#tri-050) |
| 12.d | One file per day | [TRI-051](m2-puzzle-quality.md#tri-051) |
| 12.e | ESLint, type checks, cleanup, one lockfile | [TRI-002](m0-foundations.md#tri-002), [TRI-003](m0-foundations.md#tri-003), [TRI-023](m0-foundations.md#tri-023), [TRI-024](m0-foundations.md#tri-024) |
| 12.f | Hide /test outside development | [TRI-022](m0-foundations.md#tri-022) |

## §13 Content strategy

| Ref | Finding | Covered by |
|---|---|---|
| 13.1 | No archive | [TRI-073](m4-depth-revenue.md#tri-073) |
| 13.2 | No weekly difficulty rhythm | [TRI-049](m2-puzzle-quality.md#tri-049) |
| 13.3 | Puzzle count starts before content | [TRI-008](m0-foundations.md#tri-008) |
| 13.4 | No themed or Expert puzzles | [TRI-076](m4-depth-revenue.md#tri-076), [TRI-077](m4-depth-revenue.md#tri-077) |
| 13.a | Day-of-week schedule | [TRI-049](m2-puzzle-quality.md#tri-049) |
| 13.b | /archive with 7 free days | [TRI-073](m4-depth-revenue.md#tri-073) |
| 13.c | Sunday Expert puzzle | [TRI-076](m4-depth-revenue.md#tri-076) |

## Open questions

| Ref | Finding | Covered by |
|---|---|---|
| Open question 1 | Naming and rights | [R-01](research.md) |
| Open question 2 | Funnel baselines | [R-02](research.md) |
| Open question 3 | Mobile vs desktop share | [R-03](research.md) |
| Open question 4 | Do first-timers read the rules? [H] | [R-05](research.md) |
| Open question 5 | Are Tier 4+ puzzles fair? [H] | [R-06](research.md) |
| Open question 6 | Mobile mis-tap rate [H] | [R-07](research.md) |
| Open question 7 | Bot deploys and Action history | [R-08](research.md) |
| Open question 8 | Per-difficulty streaks intended? | [R-09](research.md) |

## Process

| Ref | Finding | Covered by |
|---|---|---|
| Evaluation plan | Repeatable milestone reviews | [TRI-025](m0-foundations.md#tri-025), [TRI-050](m2-puzzle-quality.md#tri-050) |
| Found in M0 (TRI-002) | Game hook breaks React Compiler lint rules | [TRI-080](m2-puzzle-quality.md#tri-080) |
| Found in M0 (Umami baseline) | Umami sees ~1/4 of visitors; likely blocked | [TRI-081](m0-foundations.md#tri-081) |
| Found in M0 (analytics tool review) | Umami free plan fits poorly; Vercel Hobby is non-commercial | [TRI-082](m1-first-impression.md#tri-082), [R-11](research.md) |
| Found in M0 review | Daily Action missing dependencies; footer margin; Node 20 actions; stale checkmarks after midnight | [TRI-083](m0-foundations.md#tri-083), [TRI-084](m1-first-impression.md#tri-084), [TRI-085](m1-first-impression.md#tri-085), [TRI-086](m1-first-impression.md#tri-086) |
| Found in M1 (TRI-032 review) | Touching-cell shading may make Medium and Hard too easy | [R-12](research.md) |
| Owner idea (8 Nov) | How does the inventor's book grade difficulty? | [R-13](research.md) |
| Found in M3 prototyping (9 Nov) | Timer and pause are separate; eye icon unclear for error checking; Reset has equal weight | [TRI-087](m3-mobile-accessibility.md#tri-087) |

## UI audit (9 Nov)

Findings from the [UI audit](../reviews/2026-11-09-ui-audit.md). New evidence for existing items (TRI-058, 059, 060, 061, 062, 065, 066, 068, 070, 078) is in the audit's §5.

| Ref | Finding | Covered by |
|---|---|---|
| UI-01 | Tips and notices push the number pad off screen | [TRI-090](m5-design-system.md#tri-090) |
| UI-02 | Difficulty colour means three things; Easy borrows the outer-rule blue | [TRI-092](m5-design-system.md#tri-092) |
| UI-03 | Seven button styles | [TRI-089](m5-design-system.md#tri-089), [TRI-093](m5-design-system.md#tri-093) |
| UI-04 | Ghost and outline hovers are green | [TRI-091](m5-design-system.md#tri-091) |
| UI-05 | Contrast failures outside the board | [TRI-091](m5-design-system.md#tri-091) |
| UI-06 | Hard-coded colours in components; unused tokens | [TRI-088](m5-design-system.md#tri-088), [TRI-097](m5-design-system.md#tri-097) |
| UI-07 | Copy-pasted notices; pencil tip overlap and keyboard copy | [TRI-089](m5-design-system.md#tri-089), [TRI-090](m5-design-system.md#tri-090), [TRI-098](m5-design-system.md#tri-098) |
| UI-08 | Game opens scrolled on 320 px and landscape | [TRI-093](m5-design-system.md#tri-093), [TRI-096](m5-design-system.md#tri-096) |
| UI-09 | Desktop and tablet don't use the space | [TRI-096](m5-design-system.md#tri-096) |
| UI-10 | Dialogs inconsistent; focus not returned; teal Reset | [TRI-094](m5-design-system.md#tri-094) |
| UI-11 | Hand-rolled ⋯ menu | [TRI-093](m5-design-system.md#tri-093) |
| UI-12 | No type scale; tabular digits missing | [TRI-088](m5-design-system.md#tri-088) |
| UI-13 | Unbranded 404, no error page | [TRI-095](m5-design-system.md#tri-095) |
| UI-14 | 16 controls under 44 px | [TRI-093](m5-design-system.md#tri-093), [TRI-059](m3-mobile-accessibility.md#tri-059) |
| UI-15 | Three tab styles; difficulty tabs lack a selected state | [TRI-089](m5-design-system.md#tri-089), [TRI-092](m5-design-system.md#tri-092) |
| UI-16 | Copy drift: case, names, rule count | [TRI-098](m5-design-system.md#tri-098) |
| UI-17 | Off-palette opaque blue highlight | [TRI-091](m5-design-system.md#tri-091) |
| UI-18 | Check on and Undo note look the same | [TRI-093](m5-design-system.md#tri-093) |
| UI-19 | Pad looks disabled on first view | [TRI-093](m5-design-system.md#tri-093) |
| UI-20 | Clear key outline and red hover | [TRI-093](m5-design-system.md#tri-093) |
| UI-21 | Pad hover looks like note on | [TRI-093](m5-design-system.md#tri-093) |
| UI-22 | Icon sizes and strokes vary | [TRI-089](m5-design-system.md#tri-089), [TRI-078](m4-depth-revenue.md#tri-078) |
| UI-23 | Nine radii, six shadows, ad-hoc z-index | [TRI-088](m5-design-system.md#tri-088) |
| UI-24 | No spacing rhythm | [TRI-088](m5-design-system.md#tri-088) |
| UI-25 | Tips describe the wrong platform | [TRI-098](m5-design-system.md#tri-098) |
| UI-26 | Motion: transition-all, scale, rotate | [TRI-088](m5-design-system.md#tri-088), [TRI-066](m3-mobile-accessibility.md#tri-066) |
| UI-27 | Five teals; OG image font and colours | [TRI-091](m5-design-system.md#tri-091), [TRI-095](m5-design-system.md#tri-095), [TRI-078](m4-depth-revenue.md#tri-078) |
| UI-28 | /bts separate style and no metadata | [TRI-095](m5-design-system.md#tri-095) |
| UI-29 | Loading state without header; JS-off spinner | [TRI-095](m5-design-system.md#tri-095) |
| UI-30 | View-mode banner bright in dark mode | [TRI-093](m5-design-system.md#tri-093) |
| UI-31 | Ko-fi offset and white; footer buttons | [TRI-094](m5-design-system.md#tri-094) |
| UI-32 | Statistics modal layout and case | [TRI-094](m5-design-system.md#tri-094) |
| UI-33 | Win modal crowded | [TRI-094](m5-design-system.md#tri-094) |
| UI-34 | Dark board lines and selection | [TRI-091](m5-design-system.md#tri-091), [TRI-068](m3-mobile-accessibility.md#tri-068) |
| UI-35 | Footer padding; safe areas | [TRI-093](m5-design-system.md#tri-093), [TRI-070](m4-depth-revenue.md#tri-070) |
| UI-36 | Three focus styles | [TRI-089](m5-design-system.md#tri-089) |
| UI-37 | Rules modal dots and credit | [TRI-094](m5-design-system.md#tri-094) |
| UI-38 | Header wordmark size | [TRI-093](m5-design-system.md#tri-093) |
| UI-39 | Two difficulty card layouts share no component | [TRI-092](m5-design-system.md#tri-092) |
| UI-40 | Two primaries on the load error | [TRI-093](m5-design-system.md#tri-093) |
| UI-41 | Timer pill in view mode | [TRI-093](m5-design-system.md#tri-093) |
| UI-42 | Spinner announced twice | [TRI-095](m5-design-system.md#tri-095) |

## Review roadmap

| # | Roadmap item | Covered by |
|---|---|---|
| 1 | Streak, rollover and win % fixes | [TRI-004](m0-foundations.md#tri-004), [TRI-005](m0-foundations.md#tri-005), [TRI-006](m0-foundations.md#tri-006), [TRI-007](m0-foundations.md#tri-007) |
| 2 | Pipeline safety | [TRI-009](m0-foundations.md#tri-009), [TRI-010](m0-foundations.md#tri-010), [TRI-011](m0-foundations.md#tri-011), [TRI-012](m0-foundations.md#tri-012), [TRI-013](m0-foundations.md#tri-013) |
| 3 | Analytics instrumentation | [TRI-015](m0-foundations.md#tri-015), [TRI-016](m0-foundations.md#tri-016), [TRI-017](m0-foundations.md#tri-017), [TRI-018](m0-foundations.md#tri-018), [TRI-019](m0-foundations.md#tri-019), [TRI-020](m0-foundations.md#tri-020) |
| 4 | Puzzle number, share grid, OG image | [TRI-008](m0-foundations.md#tri-008), [TRI-036](m1-first-impression.md#tri-036), [TRI-037](m1-first-impression.md#tri-037), [TRI-038](m1-first-impression.md#tri-038) |
| 5 | First-run onboarding, consistent colors | [TRI-026](m1-first-impression.md#tri-026), [TRI-027](m1-first-impression.md#tri-027), [TRI-029](m1-first-impression.md#tri-029), [TRI-031](m1-first-impression.md#tri-031) |
| 6 | Difficulty by technique tier | [TRI-046](m2-puzzle-quality.md#tri-046), [TRI-047](m2-puzzle-quality.md#tri-047), [TRI-049](m2-puzzle-quality.md#tri-049), [TRI-050](m2-puzzle-quality.md#tri-050) |
| 7 | Mobile layout | [TRI-058](m3-mobile-accessibility.md#tri-058), [TRI-059](m3-mobile-accessibility.md#tri-059), [TRI-060](m3-mobile-accessibility.md#tri-060), [TRI-061](m3-mobile-accessibility.md#tri-061) |
| 8 | Returning-player flow | [TRI-033](m1-first-impression.md#tri-033), [TRI-034](m1-first-impression.md#tri-034), [TRI-069](m4-depth-revenue.md#tri-069), [TRI-052](m2-puzzle-quality.md#tri-052), [TRI-053](m2-puzzle-quality.md#tri-053) |
| 9 | Archive and paid options | [TRI-073](m4-depth-revenue.md#tri-073), [TRI-074](m4-depth-revenue.md#tri-074), [TRI-075](m4-depth-revenue.md#tri-075) |
| 10 | Accessibility pass | [TRI-062](m3-mobile-accessibility.md#tri-062), [TRI-063](m3-mobile-accessibility.md#tri-063), [TRI-064](m3-mobile-accessibility.md#tri-064), [TRI-065](m3-mobile-accessibility.md#tri-065), [TRI-066](m3-mobile-accessibility.md#tri-066), [TRI-067](m3-mobile-accessibility.md#tri-067), [TRI-068](m3-mobile-accessibility.md#tri-068) |

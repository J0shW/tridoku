# Milestone evaluations

At the end of each milestone we re-run the product evaluation the same way as the [baseline](../reviews/2026-11-06-baseline.md), so scores and findings can be compared.

## How to run one

Ask Claude (or do it yourself) with the [brief](PROMPT.md) unchanged, followed by:

> This is the evaluation at the end of milestone M<N>. Also:
> 1. Run `scripts/eval/` (see its README) and include the puzzle grading table and the play-through screenshots.
> 2. Compare each area's score with the baseline and the previous milestone review in `docs/reviews/`, and say what changed and why.
> 3. For each backlog item marked Done in this milestone, check its "Done when" criteria in the running app and say whether they hold.
> 4. Include the metrics from `docs/metrics.md` for the period since the last review, when available.
> 5. Save the review as `docs/reviews/<YYYY-MM-DD>-m<N>.md` with screenshots in a folder of the same name.
> 6. Add new findings to the backlog with the next free IDs, and map them in `docs/backlog/coverage.md`.

## Schedule

| Review | When | File |
|---|---|---|
| Baseline | 6 Nov 2026 | [2026-11-06-baseline.md](../reviews/2026-11-06-baseline.md) |
| M0 | When M0 is done | — |
| M1 | When M1 is done | — |
| M2 | When M2 is done | — |
| M3 | When M3 is done | — |
| M4 | When M4 is done | — |

## Baseline numbers to beat

| Measure | Baseline |
|---|---|
| Scorecard total | 57 / 130 |
| Puzzles with exactly one solution | 609 / 609 |
| Hard puzzles that need only singles (too easy) | 34 / 203 |
| Medium + Hard puzzles that need more than pairs | 59 / 406 |
| Keyboard-only completion | Not possible |
| Number pad visible at 360×640 | No |
| Streak correct after consecutive days | Only on ~73 days a year |

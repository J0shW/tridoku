# Backlog

Everything we plan to change in Tridoku, built from the [baseline product review](../reviews/2026-11-06-baseline.md) of 6 Nov 2026.

| File | What's in it |
|---|---|
| [BACKLOG.md](BACKLOG.md) | One table of every item, with status. Start here. |
| [m0-foundations.md](m0-foundations.md) | M0 · Foundations and critical fixes |
| [m1-first-impression.md](m1-first-impression.md) | M1 · First impression and sharing |
| [m2-puzzle-quality.md](m2-puzzle-quality.md) | M2 · Puzzle quality and gameplay |
| [m3-mobile-accessibility.md](m3-mobile-accessibility.md) | M3 · Mobile and accessibility |
| [m4-depth-revenue.md](m4-depth-revenue.md) | M4 · Depth and revenue |
| [research.md](research.md) | Questions for the owner, playtests and data checks |
| [coverage.md](coverage.md) | Every review finding mapped to the items that cover it |

## Milestones

Milestones run in order, and each ends with a fresh evaluation (see below). Within a milestone, items are listed in the suggested order of work; check **Depends on** before starting one.

Analytics comes first in M0 on purpose: it needs about two weeks of baseline data before the M1 changes ship, or we won't be able to tell whether they helped.

Research items can happen at any time. R-02 (baselines) and R-03 (mobile vs desktop) are worth doing before M0 analytics ships, because R-03 may move the M3 mobile items earlier.

## Items

Each item has:

- **ID.** `TRI-NNN`, permanent. IDs are never reused or renumbered. New items get the next free number, whatever their milestone.
- **Severity.** From the review: Critical, High, Medium or Low.
- **Impact and effort.** H/M/L impact; S/M/L effort, where S is under a day, M is a few days and L is a week or more.
- **Moves.** The metric the item should change (see TRI-020 for definitions).
- **Review.** The finding numbers in the baseline review that the item comes from.
- **Problem**, **Done when** (acceptance criteria as checkboxes) and, for anything visible, **Check it in a preview** steps using the dev tools panel (see [testing previews](../testing-previews.md)).

### Status

`Todo` → `In progress` → `In review` → `Done`, or `Won't do` with a reason in the item.

Status lives only in the [BACKLOG.md](BACKLOG.md) table. Tick the **Done when** boxes in the milestone file as criteria are met.

## How work happens

1. Pick the next `Todo` item whose dependencies are `Done`. Set it to `In progress` on its branch.
2. One branch and one pull request per item, or a small group of closely related items. Name the branch after the item, e.g. `claude/tri-005-streaks`, and start the PR title with the ID: `TRI-005: Fix streaks resetting to 1`.
3. The PR includes the backlog update: status to `In review` and ticked criteria.
4. Test in the PR's Vercel preview using the item's **Check it in a preview** steps.
5. On merge, set the status to `Done`. This can be the last commit on the branch before merging.

New problems found along the way become new items with the next free ID, in the milestone where they fit. If one comes from a review, add it to [coverage.md](coverage.md) too.

## Milestone evaluations

At the end of each milestone, re-run the product evaluation the same way as the baseline. Instructions are in [docs/evaluation](../evaluation/README.md). Each run:

- produces `docs/reviews/<date>-m<N>.md` with a scorecard compared against the baseline (57 / 130)
- turns new findings into backlog items
- records the metrics from TRI-020 next to the scores, so scores and player data can be compared.

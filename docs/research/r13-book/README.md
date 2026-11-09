# R-13 · How a published Tridoku book grades difficulty

Puzzles transcribed from a Tridoku book, to learn how it decides each puzzle's level before we build our own technique grader (TRI-046, TRI-047). See [R-13](../../backlog/research.md).

**Source:** *Tridoku* by Japheth J. Light, the puzzle's inventor (Josh's copy). The puzzles are the author's work and are kept here only for this research.

## Levels

The book has four levels, marked with 1 to 4 small triangles in the page's top corner. Level 1 is the easiest.

## Files

One file per puzzle in [`puzzles/`](puzzles/), named by page number (`p046.txt`):

```
# page: 46
# level: 1
0
403
00800
...
```

- Lines starting with `#` hold the page and level.
- Then 9 rows of the board from the top, with 1, 3, 5 … 17 cells. Each row reads left to right, alternating up and down triangles, starting with an up triangle, the same order as `public/puzzles/*.json`.
- `0` is an empty cell.

## Checking

```
pnpm check-book
```

For every file this checks the row lengths and level, that the givens don't break a rule, that there is exactly one solution, and the tier from our current grader (`scripts/eval/lib.ts`: 1 = singles only, 2 = + power-cell eliminations, 3 = + pairs and triples, 4 = needs more). A typing mistake almost always shows up as a clash, no solution or several solutions.

> **Status (9 Nov 2026): findings complete, decision paused.** Josh is thinking about the recommendation below before we change how puzzles are graded. TRI-046 and TRI-047 are on hold until then. See [Open questions](#open-questions) for what to decide.

## Conclusion

35 puzzles across all four levels: 8 at level 1, 7 at level 2, 10 at level 3 and 10 at level 4. Reproduce with `pnpm compare-book`.

| Book level | Puzzles | Givens | Singles only | Moves available per step | Steps with only 1–2 moves | Need naked singles |
|---|---|---|---|---|---|---|
| 1 | 8 | 30 | 8 of 8 | 8.0 | 3.6 | 0 of 8 |
| 2 | 7 | 30 | 7 of 7 | 6.5 | 3.3 | 0 of 7 |
| 3 | 10 | 27–30 | 10 of 10 | 4.7 | 7.8 | 2 of 10 |
| 4 | 10 | 27–30 | 10 of 10 | 3.8 | 13.6 | 5 of 10 |
| Our Easy | 30 | ~44 | 28 of 30 | 8.3 | 3.0 | 2 of 30 |
| Our Medium | 30 | ~38 | **12 of 30** | 6.8\* | 3.4\* | — |
| Our Hard | 30 | ~34 | **8 of 30** | 5.7\* | 5.4\* | — |

\* Over the singles-solvable puzzles only.

**How the book grades difficulty.**
- Every puzzle, even at level 4, is solvable with singles alone: naked singles and hidden singles in regions and edges, with touching cells counted. The book never needs power-cell eliminations, pairs or anything harder.
- Givens barely change: 30 at levels 1–2, 27–30 at levels 3–4.
- Difficulty comes from **scarcity**. Each level offers fewer placements at a time (8.0, then 6.5, 4.7, 3.8), has more steps where only one or two moves exist (3.6 up to 13.6), and from level 3 increasingly needs naked singles: cells where only one digit fits once every region, edge and touching cell is checked.

**What this means for us.**
- Our Easy is close to book level 1, just with about 14 more givens.
- Most of our Medium and Hard puzzles need techniques beyond singles, which the book never asks for, even at level 4. That is the likely reason no player has finished a Hard puzzle (`docs/metrics.md`).

**Recommendation for TRI-046 and TRI-047.**
- Require every daily puzzle to be solvable with singles (tier 1).
- Grade within singles by scarcity, using the book's levels as anchors. Easy ≈ level 1–2 (6.5 or more moves per step). Medium ≈ level 3 (about 4.5–5.5). Hard ≈ level 4 (about 4 or fewer, with 10 or more tight steps).
- Keep puzzles that need power cells or pairs for a possible Expert level (TRI-076), not Hard.
- Thresholds should be confirmed against player solve times once TRI-020 data exists.

**Caveats.**
- The step measures come from one solving order (hidden singles first). Another order gives somewhat different numbers, though the same trend.
- Samples are 7–10 puzzles per level.
- The book's own explanation of its levels hasn't been read.

## Findings by level

**Level 1 (8 puzzles, pages 31–37 and 46).** Every one has exactly 30 givens and is tier 1 (singles solve it). The book appears to use a fixed number of givens and to vary which techniques are needed.

Compared with our puzzles, walking each one with singles only and counting the placements available at each step:

| Set | Puzzles | Givens | Moves available per step (avg) | Steps with only 1–2 moves |
|---|---|---|---|---|
| Book level 1 | 8 | 30 | 8.0 | 3.6 |
| Our Easy (last 30 days) | 30 | 44 | 8.3 | 3.0 |
| Our Medium (singles-solvable ones) | — | 38 | 6.8 | 3.4 |
| Our Hard (singles-solvable ones) | — | 34 | 5.7 | 5.4 |

So book level 1 is about as hard to *spot* as our Easy, with a similar number of moves open at each step, but it is about a third longer: 51 cells to fill against 37.

**Level 2 (7 puzzles, pages 59–65).** Again exactly 30 givens and tier 1 on our grader, so our current tiers cannot tell level 1 from level 2. Finer measures do:

| Set | Puzzles | Moves available per step | Solvable by naked singles alone | Solvable by hidden singles in regions alone | Solvable by hidden singles in regions and edges |
|---|---|---|---|---|---|
| Book level 1 | 8 | 8.0 | 3 of 8 | 0 of 8 | 8 of 8 |
| Book level 2 | 7 | 6.5 | 0 of 7 | 0 of 7 | 7 of 7 |
| Our Easy (last 30 days) | 30 | 8.3 | 14 of 30 | 8 of 30 | 28 of 30 |

- A *naked single* is a cell where only one digit fits once every region, edge and touching cell is checked. A *hidden single* is a digit that fits in only one cell of a region or edge.
- Level 2 offers fewer moves at each step, and no level-2 puzzle can be finished with naked singles alone.
- The samples are small, so treat these as early signals.

**Level 3 (10 puzzles, pages 116–125).** Six have 30 givens and four have 27. All ten are still solvable with singles only (tier 1). Difficulty keeps rising through scarcity, not new techniques:

| Set | Puzzles | Tier 1 (singles only) | Moves available per step | Steps with only 1–2 moves | Solvable without naked singles |
|---|---|---|---|---|---|
| Book level 1 | 8 | 8 of 8 | 8.0 | 3.6 | 8 of 8 |
| Book level 2 | 7 | 7 of 7 | 6.5 | 3.3 | 7 of 7 |
| Book level 3 | 10 | 10 of 10 | 4.7 | 7.8 | 8 of 10 |
| Our Easy (last 30 days) | 30 | 28 of 30 | 8.3 | 3.0 | 28 of 30 |
| Our Medium (last 30 days) | 30 | 12 of 30 | 6.8\* | 3.4\* | 12 of 30 |
| Our Hard (last 30 days) | 30 | 8 of 30 | 5.7\* | 5.4\* | 6 of 30 |

\* Averaged over the puzzles that singles can solve.

- Through level 3 the book never needs more than singles. Each level offers fewer moves at a time: 8.0, then 6.5, then 4.7.
- Most of our Medium and Hard puzzles need techniques beyond singles, which the book doesn't ask for even at level 3. On technique, our Medium is already harder than the book's level 3. Level 4 will show whether the book uses power cells or pairs at all.

| Page | Level | Givens | Our tier |
|---|---|---|---|
| 31 | 1 | 30 | 1 |
| 32 | 1 | 30 | 1 |
| 33 | 1 | 30 | 1 |
| 34 | 1 | 30 | 1 |
| 35 | 1 | 30 | 1 |
| 36 | 1 | 30 | 1 |
| 37 | 1 | 30 | 1 |
| 46 | 1 | 30 | 1 |
| 59 | 2 | 30 | 1 |
| 60 | 2 | 30 | 1 |
| 61 | 2 | 30 | 1 |
| 62 | 2 | 30 | 1 |
| 63 | 2 | 30 | 1 |
| 64 | 2 | 30 | 1 |
| 65 | 2 | 30 | 1 |
| 116 | 3 | 30 | 1 |
| 117 | 3 | 27 | 1 |
| 118 | 3 | 27 | 1 |
| 119 | 3 | 30 | 1 |
| 120 | 3 | 30 | 1 |
| 121 | 3 | 30 | 1 |
| 122 | 3 | 27 | 1 |
| 123 | 3 | 27 | 1 |
| 124 | 3 | 30 | 1 |
| 125 | 3 | 30 | 1 |
| 150 | 4 | 27 | 1 |
| 151 | 4 | 27 | 1 |
| 152 | 4 | 27 | 1 |
| 153 | 4 | 27 | 1 |
| 154 | 4 | 27 | 1 |
| 155 | 4 | 27 | 1 |
| 156 | 4 | 27 | 1 |
| 157 | 4 | 30 | 1 |
| 158 | 4 | 30 | 1 |
| 159 | 4 | 30 | 1 |

## Open questions

Questions to settle before TRI-046 and TRI-047 are built:

1. **Should every difficulty be singles-only, like the book?** That would make our Medium and Hard easier on technique but scarcer on moves. Puzzles that need power cells or pairs would be dropped, or saved for an Expert level (TRI-076).
2. **Givens.** Keep about 44 for Easy, or move toward the book's 27–30? Fewer givens means a longer solve at the same technique level.
3. **Which scarcity measure, and what thresholds?** Moves per step and tight steps depend on the order moves are taken in. A grader could instead use the hardest moment (fewest options at any step), an average over several solving orders, or a count of naked singles needed. The thresholds suggested above are anchors from 7–10 puzzles per level.
4. **Is the book what our players want?** Check against real solve times and completion by difficulty once TRI-020 has data, and against playtests (R-06) and difficulty ratings (TRI-042, `difficulty_rated`).
5. **How does the author describe the levels?** The book's introduction hasn't been read. A photo of it would confirm or correct this reading.

## How the puzzles were transcribed

For whoever adds more puzzles:

- **Photos to text, row by row.** Row *r* (from the top) has 2*r*+1 cells, alternating up and down triangles, starting with up. Each digit's position was read from the bold region lines and the coloured cells, which give fixed reference points:
  - Outer-edge cells are the book's main colour.
  - Inner-triangle cells are its second colour.
  - Cells on both are a third, darker colour.
  - On the bottom row, every up triangle is an outer-edge cell.
- **Up or down.** In an up triangle the digit sits low in the row; in a down triangle it sits high.
- **Angled photos.** Pages that curve or were shot at an angle shift digits sideways, mostly on the right. Mapping positions straight-line from the triangle's corners worked for flat photos but drifted on curved ones; reading by hand against the reference cells was reliable.
- **Checking.** `pnpm check-book` confirms each file has exactly one solution. A misplaced or misread digit almost always causes a clash, no solution or several solutions. Page 32 was the one error found: three right-side digits were one cell too far left, and the checker caught it.


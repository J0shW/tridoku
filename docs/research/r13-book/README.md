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

## Findings

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

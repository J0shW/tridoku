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

So book level 1 is about as hard to *spot* as our Easy, with a similar number of moves open at each step, but it is about a third longer: 51 cells to fill against 37. More levels are needed before drawing conclusions.

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

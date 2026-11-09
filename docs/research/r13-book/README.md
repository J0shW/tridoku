# R-13 · How a published Tridoku book grades difficulty

Puzzles transcribed from a Tridoku book, to learn how it decides each puzzle's level before we build our own technique grader (TRI-046, TRI-047). See [R-13](../../backlog/research.md).

**Source:** a printed Tridoku puzzle book owned by Josh (title and author to be added). The puzzles are the book author's work and are kept here only for this research.

## Levels

The book marks each puzzle's level with small triangles in the page's top corner: one triangle is level 1 (easiest), and so on.

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

To be written once enough puzzles from each level are in.

| Page | Level | Givens | Our tier |
|---|---|---|---|
| 46 | 1 | 30 | 1 |

# Evaluation scripts

Scripts used for the [baseline review](../../docs/reviews/2026-11-06-baseline.md) and for each milestone review (see [docs/evaluation](../../docs/evaluation/README.md)).

They need Node 22.6 or later. Node 23.6+ runs `.ts` files directly; on Node 22, keep the `--experimental-strip-types` flag shown below.

## grade-puzzles.ts

Checks every puzzle in `public/puzzles/` with an independent solver:
- the puzzle is 81 digits
- no givens conflict
- it has exactly one solution (no iteration cap)
- the technique tier needed to solve it:
  - **1** = singles only
  - **2** = adds power-cell eliminations
  - **3** = adds naked pairs and triples
  - **4** = needs more, possibly guessing

```sh
node --experimental-strip-types scripts/eval/grade-puzzles.ts          # summary table
node --experimental-strip-types scripts/eval/grade-puzzles.ts --json   # one row per puzzle
```

It exits with code 1 if any puzzle is broken, so CI can use it (TRI-013). It takes about 3 seconds for a year of puzzles.

## solve-day.ts

Prints a date's puzzles and solutions as JSON. `play-through.cjs` uses it to finish puzzles.

```sh
node --experimental-strip-types scripts/eval/solve-day.ts 2026-11-06
```

## play-through.cjs

Plays the running app in headless Chromium:

1. Full puzzles at 1440px (Medium, keyboard) and 390px (Easy, touch), with screenshots of each stage.
2. Re-runs each baseline bug check and prints the expected result next to the actual one:
   - streak across consecutive days
   - puzzle number in four time zones
   - midnight rollover
   - failed puzzle download
   - keyboard-only entry
   - number pad at 360×640
   - reduced motion

```sh
pnpm build && pnpm start &               # or point it at a preview URL you can reach
node scripts/eval/play-through.cjs http://localhost:3000 docs/reviews/2026-12-01-m0
```

It writes screenshots and a `results.md` to the output folder. It needs Playwright with Chromium (`npm i -g playwright && npx playwright install chromium`). If Playwright is installed globally, run it with `NODE_PATH=$(npm root -g)`.

The board selector (`CELL` at the top) matches the SVG board as of the baseline. Update it when the board changes (for example once TRI-062 makes it a `role="grid"`).

### Baseline results (6 Nov 2026)

| Check | Expected | Baseline |
|---|---|---|
| Streak after 5 days + today | 6 | 1 |
| Puzzle number on the same date across time zones | all equal | #309, #310, #311 |
| Next day's puzzle playable after a late finish | yes | no |
| Failed download shows an error | yes | no |
| Keyboard-only entry | yes | no |
| Number pad visible at 360×640 | yes | no (bottom at 746 px) |
| Selection animation with reduced motion | none | dash-animation |

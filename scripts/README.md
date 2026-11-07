# Scripts

| Script | What it does |
|---|---|
| `generate-puzzles.mjs` | Generates the daily puzzles (easy, medium, hard) into `public/puzzles/<year>.json` |
| `generate-favicon.mjs` | Builds the favicon images |
| `eval/` | Puzzle grading and the browser play-through used for product reviews ([README](eval/README.md)) |

## How daily puzzles are published

1. The **Generate Daily Puzzle** GitHub Action (`.github/workflows/daily-puzzle.yml`) runs at 06:00 UTC every day.
2. It makes sure puzzles exist for the next 3 days (UTC), generating any that are missing with `generate-puzzles.mjs`.
3. It checks every puzzle with `scripts/eval/grade-puzzles.ts`. If any is malformed, has conflicting givens or doesn't have exactly one solution, the run fails before committing, and GitHub emails the repo owner.
4. It commits the updated `public/puzzles/<year>.json` to `main`, which deploys to production on Vercel.

The app fetches the year's file and picks the entry for the player's local date (`lib/puzzle-service.ts`).

## Generating puzzles by hand

```sh
# Fill any missing days in a range (existing days are kept)
node scripts/generate-puzzles.mjs --year=2026 --startMonth=11 --startDay=10 --endMonth=11 --endDay=12

# Regenerate the range, overwriting existing days
node scripts/generate-puzzles.mjs --year=2026 --startMonth=11 --startDay=10 --endMonth=11 --endDay=12 --doHardReplace
```

Then run `pnpm grade-puzzles` (or `pnpm test`) to check the result.

## How puzzles are made

For each day and difficulty, seeded by the date:

1. Fill a complete valid board by randomized backtracking.
2. Remove cells in groups of three that are 120° rotations of each other, keeping each removal only if the puzzle still has exactly one solution. This makes every puzzle rotationally symmetric.
3. Stop near a target number of givens for the difficulty: Easy 42–48, Medium 33–39, Hard 24–30. Results can land up to 6 above target.

Difficulty is currently set only by the number of givens. Grading by solving technique is planned in TRI-046 and TRI-047 (see `docs/backlog/`).

## File format

```json
{
  "2026-11-06": {
    "easy":   { "date": "2026-11-06", "difficulty": "easy",   "seed": 20261106, "puzzle": "<81 digits, 0 = empty>", "metadata": { "generatedAt": "…", "givens": 45 } },
    "medium": { "…": "…" },
    "hard":   { "…": "…" }
  }
}
```

The 81 digits list the playable cells row by row, top to bottom and left to right.

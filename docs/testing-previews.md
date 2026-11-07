# Testing changes in the browser

Every change can be tried on a live preview site before it reaches tridokupuzzle.com. You don't need to run anything locally.

## Where previews come from

Vercel builds every branch pushed to GitHub:

| What | URL | Updates when |
|---|---|---|
| A pull request | Posted by the Vercel bot as a comment on the PR, and listed under the PR's checks | Each push to the PR's branch |
| A branch | `https://tridoku-git-<branch-name>-joshs-projects-209610e8.vercel.app` (slashes in the name become dashes) | Each push to that branch |
| Production | `https://www.tridokupuzzle.com` | Each push to `main` |

Preview sites are private: you need to be signed in to Vercel to open them. To let a playtester in, use **Share** on the deployment in the Vercel dashboard.

Previews are kept out of search engines, and Umami only counts visits on the production domain, so testing doesn't skew the stats.

## The dev tools panel

Previews (and `pnpm dev`) show an amber **Preview** button in the bottom-left corner. It never appears in production. It opens a panel with:

- **Clock.** Move the app's clock by a day either way, or jump to 23:58 tonight. The whole app (the daily puzzle, puzzle number, streaks and saved progress) behaves as if it's that time. The button shows the simulated date while the clock is shifted. Use **Real time** to undo.
- **Fill all but 3 cells.** Solves the open puzzle except three cells near the bottom, so you can reach the win screen in a few taps.
- **Seed 5-day streak.** Sets a 5-day streak ending yesterday for the current difficulty. Solve today's puzzle and the streak should read 6.
- **Clear all saved data and reload.** Starts over as a first-time player.

Everything in the panel changes only this browser's saved data.

### Example: checking the streak fix

1. Open the PR's preview and choose a difficulty.
2. Open **Preview → Seed 5-day streak**.
3. Choose the same difficulty again, then **Fill all but 3 cells** and finish the puzzle.
4. The win screen should show a current streak of 6.
5. Press **+1 day** and solve again. It should show 7.

## Puzzles on older branches

A branch only has the puzzles that existed when it was created, and the daily bot adds new ones only to `main`. For any date a preview doesn't have, it loads that date's puzzle from production. A preview of an old branch therefore shows the real puzzle of the day, not the backup puzzle.

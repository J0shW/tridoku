# Research and decisions

Questions that need the owner, player data or playtests rather than code. Each feeds one or more backlog items.

| ID | Question | What to do | Review | Who | Status |
|---|---|---|---|---|---|
| R-01 | Naming and rights | Tridoku is credited to Japheth J. Light in the rules. Confirm permission to use the name, especially before any paid feature (TRI-074, TRI-075). | Open question 1 | Owner | Open |
| R-02 | Current funnel baselines | Pull loaded → completed ratios by difficulty from Umami for the last 30 days, before M0 analytics ships, and record them in `docs/metrics.md`. | Open question 2 | Owner | Open |
| R-03 | Mobile vs desktop traffic | Read device split from Umami. If mobile is the majority, start M3's mobile items before M2's gameplay items. | Open question 3 | Owner | Open |
| R-04 | Who is the target player? | Write one paragraph describing the main player (existing Sudoku fan vs casual daily player). It decides defaults like starting on Easy (TRI-027). | 1.3 | Owner | Open |
| R-05 | Do first-timers understand the rules? | Watch 5 people who have never played try today's Easy with no help. Note whether anyone discovers no-touch-at-corners, and how far they read the rules. Repeat after TRI-029. | Open question 4, 2.3 | Owner | Open |
| R-06 | Are Tier 4+ puzzles fun or unfair? | Have 5 Sudoku regulars play one Tier 2 and one Tier 4 Hard; compare times and how they felt. Decides whether Tier 4 becomes Expert (TRI-076) or is dropped. | Open question 5, 3.1 | Owner | Open |
| R-07 | How often do mobile players mis-tap? | Once TRI-019 ships, measure clears within 2 seconds of an entry on mobile vs desktop. Re-measure after TRI-059. | Open question 6, 4.2 | Claude + owner | Open |
| R-08 | Pipeline deploys and history | Answered: every bot commit to `main` deploys production (Vercel, 6 Nov). Still to check: Action run history for failures, and whether bot commits keep the schedule from being disabled (feeds TRI-012). | Open question 7, 12.3 | Claude | Partly answered |
| R-09 | Per-difficulty streaks: intended? | Decide whether the headline streak should be global (TRI-069) or per difficulty. | Open question 8, 7.6 | Owner | Open |
| R-10 | When to ask for feedback | Compare response rate and usefulness of feedback asked after a win vs after a Reset or long stall (see TRI-044). | 11.2 | Claude + owner | Open |

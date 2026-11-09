# M2 · Puzzle quality and gameplay

**Goal.** Make every label honest and every puzzle fair, and give stuck players a way forward.

**Done when**
- Every published puzzle is graded and its tier matches its label; CI enforces it.
- Undo, automatic note cleanup and a hint are available.
- Completion rate by difficulty and solve-time spread are compared with M1.
- The milestone evaluation has been run and saved in `docs/reviews/` (see [evaluation](../evaluation/README.md)).

Items are listed in the suggested order of work. Status lives in [BACKLOG.md](BACKLOG.md).

<a id="tri-046"></a>
## TRI-046 · Grade puzzles by solving technique

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Critical | H | M | Completion rate by difficulty, solve-time spread | [TRI-013](m0-foundations.md#tri-013), [R-13](research.md) | 3.1, 3.a |

**On hold (9 Nov 2026).** R-13 found that the inventor's book grades by scarcity within singles, never by harder techniques ([findings](../research/r13-book/README.md)). Wait for the owner's decision on its recommendation before building this.

**Problem.** Difficulty is set only by the number of givens. 17% of Hard puzzles need only singles; 7% of Medium and 22% of Hard need more than pairs, possibly guessing.

**Done when**
- [ ] The generator runs a logic grader on every candidate, using the techniques and definitions found in R-13 (at least singles, power-cell eliminations, naked pairs/triples).
- [ ] Each puzzle's `metadata` stores `tier` and technique counts.
- [ ] The grader lives in shared code used by both the generator and the CI test.

<a id="tri-047"></a>
## TRI-047 · Accept puzzles only at the right tier

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Critical | H | S | Completion rate by difficulty | [TRI-046](m2-puzzle-quality.md#tri-046) | 3.1, 3.a, 3.2 |

**On hold (9 Nov 2026).** R-13 found that the inventor's book grades by scarcity within singles, never by harder techniques ([findings](../research/r13-book/README.md)). Wait for the owner's decision on its recommendation before building this.

**Problem.** The generator accepts results up to 6 givens above target and never checks difficulty.

**Done when**
- [ ] Each difficulty accepts only puzzles matching its R-13 definition. Starting point before R-13: Easy = Tier 1; Medium = Tier 2; Hard = Tier 2–3 with a minimum number of eliminations; Tier 4+ is rejected (or saved for Expert, TRI-076).
- [ ] CI fails if a published puzzle's tier doesn't match its label.
- [ ] Future puzzles already generated are regenerated with the new rules.

<a id="tri-048"></a>
## TRI-048 · Uniqueness check can't report a false "unique"

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Low | M | S | Puzzle quality | none | 3.5 |

**Problem.** `countSolutions` stops after 1M iterations (`generate-puzzles.mjs:313`) and may report one solution when it simply gave up.

**Done when**
- [ ] Hitting the cap counts as "not proven unique" and the removal is rejected.
- [ ] The same fix applies to the copy in `lib/tridoku.ts` (or that copy is deleted).

<a id="tri-049"></a>
## TRI-049 · Weekly difficulty rhythm

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | M | S | D7 retention | [TRI-047](m2-puzzle-quality.md#tri-047) | 13.2, 13.a |

**Problem.** Difficulty varies at random day to day.

**Done when**
- [ ] Each weekday has a target band, e.g. Monday Medium = Tier 1–2 low eliminations, Saturday Medium = Tier 2 with 5+ eliminations.
- [ ] The schedule is documented in `scripts/README.md`.

<a id="tri-050"></a>
## TRI-050 · Grade puzzles in the daily Action

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | M | S | Puzzle quality | [TRI-046](m2-puzzle-quality.md#tri-046) | Evaluation plan, 12.c |

**Problem.** Quality checks should run where puzzles are made, not only in PRs.

**Done when**
- [ ] The daily Action runs the grader and uniqueness test before committing, and fails (emailing the owner) if anything is off.

<a id="tri-051"></a>
## TRI-051 · Serve one puzzle file per day

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | M | M | Load time | [TRI-010](m0-foundations.md#tri-010) | 12.7, 12.d |

**Problem.** Each play downloads the whole year (189 KB, ~330 KB by December), including the next two days' puzzles.

**Done when**
- [ ] Puzzles are published as `/puzzles/YYYY/MM-DD.json`.
- [ ] The app fetches only the needed day.
- [ ] The yearly file is kept for the archive or removed.
- [ ] Preview fallback to production (PR #34) works with the new layout.

<a id="tri-052"></a>
## TRI-052 · Undo

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| High | H | S | Completion rate | none | 3.3, 3.b |

**Problem.** There's no undo; the only escape from a mistake chain is Reset.

**Done when**
- [x] An Undo button under the timer and Ctrl/Cmd-Z undo the last entry, clear or note change, multiple steps back. *Placement changed from "beside Pen/Pencil" after the Proposed D prototype (9 Nov): next to the pad it invited accidental taps. Reset lives in the ⋯ menu (TRI-087).*
- [x] Each undo selects and briefly flashes the cell it changed; the button says what it put back for 2 seconds ("Removed 7", "Back to 3", "Pencil 4 off"). On boards narrower than about 350 px the corner only fits "Undo", so the flash alone shows what changed.
- [x] Undo history survives a reload for the current puzzle (saved with the progress, up to 200 steps).
- [x] Owner check on a phone in the preview. *Approved 9 Nov, with ⋯ moved under Check.*

*Redo: not built. The completion event counts `undo_reentries` (a digit entered again in the same cell straight after an undo removed it). If that is common, an accidental undo is common and Redo is worth adding.*

<a id="tri-053"></a>
## TRI-053 · Remove placed digits from notes automatically

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| High | H | S | Completion rate, solve time | none | 3.3, 3.c |

**Problem.** Placing a digit doesn't update neighbors' pencil marks.

**Done when**
- [ ] Placing a digit removes it from the notes of touching cells and every region and edge the cell belongs to.
- [ ] Undo restores them.
- [ ] A setting can turn this off.

<a id="tri-054"></a>
## TRI-054 · Hint: show a cell that can be solved now

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | H | M | Completion rate, abandonment point | [TRI-046](m2-puzzle-quality.md#tri-046) | 3.3, 3.d |

**Problem.** A stuck player has no help short of Reset.

**Done when**
- [ ] A Hint button highlights one cell that can be solved with the simplest available technique and names the technique.
- [ ] Hints used are recorded on the completion event and shown on the result card.

<a id="tri-055"></a>
## TRI-055 · Tell players when a full board is wrong

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | M | S | Completion rate | none | 3.4, 3.e |

**Problem.** When every cell is filled but something is wrong, nothing happens.

**Done when**
- [ ] A toast says "Something's off. Turn on error check?" with a button that turns it on.

**Check it in a preview.** Dev tools → Fill all but 3 → enter one wrong digit and two right ones.

<a id="tri-056"></a>
## TRI-056 · Dim digits that are fully placed

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Low | M | S | Solve time | none | 4.6, 4.e |

**Problem.** The number pad doesn't show which digits are done.

**Done when**
- [ ] A digit button dims (and shows a check) when all 9 copies are placed correctly by the rules.

<a id="tri-057"></a>
## TRI-057 · Make highlight-a-digit discoverable

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Low | L | S | Feature use | none | 4.6 |

**Problem.** Highlighting all copies of a digit (tap the selected cell again) is only explained in the rules.

**Done when**
- [ ] Long-pressing a number-pad digit also highlights it.
- [ ] A one-time hint appears the first time a player taps the same filled cell twice.

<a id="tri-080"></a>
## TRI-080 · Restructure the game-state hook

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | M | M | Maintainability | [TRI-052](m2-puzzle-quality.md#tri-052) | Found in M0 (TRI-002) |

**Problem.** `hooks/use-tridoku.ts` sets state inside effects (loading stats on mount, recording a win) and duplicates puzzle-loading logic between `changeDifficulty` and `generateNewPuzzle`. The React Compiler lint rules flag these; they are warnings for this file only (`eslint.config.mjs`).

**Done when**
- [x] Stats load through a lazy initializer or external store instead of an effect. *External stores (`lib/local-store.ts`) for stats and today's in-progress puzzles.*
- [x] Winning is recorded in the action that completes the puzzle, not in an effect.
- [x] Puzzle loading lives in one function. *`loadDifficulty`, used by the tabs, Reset, Retry and resume.*
- [x] The lint overrides for this file are removed and `pnpm lint` has no warnings for it.
- [x] Do this together with Undo (TRI-052), which needs the same state reshaping.

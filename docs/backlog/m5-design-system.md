# M5 · Design system

**Goal.** One look and one way of building every screen. Tokens instead of hard-coded colours, one component per pattern, AA contrast and 44 px targets everywhere, and copy that uses the same names throughout. Built from the [UI audit](../reviews/2026-11-09-ui-audit.md) (9 Nov) and specified in the [design system](../design-system.md).

**Direction chosen (11 Nov):** the [difficulty folders canvas](https://claude.ai/artifact/Np9VNxf9yQnakVWoxkCAzK).
- Josh's three difficulty colours as folder tabs, with the board on the selected folder.
- Tonal board palettes, always.
- Dark ink buttons; teal retired.
- Touching cells shown with one continuous outline.
- Theme days, built on the palettes.

**Direction changed (19 Nov):** [Tridoku Mountain](https://claude.ai/artifact/Qm7p2A7CNaFZ9F4bMhzkAL), which replaces the folders. A designer's review (18 Nov) set its main rule: the board is the boldest thing on screen. The Mountain items are [TRI-101](#tri-101) to [TRI-108](#tri-108).

Choices still open are marked **[Decision]** in the design system.

**Done when**
- No hex values, `rgb()` or `oklch()` colours, Tailwind palette colours or unlisted arbitrary values in `app/` or `components/` (the drift guard passes in CI).
- Every button, toggle, tab, notice, dialog and menu comes from `components/ui/`.
- Light and dark reach WCAG 2.2 AA for text and UI parts on every screen in the audit.
- The 360×640, iPhone 13 and SE layouts, the share text, the OG image and the play-through checks are no worse than [before](../reviews/2026-11-09-ui-audit/play-through-before.md).
- A re-audit scores each area of the [scorecard](../reviews/2026-11-09-ui-audit.md#1-scorecard-before) at least 7.

**Every PR in this milestone:**
- has before/after screenshots at 390 px and 1440 px, light and dark;
- runs the five checks (`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm grade-puzzles`);
- runs `node scripts/eval/play-through.cjs` and compares the result with the baseline.

Items are listed in the suggested order of work. Status lives in [BACKLOG.md](BACKLOG.md).

<a id="tri-090"></a>
## TRI-090 · Messages never move the board or the number pad

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| High | H | S | Notes usage, mobile completion | none | UI audit UI-01, UI-07 |

**Problem.** On an iPhone 13 (390×664), the pencil tip, the power-cells tip and the fallback notice each pushed the pad's bottom row (6–9 and Clear) off screen. The pad's bottom moved from 618 px to 708 px. That undid TRI-058 the first time a player tried Pencil. A first fix shrank the board to make room; Josh rejected it (11 Nov) because the board jumping is worse. The rule now: messages never move the board or the pad (design system §3.6).

**Done when**
- [x] Pencil mode shows in the controls: the Pencil button is ink when on, and the number keys show a small corner digit (labelled "Note 3" and so on, with `aria-pressed`).
- [x] The pencil tip is a one-line bubble above the Pen/Pencil switch. It goes after the first note, a tap, or 6 s, and appears once. Keyboard shortcuts are mentioned only on devices with a fine pointer.
- [x] The power-cells tip is a banner that slides in over the top of the screen and hides after 12 s.
- [x] The fallback notice is "From 13 Nov" in the header, in place of the puzzle number; a banner explains it once and comes back when the label is tapped.
- [x] With any message showing, the pad's bottom stays at 618 px on an iPhone 13, 545 px on a 320×568 SE and within 640 px at 360×640. The board doesn't move.
- [x] `play-through.cjs` checks the pad fits with the pencil hint (360×640 and 390×664) and the fallback notice (390×664), and that the board doesn't move when Pencil is turned on.

**Check it in a preview.** On your phone, start a puzzle and tap Pencil: a short dark bubble appears above the switch, the number keys change to small corner digits, and nothing else moves. Pick an empty cell and tap 3: the bubble goes and the 3 key lights up.

<a id="tri-088"></a>
## TRI-088 · Design tokens in globals.css

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | M | S | Consistency | none | UI-06, UI-12, UI-23, UI-24, UI-26 |

**Problem.** Colours, sizes, radii, shadows, layers and durations are written inline across components. There are 60 hex values, 21 Tailwind palette colours, 11 font sizes and 9 radii. `globals.css` also carries unused tokens.

**Done when**
- [x] `app/globals.css` defines the design system's §2 tokens: UI colour roles, difficulty colours, board tokens, type scale, radii, elevation, z-index, durations and easing, each with light and dark values and Tailwind names under `@theme inline`. *The shadcn names point at them. Board tokens are renamed from `--tridoku-*` to `--board-*`.*
- [x] Today's values map onto them, so **nothing looks different**: screenshots before and after match at 390 and 1440, light and dark. *40 screens (welcome, game, Check on, Pencil, menu, Statistics, Rules, paused, `/how-to-play`, 404) compared pixel by pixel with a fixed clock: all match, apart from anti-aliasing noise that two runs of unchanged code also show.*
- [x] The unused `--cell-*`, `--region-*`, `--chart-*` and `--sidebar-*` tokens are removed.
- [x] `docs/design-system.md` status line says which tokens are live.

**Check it in a preview.** Nothing should look different. Compare the game, win modal and stats with production on your phone.

<a id="tri-091"></a>
## TRI-091 · Accessible colour values

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| High | H | S | Accessibility | [TRI-088](#tri-088) | UI-04, UI-05, UI-17, UI-34 |

**Problem.** Several colours fail WCAG AA:
- white on the light teal is 4.28:1;
- the light selection outline is 1.5–2.8:1;
- the footer text is 2.5:1;
- the stats difficulty labels are 2.7–3.8:1;
- dark-mode region lines are 1.7–3.1:1.

Also, every ghost or outline hover turns green, and the digit highlight is an opaque off-palette blue.

**Done when**
- [x] Primary buttons and "on" states are dark ink (`--action`, 14.7:1 with paper text; light ink in dark mode, 14.3:1). Teal is gone from the app, including the header logo, the favicons and links. *Josh chose ink, 11 Nov. The OG image still uses teal; it's redrawn in TRI-095.*
- [x] The selection is a solid ink outline and doesn't animate (6.3:1 or better on every fill). Completes [TRI-066](m3-mobile-accessibility.md#tri-066): the play-through's reduced-motion check now reads "none".
- [x] Region lines are `#2b2420` in both themes (6.3:1 or better). Completes [TRI-068](m3-mobile-accessibility.md#tri-068).
- [x] Muted text is never drawn with opacity (footer 2.5:1 → 5.6:1). Stats labels use the text colour, and "Completed today" uses the success token (5.1:1).
- [x] Hover is a neutral overlay. Tailwind v4's `hover:` only applies on devices that hover. The green `accent` token is removed.
- [x] The digit highlight is drawn on top: an ink cell with a paper digit (14.7:1), not an opaque blue. *Not prototyped before; Josh to judge it in the preview.*
- [x] Contrast is re-run for every changed pair: all pass. See [`2026-11-11-tri-091/contrast.txt`](../reviews/2026-11-11-tri-091/contrast.txt). Red error digits are unchanged (TRI-065).

**Check it in a preview.** On your phone, the Share, Continue and Check-on buttons are dark ink with no teal anywhere. Select a cell: the outline is clearly visible. Switch to dark mode: the board's region lines are as bold as in light mode.

<a id="tri-089"></a>
## TRI-089 · Core components

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | H | M | Consistency | [TRI-088](#tri-088) | UI-03, UI-07, UI-15, UI-36 |

**Problem.** There are seven button styles, three tab styles and four copies of notice markup, and focus styles differ.

**Done when**
- [x] `components/ui/` has the design system's Button (variants, sizes, `shape="pill"`, loading), IconButton, Pill, SegmentedControl (group and tablist, with arrow-key navigation), Notice (four tones, with action and dismiss), Badge and StatTile. *The shadcn Button and Badge move to `legacy-button.tsx` and `legacy-badge.tsx` until TRI-092/093/094 move every screen over.*
- [x] Each has hover (pointer only), pressed, focus-visible and disabled states, 44 px hit areas, and unit tests for its ARIA attributes. *13 tests. Hit areas measured in Chromium: small buttons and segments are 36 px with 4 px extensions, pills 40 + 2 + 2, the dismiss × 32 + 6 + 6.*
- [x] One focus style: a 2 px ink outline with a 2 px offset.
- [x] The Pill's "on" state is ink for now (the palette tone comes with TRI-099). *Paper pills on the folder come with TRI-092, when there's a folder.*
- [x] Nothing in the app uses them yet, so this PR is safe to merge on its own. *The game compared pixel by pixel against main: 40/40 match. A preview-only sheet at `/test/components` shows every component in light and dark.*

**Check it in a preview.** No visible change. Review the screenshots of each component in light and dark in the PR.

<a id="tri-093"></a>
## TRI-093 · Game screen on the system

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | H | M | Completion rate, consistency | [TRI-089](#tri-089), [TRI-090](#tri-090), [TRI-091](#tri-091) | UI-03, UI-08, UI-11, UI-14, UI-18, UI-19, UI-20, UI-21, UI-30, UI-38, UI-41 |

**Problem.** The header, corner controls, Pen/Pencil, number pad, notices and view-mode banner each have their own styling. Sixteen controls are under 44 px. The game opens scrolled down on 320 px phones.

**Done when**
- [ ] Header icons, corner pills, Pen/Pencil, pad keys and notices use the TRI-089 components, with 44 px hit areas.
- [ ] Undo's note changes only its label, so it no longer looks like Check on.
- [ ] The pad looks tappable before a cell is selected; tapping a key then says "Pick a cell first".
- [ ] The view-mode banner is a `success` Notice.
- [ ] The ⋯ menu is a Radix DropdownMenu with keyboard navigation, and Reset is in danger text.
- [ ] Starting a game scrolls to the top.
- [ ] The TRI-087 corner layout, the TRI-058 fit, and the Undo label hiding under 350 px all stay as they are. The play-through pad-fit check passes at 360×640 and 390×664.
- [ ] No hex values or palette colours remain in `tridoku-game.tsx`, `tridoku-board.tsx`, `game-controls.tsx`, `input-mode-toggle.tsx` or `number-pad.tsx`.

**Check it in a preview.** Play a few moves on your phone. Try Undo, Check, ⋯ → Reset puzzle → Cancel, Pencil with its tip, and pause. Then finish and look at the solved view. Repeat in dark mode.

<a id="tri-092"></a>
## TRI-092 · Difficulty folders

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| High | H | M | Rule comprehension, consistency | [TRI-089](#tri-089), [TRI-099](#tri-099) | UI-02, UI-15, UI-39 |

**Won't do (19 Nov).** Replaced by the Mountain direction ([TRI-101](#tri-101)). A designer's review found the big folder colour panels pulled the eye before the board. The colour-meaning and tablist problems below are covered by TRI-101.

**Problem.** Difficulty colour means three different things:
- the tabs and cards use blue, amber and pink, where Easy's blue is the board's outer-edge blue;
- the stats modal uses green, yellow and red;
- the share text uses 🟢🟡🔴.

The difficulty tabs also have no selected state for screen readers.

**Done when** (design system §2.2 and §3.5; [canvas](https://claude.ai/artifact/Np9VNxf9yQnakVWoxkCAzK))
- [ ] The difficulty tabs are folder tabs in Josh's colours (#bfdde2, #ecbd6c, #e26495). The selected tab runs into a card of its colour that holds the board and the corner pills.
- [ ] The welcome screen shows today's three puzzles as a stacked file of folders with their status.
- [ ] The win card is the same folder: tab, "Solved" and the time on the colour, then stats, Share result and "Next up" in the next difficulty's colour.
- [ ] Statistics uses the folder tabs. No green, yellow or red labels remain.
- [ ] The difficulty colours are used for nothing else, and no rule shade is used outside the board and the rule diagrams.
- [ ] The tabs are a tablist with `aria-selected`.
- [ ] The TRI-058 fit and TRI-087 corner layout hold at 360×640 and 390×664 (play-through checks).
- [ ] The share text is unchanged, unless Josh tests a change on iMessage, Notes, WhatsApp and Discord.

**Check it in a preview.** On your phone, switch between Easy, Medium and Hard: the folder and the board change colour together. Open the welcome screen, finish a puzzle, and open Statistics. All three use the same folders.

<a id="tri-099"></a>
## TRI-099 · Tonal board palettes

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| High | H | M | Rule comprehension, consistency | [TRI-088](#tri-088) | UI-02, UI-17, UI-34; owner decision 11 Nov |

**Won't do (19 Nov).** Built in PR #63 but closed unmerged when Josh switched to the Mountain direction. Its tonal palettes were in the folder colours. [TRI-102](#tri-102) takes over the palette system, the contrast test and the rule copy, with the Mountain's dual-tone colours. [TRI-103](#tri-103) drops the touching-cells outline, and [TRI-101](#tri-101) replaces the tone toggles with pale tints.

**Problem.** The board's rule colours (blue, yellow, green) clash with the difficulty folders: Easy's blue *is* the outer-edge blue. Josh chose tonal boards: each difficulty's board is a family of its own colour, and the rules read as shades.

**Done when** (design system §2.3)
- [ ] The board draws every colour from a palette (`lib/palettes.ts`): four shades plus line, entry and note inks. There are no colour literals in `tridoku-board.tsx` or `rule-diagrams.tsx`.
- [ ] Easy, Medium and Hard each have the palette in the design system. The shade order (none < outer < inner < both) is the same on every board.
- [ ] Touching cells get one continuous outline around the selection and its 12 neighbours (`--board-touching`), replacing the dark fill. No board state changes a cell's fill except the error tint.
- [ ] A unit test checks every palette: shades in order; givens, entries and notes at least 4.5:1 on all four shades.
- [ ] The rules modal, the rule diagrams and `/how-to-play` describe "the lightest, middle and deepest shades" instead of blue, yellow and green, and draw with the current palette.
- [ ] [TRI-031](m1-first-impression.md#tri-031)'s rule ("same colours on every difficulty") is recorded as replaced by "same shade order on every difficulty". Josh signed off on 11 Nov.
- [ ] Player entries are navy `#1e3a5f` (6.2, 5.9 and 5.0:1 minimum). Covers [TRI-061](m3-mobile-accessibility.md#tri-061).
- [ ] Each palette has a `tone` and `on-tone` (design system §2.3). Toggles use them when on, instead of ink: the Pencil button, number keys with a note, and Check if the prototype agrees. *Josh, 11 Nov: ink or white doesn't read clearly as on/off for a toggle.* Prototype first; also decide whether Share and Play take the tone or stay ink.
- [ ] The palette test also checks `tone` against the off keys (3:1 or better in both themes) and `on-tone` text on `tone` (4.5:1 or better).

**Check it in a preview.** On your phone, play a few moves on each difficulty. You can tell outer, inner and both cells apart on all three boards. Select a cell: one outline goes round it and its 12 neighbours, and digits inside stay clear. Open How to play: the rule cards describe shades and match the board.

<a id="tri-101"></a>
## TRI-101 · Mountain look: run signs and scenery

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| High | H | M | Shares, return visits, consistency | [TRI-089](#tri-089), [TRI-102](#tri-102) | Owner decision 19 Nov; designer review 18 Nov |

**Problem.** Josh changed direction on 19 Nov, from difficulty folders to **Tridoku Mountain** ([canvas](https://claude.ai/artifact/Qm7p2A7CNaFZ9F4bMhzkAL)). The difficulties become ski runs: ● Green circle (Easy), ■ Blue square (Medium), ◆ Black diamond (Hard). The board is the peak. A designer reviewed both canvases on 18 Nov:
- the folders' big colour panels pulled the eye before the board did;
- the first Mountain draft's solid signs, solid toggles and dark trees did the same.

The rule from that review: **the board is the boldest thing on screen.** Blur a screenshot (the squint test) and the board should be the first thing you see.

**Done when** (the quiet look on the canvas)
**Built in two PRs.** (A) the theme picker and the Mountain game screen; (B) the trailhead welcome screen. The picker shows on previews only until (B) lands, so the live site never shows a half-built Mountain.

- [x] The difficulty tabs are three trail signs: a shape plus Easy, Medium or Hard. The selected run gets a thin border and underline in its colour, never a solid fill. The others are muted. The signs are a tablist with `aria-selected`. *`RunSigns` in `components/mountain.tsx`; a ✓ for done today and a dot for in progress.*
- [x] Run colours: green `#1d7a43`, blue `#1d5bb8`, black `#15171c`. They're used only for signs, toggles and the finish screens, never as big panels.
- [x] ~~Each run has a name for the day (for example Marmot Meadow), shown beside the input switch.~~ *Dropped (Josh, 20 Nov): the names were invented and drew attention away from the difficulty. Runs are identified by difficulty and ski grade only (Easy · Green, Medium · Blue, Hard · Black diamond; Josh: "people know the ski difficulties"); the grade shows beside the input switch.*
- [x] The scenery behind the board: sky, two flat ranges of hills and small pines. The pines are in the hills' blue-grey (no more than 1.6:1 against the sky), so they never compete with the board. Nothing is drawn under the board.
- [x] Toggles that are on (Pencil, number keys with a note, Check) use a pale tint of the run colour with a border and text in the run colour. The text is 4.5:1 or better in both themes. These replace the ink toggles on main. *Through `--toggle-on` tokens, so Classic keeps its ink toggles. Lowest: Easy, 4.6:1.*
- [x] The welcome screen is a trailhead: a signpost with three arrow signs, one per run. Each sign shows the run's difficulty and ski grade with a one-line description, and a status: your time, "On it" or "Fresh". A button below continues your current run. *`TrailheadSigns` in `components/mountain.tsx`, with today's board as the peak above. Each sign leads with the difficulty, then the grade ("Green") and "Great first puzzle". The heading is "Tridoku" with "It's Sudoku on a triangle. 3 challenges per day." under it (Josh, 20 Nov: name first, no cell or rule counts); "Pick your run" labels the signs. Status reads "Start", "Continue · 2:10" (as on Classic) or "✓ Done" (today's time isn't stored): the action the sign takes, or that it's finished (Josh, 20 Nov, replacing "Fresh" and "On it"). The time sits under "Continue". "Start" hides on phones under 360 px; on a 320 px phone with Hard in progress, "Black diamond" shortens to "Black dia…". First-time players still get the big Play button and How to play above the signs; returning players with a puzzle in progress go straight back into it, as on Classic, so no separate Continue button.*
- [x] Dark mode is night skiing: navy sky, stars and a moon. The board stays light, like floodlit snow. The Black diamond turns light at night so it stays visible. *No moon: it collided with the ⋯ button.*
- [x] Barlow Condensed for signs and headings and Barlow for body text, loaded with `next/font`.
- [ ] The PR has blurred (squint-test) screenshots of each run at 390 px, light and dark, and the board stands out first in every one.
- [x] The TRI-058 fit and TRI-087 corner layout hold at 360×640 and 390×664 (play-through checks). *Mountain's pad sits 20 px lower than Classic's (taller signs, the run-name row, and scenery that runs a little below the board, which Josh asked for on 20 Nov): 612 of 640, 638 of 664, 565 of 568 on a 320 px SE.*
- [x] **[Decided 19 Nov]** Players choose Classic or Mountain with a theme picker. Everything above applies to the Mountain theme; Classic keeps today's screens. *"Look: Classic / Mountain" in the ⋯ menu, remembered on the device, with `board_theme_changed`. Classic is the default. A script in `<head>` sets the theme before the first paint.*
- [x] The picker shows on the live site (after the trailhead PR). *Classic stays the default for now; Josh to decide whether new players get Mountain.*

**Check it in a preview.** On your phone, open the game and switch between the three runs. Only the board, and the thin line under the selected sign, should catch your eye. Turn on dark mode for night skiing. Open the welcome screen and read the signpost.

<a id="tri-102"></a>
## TRI-102 · Dual-tone run boards

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| High | H | M | Rule comprehension, consistency | [TRI-088](#tri-088) | Owner decision 17 Nov; UI-02, UI-17, UI-34 |

**Problem.** On the mountain, each run's board has two hues. The outer sides are a tint of the run's colour, the inner triangle is a warm "sunlit" hue, and cells in both are the deepest shade. It takes over the palette system from [TRI-099](#tri-099), which was closed unmerged; PR #63 is a working reference for the code.

**Two board themes (Josh, 19 Nov).** Players will choose between **Classic** (today's colours) and **Mountain** with a theme picker in [TRI-101](#tri-101). Until then Classic is the only theme on the live site, and Mountain is preview-only: open a preview with `?theme=mountain` (and `?theme=classic` to go back), which is remembered on that device.

**Done when**
- [x] The board draws every colour from a palette in `lib/palettes.ts`: four shades plus line, given, entry and note inks. There are no colour literals for the rule shades in `tridoku-board.tsx` or `rule-diagrams.tsx`. The game applies the current palette on `<html>`, so dialogs use it too. *`getPalette(theme, run, dark)`; Classic is the CSS default and the same on every run.*
- [x] The Mountain palettes are (outer, inner, both, neither):

  | Run | Outer | Inner | Both | Neither |
  |---|---|---|---|---|
  | Green circle | `#d2ecd9` | `#f5e2b2` | `#aec98f` | `#fbfdfb` |
  | Blue square | `#d3e2f6` | `#f6dcc4` | `#b4b9dd` | `#fbfcff` |
  | Black diamond | `#dde1e7` | `#f3d2d4` | `#bfaab6` | `#fcfcfd` |
  | Night (all runs) | `#c9dbea` | `#ecd6bc` | `#a9b2cf` | `#e9eef4` |

- [x] Region lines and givens are slate `#1c2733` on Mountain. Your digits are navy `#1e3a5f` on both themes, which covers [TRI-061](m3-mobile-accessibility.md#tri-061). *This is the one change Classic players see.*
- [x] A unit test checks every palette (Classic and the four Mountain ones): both is the deepest shade; every pair of shades is apart by lightness (1.1:1) or hue (OKLab distance 0.04); givens, lines, entries and notes at least 4.5:1 on all four shades; and the selection dashes at least 3:1 on all four (TRI-103). *`tests/palettes.test.ts`, 42 checks.*
- [x] [TRI-031](m1-first-impression.md#tri-031)'s rule ("same colours on every difficulty") is recorded as still true on Classic and as "same layout of shades on every run" on Mountain.
- [x] The rules modal, the rule diagrams and `/how-to-play` draw with the current palette. Instead of naming colours ("blue", "yellow", "green"), the copy shows a small swatch of each shade, so it's right on both themes.

**Known, not fixed here.** The outer sides on Medium and Hard are close to the sky's blue-grey, so the board's edge is soft against the scenery. TRI-104's shadow helps a little. Stronger outer colours were tried on the canvas; Josh chose to leave them as they are (19 Nov). Revisit if players mention it.

**Check it in a preview.** Open the preview with `?theme=mountain` and play a few moves on each run, in light and dark mode. Outer, inner and both cells are easy to tell apart, and every digit is clear. Open How to play from the game: the swatches match the board. Then open it with `?theme=classic`: the board looks as it does today, apart from navy digits for your entries.

<a id="tri-103"></a>
## TRI-103 · Selected cell: the dashed border, and no neighbour outline

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | M | S | Familiarity | none | Owner decision 19 Nov |

**Problem.** Josh wants his original selection back: a grey dashed border that marches round the cell. It was replaced on 11 Nov by a solid ink outline (TRI-091, for TRI-066). He also wants the outline round the touching cells removed: "players are smart". This undoes part of [TRI-032](m1-first-impression.md#tri-032).

**Done when**
- [x] The selected cell has the original border: width 0.15, dashes 0.4 / 0.2, moving one loop a second (the values before commit `e0f2755`). *The grey is darkened from `rgb(134 134 134)` to `#4d4d4d` at Josh's request (19 Nov), so it's 3.5:1 or better on every cell. Dark mode uses the original dark-mode grey, `rgb(43 43 43)`.*
- [x] With reduced motion on, the dashes stay still ([TRI-066](m3-mobile-accessibility.md#tri-066)).
- [x] Touching cells get no outline and no fill. Today's touching-cells shading is removed. *Closes [R-12](research.md).*
- [x] The rules copy doesn't promise that touching cells are highlighted. *It never did.*

**Contrast.** The original grey was 1.5:1 on the green overlap, under WCAG's 3:1 for UI parts. After seeing it, Josh asked for it darker: `#4d4d4d` is 3.5:1 or better on every cell. TRI-102 must keep it at 3:1 or better on the Mountain shades.

**Check it in a preview.** Tap a few cells, including one in the deepest shade. The dashed border marches round the selected cell, and nothing else on the board changes.

<a id="tri-104"></a>
## TRI-104 · The mountain falls into shadow while you play

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | M | S | Focus, completion rate | [TRI-101](#tri-101) | Designer review 18 Nov |

**Problem.** The scenery is part of the welcome, but you shouldn't be looking at it while you solve. The review suggested the mountain dims once you start playing.

**Done when**
- [x] On arrival, the full scene shows.
- [x] On your first tap on the board, or after 4 seconds without input, the sky, hills and pines fade over 600 ms to the shadow colours. Day: sky `#dce6f0`, hills `#d3dde8` and `#c8d4e1`, pines `#c4d0de`, page `#e6edf4`. Night: sky and page `#0c1625`, hills `#142238` and `#192a42`, and the stars go out. *The scenery dims; the page colour around it stays as it is, so the number pad and its surroundings don't change. Switching runs or a new day starts in sunshine again.*
- [x] The board, signs and keys keep their colours. Nothing moves or resizes.
- [x] The sun comes back when you finish.
- [x] With reduced motion on, the change is instant. *Checked: 8 animation frames with motion on, 1 step with reduced motion.*
- [x] Every label stays at 4.5:1 or better in shadow (grey text is 6.0:1). *Labels sit on the signs, pills and keys, which don't change.*

**Check it in a preview.** Open a run and wait 4 seconds: the hills and trees go quiet and the board stays bright. Reload and tap a cell straight away: the same happens at once.

<a id="tri-105"></a>
## TRI-105 · Run complete: the lift ticket and your finished board

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | H | M | Shares, return visits | [TRI-101](#tri-101), [TRI-094](#tri-094) | Owner decision 19 Nov |

**Problem.** The win card becomes a lift ticket, and after you close it the solved board should stay on screen to look at.

**Done when**
- [ ] The win dialog is a lift ticket:
  - a band in the run's colour reading "Day ticket", the date and the puzzle number;
  - the run's shape, the difficulty and "Green · Run complete";
  - your time, large, with a line if it's your fastest;
  - this week's streak as hole punches;
  - Share ticket, Next run and "Lifts reopen in …".
- [ ] Closing the ticket leaves the solved board on screen, read only. The number pad is replaced by a card with your time, Share ticket and Next run.
- [ ] The dialog traps focus and returns it when closed (TRI-094).
- [ ] Today's win stats (streak, best streak, solved) are all still available, on the ticket or in the season pass.

**Check it in a preview.** Finish a run. The ticket appears; close it. The board stays with your digits on it and can't be edited, and the card below offers Share and Next run.

<a id="tri-106"></a>
## TRI-106 · Share it like a lift ticket

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | M | S | Shares | [TRI-105](#tri-105) | Owner idea 15 Nov |

**Problem.** The share text and link preview should carry the mountain.

**Done when**
- [ ] The link preview (1200×630) is a lift ticket with the day's three run times and the solved board.
- [ ] The share text uses the run shapes as plain text characters, for example `● 3:12  ■ 6:40  ◆ 8:41`. A run you skipped doesn't appear.
- [ ] The share text changes only after Josh tests it on iMessage, Notes, WhatsApp and Discord. The indent stays as it is unless he tests that too.
- [ ] `result_shared` still fires through `trackEvent`.

**Check it in a preview.** Finish a run, tap Share, and paste into Notes and one chat app. Paste the preview link into a chat and check the ticket image.

<a id="tri-107"></a>
## TRI-107 · Ride up and ski down

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Low | M | M | Delight, return visits | [TRI-101](#tri-101), [TRI-104](#tri-104), [TRI-105](#tri-105) | Owner idea 19 Nov |

**Problem.** Josh wants a small story for each day's run. The "A day on the mountain" row on the [canvas](https://claude.ai/artifact/Qm7p2A7CNaFZ9F4bMhzkAL) is a **storyboard, not a spec**: improve the drawing, timing and motion while building it.

**Done when**
- [ ] **Opening a run:** fresh snow covers the board and a chair lift runs up the mountain. A skier rides the chair to the peak (about 2 seconds) and steps off. The snow fades to show today's board, then the scenery falls into shadow (TRI-104).
- [ ] **Finishing:** fresh snow settles over the solved board, and the skier zigzags down the face, leaving tracks and throwing up powder. Then the lift ticket appears (TRI-105). Closing it clears the snow from the finished board.
- [ ] The ride up plays the first time you open a run each day. Coming back to a run you've started goes straight to the board.
- [ ] A tap anywhere skips to the end of an animation.
- [ ] The clock only counts the puzzle: it starts when the board is shown and stops on the last correct digit.
- [ ] With reduced motion on, there's no ride and no zigzag: the snow simply fades out or in.
- [ ] Snow, lift and skier are drawn over the board, and the board never moves.
- [ ] It runs smoothly on a mid-range phone (checked with 4× CPU slowdown in DevTools).
- [ ] `intro_skipped` and `outro_skipped` events through `trackEvent`, listed in `docs/metrics.md`, so we know whether people skip it.
- [ ] Josh signs off a rough prototype in the preview before it's polished.

**Check it in a preview.** Open a run you haven't played today: watch the ride up, then play. Finish it and watch the run down. Reload and open the same run: the ride doesn't play again. Turn on reduced motion and try once more.

<a id="tri-108"></a>
## TRI-108 · Season pass

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Low | M | M | Return visits | [TRI-101](#tri-101) | Owner idea 15 Nov |

**Problem.** The statistics screen should feel like part of the mountain.

**Done when**
- [ ] Statistics is a season pass: runs finished and best time for each shape, day streak and longest streak, and this week as a grid of shapes.
- [ ] It uses only data we already store. No new tracking.
- [ ] **[Decision]** Pins to collect (First tracks, Off piste, Triple run, Double black). Josh decides whether they're worth building.

**Check it in a preview.** Open Statistics after finishing a run: your counts, best times and this week's runs match what you've played.

<a id="tri-100"></a>
## TRI-100 · Theme days

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Low | M | S | Return visits, shares | [TRI-102](#tri-102), [TRI-107](#tri-107) | Owner idea, 11 Nov; designer review 18 Nov |

**Problem.** Palettes make it cheap to dress the game for a date. Josh wants theme days, starting with the Halloween and Christmas drafts on the [canvas](https://claude.ai/artifact/Np9VNxf9yQnakVWoxkCAzK).

**Done when**
**Mountain (19 Nov).** Theme days now dress the mountain. The review's Christmas ideas: lights on the pines, Santa flying past, and a star placed on the peak when you finish. The board is a triangle, so it really is a tree. Keep extras to the start and finish, never while you're solving (TRI-104). The review also noted that a full Christmas is very specific, so give Christmas Day the full version and the rest of December a general winter look.

- [ ] A theme day is a dated entry: board palette, run colours, scenery extras and a header line ("Halloween · No. 304"). It's chosen with `lib/dates.ts` for the puzzle's date.
- [ ] Claude proposes a theme calendar at the start of this item. Josh picks the days.
- [ ] Halloween and Christmas ship first. Their entry inks are darkened to pass the palette check (the drafts are 3.9:1 and 4.3:1).
- [ ] Every theme passes the TRI-102 palette test.
- [ ] Each theme day is checked in light and dark at 390 px, with screenshots in the PR.
- [ ] A `theme_day` property on `puzzle_started` and `result_shared`, through `trackEvent`, and listed in `docs/metrics.md`.
- [ ] The puzzle, timer and share text are unchanged.

**Check it in a preview.** Set the date to 31 October with the dev tools: the board, mountain and header switch to Halloween. Set it to 25 December for Christmas, then back to today.

<a id="tri-094"></a>
## TRI-094 · Dialogs and menus on the system

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | M | M | Share rate, consistency | [TRI-089](#tri-089) | UI-10, UI-31, UI-32, UI-33, UI-37 |

**Problem.** Dialog titles come in three sizes and the close button is small. Reset confirms with a teal button. Focus isn't returned after closing. The win modal shows a focus ring on open on touch. The Ko-fi dialog is offset, and the rules step dots are hidden from screen readers but focusable.

**Done when**
- [x] Win, Statistics, Rules, Reset and Ko-fi follow the design system §3.7: one title scale, 44 px close, focus to the title on open, and focus returned to the trigger on close. *All in the shared `DialogContent`: `surface-raised`, `rounded-dialog`, `shadow-dialog`, scrolls inside when tall. Titles are `text-heading` ("Solved!" is `display-sm`, AlertDialog titles `text-title`). Focus returns to whatever had it, since none of these use `DialogTrigger`; Reset returns to the ⋯ button because its menu item is gone.*
- [x] Reset is an AlertDialog with a destructive "Reset puzzle" button. *"Reset this puzzle?" / "Everything you've entered on this puzzle will be cleared." / Cancel, Reset puzzle (`danger-solid`).*
- [x] The win modal uses StatTiles, one primary action and a segmented rating. *Streak, Best streak, Solved tiles; Share is the only filled button.*
- [x] Statistics uses a 2×2 tile grid on phones with tabular numbers. *One row of four from 640 px.*
- [x] The Ko-fi dialog is centred. *16 px each side on a 390 px phone, with a 44 px close inside the frame.*
- [x] The rules step dots are either decorative and unfocusable or a labelled tablist. The credit shows on both tabs. *Decorative: hidden from screen readers and out of the tab order; a tap still jumps.*

**Check it in a preview.** Win a puzzle and share. Open Statistics, How to play and ⋯ → Reset puzzle. Each closes with the ✕, Escape or a tap outside, and looks like the same family.

<a id="tri-095"></a>
## TRI-095 · System and secondary pages

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | M | S | Trust, SEO | [TRI-089](#tri-089) | UI-13, UI-27, UI-28, UI-29, UI-42 |

**Problem.** Missing pages show Next's black default 404 with no way back. The loading state has no header, and with JavaScript off it spins forever. `/bts` has its own colours and no title of its own. The OG image renders in a different font and colours.

**Done when**
- [ ] `app/not-found.tsx` and `app/error.tsx` are branded, with the header and "Back to today's puzzle".
- [ ] The loading state renders the header, and a `<noscript>` line explains that the game needs JavaScript.
- [ ] `/how-to-play` and `/bts` use tokens and Button. `/bts` gets its own title and description.
- [ ] A `theme-color` meta tag for light and dark.
- [ ] The OG image loads Geist and uses the board tokens. Before/after images are in the PR, and Josh approves them.

**Check it in a preview.** Open `/nope` on your phone, then `/how-to-play` and `/bts`, in both themes. Paste a preview link into iMessage and compare the card with production.

<a id="tri-098"></a>
## TRI-098 · Content pass

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | M | S | Rule comprehension | none | UI-16, UI-25, UI-07 |

**Problem.** Copy mixes title case and sentence case, and uses several names for one thing (Check / error checking, pencil marks / notes, Games Won / Solved). The rules modal numbers three rule cards while the welcome screen and `/how-to-play` say four rules. Phones get keyboard tips.

**Done when**
- [ ] All UI copy follows the design system §4: sentence case, the glossary, "…", and no em dashes.
- [ ] The rule count is consistent everywhere. Either the cards are unnumbered, or card 2 is split. *Josh to choose.*
- [ ] Keyboard shortcuts appear only on devices with a fine pointer and hover. Touch copy says "tap".
- [ ] The tips' wording matches today's layout ("Check, beside the board").

**Check it in a preview.** On your phone, open How to play (Rules and Tips) and switch to Pencil. No mention of keys. On a laptop, the Pencil tip lists the shortcuts.

<a id="tri-096"></a>
## TRI-096 · Desktop, tablet and landscape layouts

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | M | M | Desktop completion | [TRI-093](#tri-093) | UI-08, UI-09 |

**Problem.** At 1440×900 the board is capped at 448 px with the pad underneath, so the game looks like a phone layout in a big window. Landscape phones open scrolled down, with the board cut off.

**Done when**
- [ ] On screens 1024 px or wider and at least 700 px tall, the board folder grows to about 36rem. The layout (two columns or centred) is prototyped with the folders and Josh picks.
- [ ] Landscape phones (height ≤ 500 px) show the board and pad side by side without scrolling.
- [ ] Tablet portrait uses the larger board.
- [ ] The phone layouts are unchanged (play-through pad-fit checks pass).

**Check it in a preview.** Open the preview on a laptop and on a phone held sideways.

<a id="tri-097"></a>
## TRI-097 · Drift guard in CI

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | M | S | Consistency over time | [TRI-093](#tri-093), [TRI-094](#tri-094), [TRI-095](#tri-095) | UI-06 |

**Problem.** Without a check, hard-coded colours and one-off buttons will creep back.

**Done when**
- [ ] `pnpm lint:design` implements the four rules in the design system §5 and runs in CI.
- [ ] It passes on `main`. Any allowlisted exceptions are commented in the script.
- [ ] The design system's definition of done is linked from the PR template, if one exists, or from `docs/backlog/README.md`.

**Check it in a preview.** No visible change. CI shows the new check.

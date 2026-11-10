# M5 · Design system

**Goal.** One look and one way of building every screen. Tokens instead of hard-coded colours, one component per pattern, AA contrast and 44 px targets everywhere, and copy that uses the same names throughout. Built from the [UI audit](../reviews/2026-11-09-ui-audit.md) (9 Nov) and specified in the [design system](../design-system.md). See the [design canvas](https://claude.ai/artifact/KCC9s4riFkSrmGv9bWic9M) for the visual comparison.

**Starts only after Josh picks a direction on the canvas.** The open choices are listed in the design system as **[Decision]**.

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
## TRI-090 · Notices never push the number pad off screen

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| High | H | S | Notes usage, mobile completion | none | UI audit UI-01 |

**Problem.** On an iPhone 13 (390×664), the pencil tip, the power-cells tip and the fallback notice each push the pad's bottom row (6–9 and Clear) off screen. The pad's bottom moves from 618 px to 708 px. This undoes TRI-058 the first time a player tries Pencil.

**Done when**
- [ ] Every game-view notice renders in one slot between the difficulty tabs and the board, one at a time (load error > fallback > tip).
- [ ] The board's size formula subtracts the slot's height (`--slot-h`), so the pad's bottom stays within 640 px at 360×640 and within 664 px at 390×664 with any notice showing.
- [ ] `play-through.cjs` checks the pad fits with the pencil tip showing.
- [ ] The pencil tip's dismiss button no longer overlaps its text.

Can ship before the rest of M5; it uses today's styling if TRI-089 isn't done yet.

**Check it in a preview.** On a phone, start a puzzle and tap Pencil: the tip appears above the board and you can still see and tap 6, 7, 8, 9 and Clear.

<a id="tri-088"></a>
## TRI-088 · Design tokens in globals.css

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | M | S | Consistency | none | UI-06, UI-12, UI-23, UI-24, UI-26 |

**Problem.** Colours, sizes, radii, shadows, layers and durations are written inline across components. There are 60 hex values, 21 Tailwind palette colours, 11 font sizes and 9 radii. `globals.css` also carries unused tokens.

**Done when**
- [ ] `app/globals.css` defines the design system's §2 tokens: UI colour roles, board tokens, type scale, radii, elevation, z-index, durations and easing, each with light and dark values and Tailwind names under `@theme inline`.
- [ ] Today's values map onto them, so **nothing looks different**: screenshots before and after match at 390 and 1440, light and dark.
- [ ] The unused `--cell-*`, `--region-*`, `--chart-*` and `--sidebar-*` tokens are removed.
- [ ] `docs/design-system.md` status line says which tokens are live.

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
- [ ] Accent `#007671` in light mode (white text 5.47:1). Dark accent unchanged. *Per Josh's accent choice.*
- [ ] The selection is a solid ink outline (5.6:1 or better on every fill) and doesn't animate. Completes [TRI-066](m3-mobile-accessibility.md#tri-066).
- [ ] Region lines are `#2b2420` in both themes (6.3:1 or better). Completes [TRI-068](m3-mobile-accessibility.md#tri-068).
- [ ] Muted text is never drawn with opacity. Stats labels use text colours.
- [ ] Hover is a neutral overlay on pointer devices only. The green `accent` is retired.
- [ ] The digit highlight follows Josh's choice (teal tint recommended).
- [ ] `docs/reviews/2026-11-09-ui-audit/contrast.txt` is re-run, and every UI pair passes.

**Check it in a preview.** On your phone in light mode, select a green cell: the outline is clearly visible. Turn Check on: the white text on the teal pill is crisp. Switch to dark mode: the board's region lines are as bold as in light mode.

<a id="tri-089"></a>
## TRI-089 · Core components

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | H | M | Consistency | [TRI-088](#tri-088) | UI-03, UI-07, UI-15, UI-36 |

**Problem.** There are seven button styles, three tab styles and four copies of notice markup, and focus styles differ.

**Done when**
- [ ] `components/ui/` has the design system's Button (variants, sizes, `shape="pill"`), IconButton, SegmentedControl (group and tablist), Notice (four tones, with action and dismiss), Badge and StatTile.
- [ ] Each has hover (pointer only), pressed, focus-visible and disabled states, 44 px hit areas, and unit tests for its ARIA attributes.
- [ ] One focus style: a 2 px accent outline with a 2 px offset.
- [ ] Nothing in the app uses them yet, or only where the look doesn't change, so this PR is safe to merge on its own.

**Check it in a preview.** No visible change. Review the screenshots of each component in light and dark in the PR.

<a id="tri-093"></a>
## TRI-093 · Game screen on the system

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | H | M | Completion rate, consistency | [TRI-089](#tri-089), [TRI-090](#tri-090), [TRI-091](#tri-091) | UI-03, UI-08, UI-11, UI-14, UI-18, UI-19, UI-20, UI-21, UI-30, UI-38, UI-41 |

**Problem.** The header, corner controls, Pen/Pencil, number pad, notices and view-mode banner each have their own styling. Sixteen controls are under 44 px. The game opens scrolled down on 320 px phones.

**Done when**
- [ ] Header icons, corner pills, Pen/Pencil, pad keys and notices use the TRI-089 components, with 44 px hit areas.
- [ ] Undo's note uses the `inverse` pill, so it no longer looks like Check on.
- [ ] The pad looks tappable before a cell is selected; tapping a key then says "Pick a cell first".
- [ ] The view-mode banner is a `success` Notice.
- [ ] The ⋯ menu is a Radix DropdownMenu with keyboard navigation, and Reset is in danger text.
- [ ] Starting a game scrolls to the top.
- [ ] The TRI-087 corner layout, the TRI-058 fit, and the Undo label hiding under 350 px all stay as they are. The play-through pad-fit check passes at 360×640 and 390×664.
- [ ] No hex values or palette colours remain in `tridoku-game.tsx`, `tridoku-board.tsx`, `game-controls.tsx`, `input-mode-toggle.tsx` or `number-pad.tsx`.

**Check it in a preview.** Play a few moves on your phone. Try Undo, Check, ⋯ → Reset puzzle → Cancel, Pencil with its tip, and pause. Then finish and look at the solved view. Repeat in dark mode.

<a id="tri-092"></a>
## TRI-092 · One difficulty identity

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| High | M | S | Rule comprehension | [TRI-089](#tri-089), Josh's decision | UI-02, UI-15, UI-39 |

**Problem.** Difficulty colour means three different things:
- the tabs and cards use blue, amber and pink, where Easy's blue is the board's outer-edge blue;
- the stats modal uses green, yellow and red;
- the share text uses 🟢🟡🔴.

The difficulty tabs also have no selected state for screen readers.

**Done when**
- [ ] Difficulty shows the way Josh chose on the canvas (recommended: pips on neutral controls) everywhere in the app: tabs, welcome cards, the returning list, stats and win modal.
- [ ] No rule-fill colour is used outside the board and the rule diagrams.
- [ ] The difficulty tabs are a tablist with `aria-selected`. Done and in-progress use the Badge.
- [ ] The share text is unchanged, unless Josh tests a change on iMessage, Notes, WhatsApp and Discord.

**Check it in a preview.** Look at the welcome screen, the tabs above the board and Statistics. Each difficulty looks the same in all three, and none of them matches a board colour.

<a id="tri-094"></a>
## TRI-094 · Dialogs and menus on the system

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | M | M | Share rate, consistency | [TRI-089](#tri-089) | UI-10, UI-31, UI-32, UI-33, UI-37 |

**Problem.** Dialog titles come in three sizes and the close button is small. Reset confirms with a teal button. Focus isn't returned after closing. The win modal shows a focus ring on open on touch. The Ko-fi dialog is offset, and the rules step dots are hidden from screen readers but focusable.

**Done when**
- [ ] Win, Statistics, Rules, Reset and Ko-fi follow the design system §3.7: one title scale, 44 px close, focus to the title on open, and focus returned to the trigger on close.
- [ ] Reset is an AlertDialog with a destructive "Reset puzzle" button.
- [ ] The win modal uses StatTiles, one primary action and a segmented rating.
- [ ] Statistics uses a 2×2 tile grid on phones with tabular numbers.
- [ ] The Ko-fi dialog is centred.
- [ ] The rules step dots are either decorative and unfocusable or a labelled tablist. The credit shows on both tabs.

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
- [ ] On screens 1024 px or wider and at least 700 px tall, the board grows to about 36rem, using the layout Josh picks from the canvas (two columns or centred).
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

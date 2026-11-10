# Daily Tridoku design system

**Status: proposal (10 Nov 2026).** Nothing here is in the app yet. It comes from the [UI audit](reviews/2026-11-09-ui-audit.md). The visual prototype is the [design canvas](https://claude.ai/artifact/KCC9s4riFkSrmGv9bWic9M). The rollout is milestone [M5](backlog/m5-design-system.md).

The aim is one look and one way of building every screen. We keep what already works: the warm paper palette, the board's rule colours, Geist and the teal accent. The work is to unify them, not replace them.

Choices still open are marked **[Decision]**. Each one has a Tweak on the canvas.

---

## 1. Principles

1. **The board is the hero.** Chrome is quiet, neutral and warm. Colour on screen should mean something about the puzzle.
2. **A colour has one meaning.** The rule fills mean the rules and nothing else. Teal means "act" or "on". Red means "wrong" or "destructive".
3. **One component per pattern.** No more hand-rolled buttons in feature code.
4. **Phone first, but desktop is designed.** A 360×640 phone fits the game with no scrolling, and 1440 px doesn't look like a phone layout floating in space.
5. **Accessible by default.** Pairs meet AA, targets are 44 px, focus is visible, and motion respects the system setting.

---

## 2. Foundations

All tokens live in `app/globals.css`. Raw values go under `:root` and `.dark`. Tailwind names go in `@theme inline`, so classes read `bg-surface-raised`, `text-muted`, `rounded-card` and so on. Feature code never uses hex values, `rgb()`, `oklch()` or Tailwind palette colours (`green-600`) directly. See §6.

### 2.1 Colour: UI roles

| Token | Light | Dark | Use | Replaces |
|---|---|---|---|---|
| `--bg` | `oklch(0.97 0.01 70)` #faf4ee | `oklch(0.2 0.02 60)` #1d140d | Page | `--background` (unchanged) |
| `--surface-raised` | #fffaf6 | #271d16 | Dialogs, menus, cards, active segment | `--card`, `--popover`, `bg-background` inside dialogs |
| `--surface-sunken` | #f3e9df | #2a2019 | Segmented-control track, stat tiles, paused panel | `--muted`, `bg-muted/40`, `bg-muted/50`, `bg-muted/60`, `bg-secondary/50` |
| `--control` | #efe2d8 | #362c24 | Pills, number keys, secondary buttons | `--secondary` |
| `--text` | #3b2921 | #ece3da | Body, headings | `--foreground` |
| `--text-muted` | #725f54 (5.6:1) | #a39486 (6.0:1) | Secondary text. **Never add opacity to it.** | `--muted-foreground`, `text-muted-foreground/60` |
| `--border` | #e2d6cb | #3a3029 | Dividers, card edges | `--border` |
| `--border-strong` | #cdbcae | #54483e | Control outlines | `--input`, `border-border` on controls |
| `--accent` | `oklch(0.50 0.11 190)` #007671 | `oklch(0.68 0.13 200)` #00afb8 **[Decision]** | Primary buttons, "on" states, links, focus | `--primary` (light value one step darker) |
| `--on-accent` | #ffffff (5.5:1) | #180f09 (7.0:1) | Text and icons on accent | `--primary-foreground` |
| `--accent-tint` | accent at 16 % | accent at 20 % | Logo fill, info notices | `fill-primary/20`, `bg-primary/10` |
| `--hover` | text at 6 % | text at 7 % | Hover overlay, pointer devices only | the green `hover:bg-accent` |
| `--press` | text at 12 % | text at 14 % | Pressed overlay | — |
| `--success` | #2f7a4b | #7cc79a | Completed badges and lines | `green-600`, `bg-green-600` |
| `--warning` | #9a6200 | #e3b25c | Fallback notice, best-time trophy | `amber-500/600`, `yellow-600` |
| `--danger` | #b42318 | #f08a7e | Error text, Reset, destructive buttons (solid #b42318 with white text: 6.8:1) | `--destructive`, `red-600`, `text-white` |
| `--focus` | = accent | = accent | 2 px outline with a 2 px offset | `ring-ring/50` 3 px, `ring-2 ring-ring` and `outline-ring/50` (three styles today) |
| `--overlay` | rgba(29,20,13,0.45) | rgba(0,0,0,0.6) | Dialog backdrop | `bg-black/50` |

Each status colour also gets a `-tint` (8–10 %) and a `-border` (30–35 %) for notices.

**Retire:** `--accent` (green) as a UI colour, `--chart-*`, `--sidebar-*`, `--cell-*` and `--region-*` (all unused), and the Tailwind `accent` hover in `components/ui/button.tsx`.

**[Decision] Accent.** The options are:
- *deeper teal* (recommended), which passes AA with white;
- *today's teal* #008781, which fails AA at 4.28:1 for 14–16 px text;
- *ink*, which uses the text colour for buttons and keeps teal for numbers and links.

### 2.2 Colour: board

The board stays paper-coloured in both themes, as today. Only its lines and marks change.

| Token | Value | Meaning | Today |
|---|---|---|---|
| `--board-cell-outer` | #bfdde2 | On an outer side (blue) | same, `--tridoku-cell-outer` |
| `--board-cell-inner` | #eed496 | On the inner triangle (yellow) | same |
| `--board-cell-overlap` | #98ac8b | Both (green) | same |
| `--board-cell-none` | #e4e3d3 | Neither | same |
| `--board-region-line` | #2b2420, both themes | Bold region borders: 6.3–11.8:1 against the fills | #000 light, #7e7e7e dark (1.7–3.1:1, TRI-068) |
| `--board-cell-line` | rgba(43,36,32,0.32) | Hairlines | `"#000"` at 0.01 width |
| `--board-digit-given` | #2b2420, weight 700 | Givens | `#000` bold |
| `--board-digit-entry` | #1e3a5f, weight 500 **[Decision]** | Player entries: 4.7:1 even on green | `#000` regular (TRI-061) |
| `--board-digit-note` | #4a3a30 | Pencil marks | `#222` |
| `--board-selection` | #2b2420 solid stroke, 0.17 units | Selected cell: 5.6:1 on green | grey 134 dashed and animated (1.5–2.8:1) |
| `--board-touching` | rgba(40,30,20,0.12) | Cells touching the selection | same |
| `--board-error-tint` | rgba(220,38,38,0.22) | Conflicting cell | rgba(239,68,68,0.3) |
| `--board-error-digit` | #991b1b, plus a short underline | Conflicting digit: 4.5:1 on three fills; the underline covers the fourth (TRI-065) | `#DC2626` (1.6–2.6:1) |
| `--board-highlight` | accent at 30 % **[Decision]** | Same digit as the double-tapped cell: 4.9:1 or better | opaque #3b82f6 |
| `--board-flash` | accent at 45 %, fading over 900 ms | Undo flash | `fill-primary` |

> **The rule fills are semantic and need Josh's sign-off to change.** This proposal doesn't change them. **[Decision] "Dimmed" board in dark mode** multiplies them by 0.82 (#9db5b9, #c3ae7b, #7d8d72, #bbbaad) so the board glows less at night. Digits still reach 5.7:1. Default: keep paper.

**Teal can't be the entry colour.** TRI-061 asks for teal entries with at least 4.5:1 on every fill, but no teal light enough to read as teal gets there on the green overlap cell (#0f6f6c is 2.45:1). Navy #1e3a5f is the closest colour that passes. See the audit, §5 (TRI-061).

### 2.3 Difficulty identity

**[Decision]** Today Easy, Medium and Hard each have three different colour codings:
- the tabs and cards use blue, amber and pink, where the blue is the exact outer-rule fill;
- the stats modal uses green-600, yellow-600 and red-600 text;
- the share text and win modal use 🟢🟡🔴.

Proposal: show difficulty with **pips** (●○○, ●●○, ●●●) on neutral controls in the app UI. The colour stays free to mean rules. The share text keeps its emoji: Josh tuned it on real devices, so it changes only after testing it with him.

Alternative: keep coloured tabs and cards, but use hues that aren't on the board. The canvas "colour" Tweak shows today's version for comparison.

### 2.4 Typography

Geist for everything, including the timer **[Decision: Geist Mono for the timer is the alternative]**. Every number uses `tabular-nums`: timer, stats, countdown, puzzle number and pad.

| Token | Size / line height | Weight | Use |
|---|---|---|---|
| `text-caption` | 12/16 | 400 | Credits, footnotes |
| `text-label-sm` | 13/18 | 400–500 | Puzzle number, stat labels |
| `text-label` | 14/20 | 400–600 | Notices, small buttons, captions |
| `text-body` | 16/24 | 400 | Rules copy, buttons |
| `text-title-sm` | 18/24 | 700 | Header wordmark (replaces `text-[17px]`) |
| `text-title` | 20/28 | 700 | Alert dialog titles, section heads |
| `text-heading` | 24/32 | 700 | Dialog titles (Statistics, Rules), Paused |
| `text-display-sm` | 30/36 | 700 | "Solved!", welcome hero |
| `text-display` | 44/48 | 700 | Win time |
| (pad) | 22 | 600 | Number keys |

This takes 11 sizes in use (including `text-[15px]` and `text-[17px]`) down to 9 named steps. Weights: 400, 500, 600 and 700. Use `text-balance` for headings and `text-pretty` for paragraphs.

### 2.5 Spacing, size and layout

- **Spacing:** a 4 px base using 4, 8, 12, 16, 20, 24, 32 and 40 (Tailwind 1, 2, 3, 4, 5, 6, 8, 10). Drop 1.5, 2.5 and 0.5 except inside icons.
- **Control heights:**
  - `sm` 36, only with a 44 px hit area;
  - `md` 44, the default;
  - `lg` 52, the hero action;
  - pad keys 56 on phones and 64 on desktop.
  - Board-corner pills are 40 with 44 px hit areas.
- **Hit areas:** every interactive element is at least 44×44 px. A smaller visual gets an invisible `::before` extension. Today 16 controls are under 44 px (audit UI-14).
- **Page gutter:** 16 px on phones. Content max-width is 42rem for the game column and 64rem for desktop two-column.
- **Breakpoints:**
  - phone under 640;
  - tablet 640–1023;
  - desktop 1024 and up;
  - plus `(orientation: landscape) and (max-height: 500px)` for landscape phones.
  - Container queries (`@container`) stay for the board corners (`@max-[350px]`).
- **Fit rule (TRI-058).** The board width is `min(28rem, max(15rem, calc((100dvh − 330px − var(--slot-h, 0px)) × 1.15)))`. `--slot-h` is the height of the message slot (§3.6). That keeps the pad on screen when a tip shows.

### 2.6 Radius, borders, elevation, layers

| Token | Value | Use |
|---|---|---|
| `rounded-sm` | 6 | Badges, focus rings inside controls |
| `rounded-control` | 10 **[Decision: 14 on "round"]** | Buttons, segmented controls, menu items |
| `rounded-card` | 14 (20) | Notices, cards, pad keys, stat tiles, paused panel |
| `rounded-dialog` | 20 (28) | Dialogs and sheets |
| `rounded-full` | 9999 | Pills, icon buttons, pips |

- **Borders:** 1 px. 2 px only for focus and the selected difficulty card.
- **Elevation:** 0 is flat. 1 is the segmented thumb: `0 1px 2px` at 14 %. 2 is a menu or popover: `0 12px 28px -8px` at 30 %. 3 is a dialog: `0 24px 48px -12px` at 35 %. That replaces six ad-hoc shadows.
- **z-index:** `--z-corner` 10, `--z-sticky` 20, `--z-popover` 30, `--z-overlay` 40, `--z-dialog` 50 and `--z-toast` 60.

### 2.7 Motion

- **Durations:** `--dur-fast` 120 ms for press and hover, `--dur-base` 200 ms for dialogs and menus, and `--dur-slow` 320 ms. The undo flash stays at 900 ms.
- **Easing:** `--ease-out` is `cubic-bezier(0.2, 0.8, 0.2, 1)`.
- Use specific transition properties instead of `transition-all`.
- **Under `prefers-reduced-motion: reduce`:**
  - no scale (pad keys, Ko-fi close);
  - no rotation (theme icon);
  - no dash animation (TRI-066);
  - dialogs fade only.
- Hover styles are gated on `@media (hover: hover)` so they don't stick after a tap.

### 2.8 Icons

- lucide-react only.
- Sizes: 16 (inside labels and pills), 20 (icon buttons, default) and 24 (Clear key).
- Stroke 2 everywhere. Drop 2.25 and 2.5.
- Decorative icons get `aria-hidden`. Icon-only buttons get `aria-label`.
- No emoji in UI chrome ("☕", 🟢). Emoji stay in the share text.
- The Ko-fi PNG is the one allowed raster (it's their mark).

---

## 3. Components

Each component lives in `components/ui/` and is the only way to draw its pattern.

### 3.1 Button

- **Anatomy:** optional leading icon, label, optional trailing icon.
- **Variants:**
  - `primary`: accent fill with on-accent text;
  - `secondary`: control fill with strong border;
  - `ghost`: transparent;
  - `destructive`: solid danger with white text;
  - `link`: accent text, underlined.
- **Sizes:** `sm` 36, `md` 44 and `lg` 52. Radius `rounded-control`; `shape="pill"` gives `rounded-full`.
- **States:**
  - hover adds the `--hover` overlay, on pointer devices only;
  - pressed adds `--press` and scales to 0.98 (no scale with reduced motion);
  - focus-visible shows the focus ring;
  - disabled is 45 % opacity with no pointer events;
  - loading shows a spinner in place of the leading icon and keeps the label.
- **Do:** one primary per view. **Don't:** use primary for destructive confirmations (today "Reset Puzzle" is teal).
- **Replaces:**
  - shadcn `Button` variants with green hover;
  - the hand-rolled Resume button in `tridoku-board.tsx`;
  - the `PlayButton` link in `app/how-to-play/page.tsx`;
  - the Ko-fi and Feedback footer buttons;
  - the welcome "How to play" ghost buttons.

### 3.2 IconButton

- 44×44 with a 20 px icon.
- Variants: `ghost` (header) and `secondary` (copy result).
- `aria-label` is required by the component's types.
- Replaces `size="icon"` (36 px) in the header, the dialog close button (16 px icon at 70 % opacity) and the notice dismiss buttons (about 18 px).

### 3.3 Pill (Button `shape="pill"`, board corners)

- 40 px tall, `rounded-full`, control fill with strong border, 15/600 label and 16 px icon.
- **Variants:**
  - `default`;
  - `on` (accent, for toggles like Check, with `aria-pressed`);
  - `inverse` (text-colour fill, for transient notes like "Removed 7").
- Today Undo's note and Check's on state are both solid teal, so "on" and "just happened" look the same.
- The timer is a pill with `tabular-nums` and an `aria-label` that includes the time.
- Replaces `PILL` in `game-controls.tsx`.

### 3.4 SegmentedControl

- A track (`surface-sunken`, 4 px padding) holds segments 36 px tall.
- The selected segment is `surface-raised` with elevation 1 and full text colour. Unselected segments use muted text.
- Two roles:
  - `role="group"` with `aria-pressed` for modes (Pen/Pencil, rating);
  - `role="tablist"` with `aria-selected` for views (Rules/Tips, stats Easy/Medium/Hard).
- Disabled: the whole control at 45 %.
- Replaces `InputModeToggle`, the Rules/Tips toggle and `components/ui/tabs.tsx` styling (`h-9`, `p-[3px]`).

### 3.5 Tabs: difficulty

- A SegmentedControl in `tablist` mode across the full width. Each tab shows label + pips + status.
- **Status:**
  - done: a success check badge;
  - in progress: a neutral badge with the time.
- `aria-selected` marks the current tab. Today the tabs have no selected state for screen readers (audit UI-15).
- The label stays "Easy" and so on, and the pips are `aria-hidden`.
- The difficulty colours are gone (see §2.3).

### 3.6 Notice and the message slot

- **Anatomy:** tone icon (16), message (14/20), optional inline action (link or `sm` button), optional dismiss (IconButton, 32 visual with a 44 hit area).
- **Tones:** `info` (tips), `warning` (fallback puzzle), `danger` (load error, with Retry) and `success` (view mode, "You solved this puzzle today", with Share result).
- `role="status"`; `danger` uses `role="alert"`.
- **Message slot.** In the game view, all notices render in one slot between the difficulty tabs and the board. It shows at most one at a time, in this order: danger > warning > tip.
  - The slot's height feeds `--slot-h`, so the board shrinks instead of pushing the pad off screen. Today the pad's bottom row moves to 708 px on a 664 px screen (audit UI-01).
  - Rule: **nothing may be inserted between the board and the pad.**
- **Replaces** four copies of notice markup in `tridoku-game.tsx` and the view-mode banner's own colours.

### 3.7 Dialog and AlertDialog

- **Dialog:**
  - `surface-raised`, `rounded-dialog`, elevation 3, 24 px padding;
  - title `text-heading` (or `display-sm` for "Solved!");
  - a 44 px close IconButton top right.
  - Full width minus 16 px on phones and `max-w-md` on larger screens. Content scrolls inside with the header pinned.
- **Behaviour:**
  - focus moves to the dialog title, not the first button, so no ring shows on open on touch;
  - Escape closes;
  - focus returns to the trigger. Today closing Statistics leaves focus on `<body>` because the dialogs aren't opened through `DialogTrigger` (audit UI-10).
- **AlertDialog:**
  - title `text-title` phrased as a question ("Reset this puzzle?");
  - one line of consequence;
  - actions Cancel (secondary) then the destructive action, named with the verb ("Reset puzzle").
- **Ko-fi:** Dialog `size="embed"`, centred (today it's shifted 1.5 rem left), with the close button inside the frame on phones.

### 3.8 Menu

- `surface-raised`, `rounded-card`, elevation 2, 6 px padding.
- Items are 44 px tall with icon 20, label 15/500 and `--hover` highlight.
- Destructive items use `--danger` text.
- Behaviour: arrow-key navigation, focus first item on open, Escape closes and returns focus. Use Radix `DropdownMenu` instead of the hand-rolled popover in `game-controls.tsx`.

### 3.9 NumberPad key

- 56×56 on phones and 64 on desktop, `rounded-card`, control fill, 22/600 tabular.
- **States:**
  - pressed: `--press` + scale 0.96;
  - `aria-pressed` note on: accent fill, Pencil mode only;
  - no cell selected: muted text, still tappable, shows the hint "Pick a cell first". Today the whole pad is at 50 % opacity on first view (audit UI-19).
- Hover is a pointer-only overlay. Today hover paints the key with the same teal as "note on" (audit UI-21).
- Clear: outline key with a 24 px icon and `aria-label="Clear cell"`. It no longer turns red on hover.

### 3.10 Badge

- 22 px tall, `rounded-full`, 12/600.
- Tones: `success` (done ✓), `neutral` (in progress, with time) and `accent`.
- Replaces `bg-green-600`, `bg-amber-600` and the white-stroked SVG.

### 3.11 Stat tile

- `surface-sunken`, `rounded-card`, 10 px padding.
- Value: `text-heading` tabular 700. Label: `text-label-sm` muted, one line ("Day streak", "Best streak", "Solved", "Win rate").
- Used in the win modal (3 tiles) and Statistics (4 tiles in a 2×2 grid on phones). Today "Current Streak" wraps to two lines.

### 3.12 Board cell states

| State | Visual | Notes |
|---|---|---|
| Given | `digit-given` 700 | |
| Entry | `digit-entry` 500 | TRI-061 |
| Notes | up to 3 at the corners, 0.5 units, `digit-note` | TRI-060 decides more than 3 |
| Selected | solid `selection` stroke + 18 % white wash | static, so reduced motion is honoured (TRI-066) |
| Touching | `touching` overlay | TRI-032 |
| Error (Check on) | `error-tint` + `error-digit` + underline, also on the selected cell | TRI-065 |
| Highlighted | `highlight` overlay | |
| Flash | `flash` fading | TRI-052 |
| Paused | `surface-sunken` panel, same size, "Paused" `text-heading` + Resume `primary` pill | |

Region lines: `board-region-line`, 0.11 units. Board focus (once TRI-062 lands): the focus ring around the whole board, plus the selection on the active cell.

---

## 4. Content guidelines

- **Voice:** friendly and brief, like a puzzle-loving friend. Plain words; say what happens next. No "Oops".
- **Case:** sentence case everywhere: titles, buttons, tabs, stats labels ("Reset puzzle", "Current streak", "Best time", "Completed today"). Proper nouns and "Daily Tridoku" keep capitals.
- **Punctuation:**
  - curly apostrophes in code-rendered copy (`’`), or HTML entities;
  - "…" not "...";
  - no exclamation marks except "Solved!";
  - no em dashes in UI copy.
- **Numbers and time:**
  - `mm:ss` (`04:12`) under an hour and `h:mm:ss` over;
  - countdown `hh:mm:ss`;
  - dates "9 November";
  - percentages "92%";
  - always `tabular-nums`.
- **Platform-aware hints.** Keyboard shortcuts appear only on `(hover: hover) and (pointer: fine)`. Touch copy says "tap". Today the pencil tip tells phone players to press backspace, space or "p" (audit UI-07).

**Glossary.** Use one name per thing:

| Use | Not |
|---|---|
| Check | error checking, show errors, Check: turn on error checking (fine as an `aria-label` only) |
| Pencil marks | notes, candidate notes, pencil notes |
| Pen / Pencil | input mode |
| Reset puzzle | Reset Puzzle, Reset |
| Undo | |
| Highlight a digit | double-tap highlight |
| Region | bold-outlined region, box |
| Outer sides / inner triangle | edges, outer edges |
| Day streak / best streak | Current Streak, Max Streak |
| Solved | Games Won, won |
| Today's puzzle | daily puzzle |
| Back to the game | Back to game |

**Rule count.** The game has **four rules** (regions, outer sides, inner triangle, no touching). The welcome screen and `/how-to-play` say four, but the Rules modal shows three cards ("Rule 2: Edges" merges two). Either retitle the cards "Regions", "Sides" and "No touching" without numbers, or split card 2. Audit UI-16.

---

## 5. Rules for adding UI

### Definition of done for any new UI

- [ ] Uses `components/ui` components. No new button, notice or tab markup in feature files.
- [ ] Uses tokens only: no hex, `rgb()`, `oklch()`, Tailwind palette colours or arbitrary `[...]` values outside the allowlist.
- [ ] Light and dark checked in a real browser at 360×640, 390×664 and 1440×900.
- [ ] Text 4.5:1 and UI parts 3:1. Targets 44 px. Focus visible. Keyboard reachable. `aria-*` correct.
- [ ] Reduced motion honoured. Hover only on pointer devices.
- [ ] Copy follows §4 and the glossary.
- [ ] The number pad still fits at 360×640 with any notice showing (`play-through.cjs` check).

### Drift guard (TRI-097)

`pnpm lint:design` runs in CI next to `pnpm lint`. It's a small Node script over `app/` and `components/`. It fails on:
1. `#[0-9a-f]{3,8}`, `rgb(`, `rgba(`, `hsl(` and `oklch(` outside `app/globals.css`, `app/og/route.tsx` and `components/rule-diagrams.tsx` (until migrated);
2. Tailwind palette colours (`(bg|text|border|fill|stroke|ring)-(red|green|blue|amber|yellow|pink|gray|zinc|…)-\d`);
3. arbitrary values `-[` except an allowlist: `max-w-[calc(...)]`, `data-[...]`, `has-[...]`, `aria-[...]`, `max-[359px]`, `@max-[350px]` and `grid-cols-[...]`;
4. `<button` in `components/*.tsx` outside `components/ui/`, unless the line carries `// design-ok: <reason>`.

Each rule prints the file, the line and the token to use instead. `/bts` is excluded (a standalone essay) but must use tokens for colour.

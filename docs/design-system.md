# Daily Tridoku design system

**Status: direction chosen (11 Nov 2026).** Nothing here is in the app yet. It comes from the [UI audit](reviews/2026-11-09-ui-audit.md). The rollout is milestone [M5](backlog/m5-design-system.md).

- **Chosen direction:** [difficulty folders canvas](https://claude.ai/artifact/Np9VNxf9yQnakVWoxkCAzK). Josh picked it on 11 Nov.
- **Reference only:** the [first design-system canvas](https://claude.ai/artifact/KCC9s4riFkSrmGv9bWic9M), which has the component sheet and foundations, and the [difficulty colour exploration](https://claude.ai/artifact/DRMFTVx9vUYH5UXzmi2odS). Neither is the direction. Their boards don't show digits (a canvas rendering bug), so don't judge legibility from them.

The aim is one look and one way of building every screen. We keep the warm paper page, Geist and Josh's three difficulty colours. Three things change:
- **Difficulty colour** becomes the main identity of a screen: the selected tab is a folder, and the board sits on it.
- **The board** is drawn from a swappable tonal palette, so rules read as shades of one colour family. That also enables theme days.
- **Buttons** are dark ink. Teal is retired.

Decisions Josh made on 11 Nov are marked **[Decided]**. Choices still open are marked **[Decision]**.

**What's live (TRI-088, 11 Nov).** The token *names* below are in `app/globals.css`, set to today's values, so nothing looks different yet:
- UI roles;
- difficulty colours;
- board tokens (`--board-*`, renamed from `--tridoku-*`);
- type scale, radii, elevation, layers and motion.

The values in the tables are the targets. TRI-091 moves the UI roles to them, and TRI-099 replaces the board fills with tonal palettes. The shadcn names (`--background`, `--primary`, …) now point at these tokens.

---

## 1. Principles

1. **The board is the hero.** Chrome is quiet, neutral and warm. Colour on screen should mean something about the puzzle.
2. **A colour has one meaning.**
   - Difficulty colours mean Easy, Medium or Hard.
   - The board's shades mean the rules: lightest is an outer side, middle is the inner triangle, deepest is both.
   - Ink means "act" or "on".
   - Red means "wrong" or "destructive".
   - Nothing changes a cell's shade except the rules, so selection, touching cells and highlights are drawn on top as outlines or ink, never as a darker tint.
3. **One component per pattern.** No more hand-rolled buttons in feature code.
4. **Phone first, but desktop is designed.** A 360×640 phone fits the game with no scrolling, and 1440 px doesn't look like a phone layout floating in space.
5. **Accessible by default.** Pairs meet AA, targets are 44 px, focus is visible, and motion respects the system setting.

---

## 2. Foundations

All tokens live in `app/globals.css`. Raw values go under `:root` and `.dark`. Tailwind names go in `@theme inline`, so classes read `bg-surface-raised`, `text-fg-muted`, `text-label`, `rounded-card`, `shadow-menu` and so on. Layers and durations are plain variables: `z-(--z-dialog)`, `duration-(--dur-base)`. Feature code never uses hex values, `rgb()`, `oklch()` or Tailwind palette colours (`green-600`) directly. See §6.

### 2.1 Colour: UI roles

| Token | Light | Dark | Use | Replaces |
|---|---|---|---|---|
| `--bg` | `oklch(0.97 0.01 70)` #faf4ee | `oklch(0.2 0.02 60)` #1d140d | Page | `--background` (unchanged) |
| `--surface-raised` | #fffaf6 | #271d16 | Dialogs, menus, cards, active segment | `--card`, `--popover`, `bg-background` inside dialogs |
| `--surface-sunken` | #f3e9df | #2a2019 | Segmented-control track, stat tiles, paused panel | `--muted`, `bg-muted/40`, `bg-muted/50`, `bg-muted/60`, `bg-secondary/50` |
| `--control` | #efe2d8 | #362c24 | Pills, number keys, secondary buttons | `--secondary` |
| `--fg` | #3b2921 | #ece3da | Body, headings | `--foreground` |
| `--fg-muted` | #725f54 (5.6:1) | #a39486 (6.0:1) | Secondary text. **Never add opacity to it.** | `--muted-foreground`, `text-muted-foreground/60` |
| `--border` | #e2d6cb | #3a3029 | Dividers, card edges | `--border` |
| `--border-strong` | #cdbcae | #54483e | Control outlines | `--input`, `border-border` on controls |
| `--action` | #2b2420 | #ece3da | Primary buttons, "on" states (Check), Pencil marks set on the pad, logo **[Decided: ink, no teal]** | `--primary` (teal) |
| `--on-action` | #fffaf6 (14.7:1) | #1d140d (14.3:1) | Text and icons on action | `--primary-foreground` |
| `--info-tint` | text at 5 % | text at 8 % | Tip notices | `bg-primary/10`, `bg-muted/60` |
| `--hover` | text at 6 % | text at 7 % | Hover overlay, pointer devices only | the green `hover:bg-accent` |
| `--press` | text at 12 % | text at 14 % | Pressed overlay | — |
| `--success` | #2f7a4b | #7cc79a | Completed badges and lines | `green-600`, `bg-green-600` |
| `--warning` | #9a6200 | #e3b25c | Fallback notice, best-time trophy | `amber-500/600`, `yellow-600` |
| `--danger` | #b42318 | #f08a7e | Error text, Reset, destructive buttons (solid #b42318 with white text: 6.8:1) | `--destructive`, `red-600`, `text-white` |
| `--focus` | = action | = action | 2 px outline with a 2 px offset | `ring-ring/50` 3 px, `ring-2 ring-ring` and `outline-ring/50` (three styles today) |
| `--overlay` | rgba(29,20,13,0.45) | rgba(0,0,0,0.6) | Dialog backdrop | `bg-black/50` |

Each status colour also gets a `-tint` (8–10 %) and a `-border` (30–35 %) for notices.

**Retire:** teal everywhere (`--primary`, `--ring`, the teal logo and icons), `--accent` (green) as a UI colour, `--chart-*`, `--sidebar-*`, `--cell-*` and `--region-*` (all unused), and the Tailwind `accent` hover in `components/ui/button.tsx`.

**Links** are text colour with an underline. The win time and Best time, teal today, are text colour.

### 2.2 Colour: difficulty **[Decided]**

Josh's three colours, unchanged. They're the only bright colours in the chrome, and they mean difficulty and nothing else.

| Token | Value | Text on it | Use |
|---|---|---|---|
| `--difficulty-easy` | #bfdde2 | ink #2b2420, 10.7:1 | Easy folder tab and card, welcome file, stats, win card |
| `--difficulty-medium` | #ecbd6c | ink, 8.8:1 | Medium |
| `--difficulty-hard` | #e26495 | ink, 4.7:1 | Hard |

- The same colours in light and dark mode.
- No emoji, dots or extra marks next to the difficulty in the UI.
- The share text keeps its emoji (🟢🟡🔴 and the 🟩/🟨 grid). Josh tuned it on real devices; it changes only after testing with him.
- The stats modal's green, yellow and red labels go; stats use the difficulty colours as folder tabs too.

### 2.3 Colour: board palettes **[Decided: tonal, always]**

The board is drawn from a **palette**. A palette is a small set of values, so a difficulty or a theme day only has to supply one:

| Palette key | Meaning | Rule it shows |
|---|---|---|
| `none` | Lightest | Neither rule |
| `outer` | Light | On an outer side |
| `inner` | Middle | On the inner triangle |
| `both` | Deepest | On both |
| `line` | Region lines and givens | |
| `entry` | Player digits | |
| `note` | Pencil marks | |

**The shade order never changes:** none < outer < inner < both, from light to deep, on every difficulty and every theme. That order *is* the rule, so the rules modal and `/how-to-play` describe "the lightest, middle and deepest shades" instead of "blue, yellow, green". This replaces TRI-031's "same colours on every difficulty" with "same shade order on every difficulty". Josh signed off on 11 Nov.

**Daily palettes**, one per difficulty, each a family of its folder colour. The board sits a step lighter than its folder, so it reads as paper on a card.

| Difficulty | none | outer | inner | both | Digits (min contrast) |
|---|---|---|---|---|---|
| Easy | #f6fafb | #e2eff1 | #c9e2e6 | #9cc6cd | givens 8.3, entries 6.2, notes 5.9 |
| Medium | #fdf8ee | #f8e8c8 | #f2d49c | #e2b25e | 7.8, 5.9, 5.6 |
| Hard | #fdf4f7 | #f8dde7 | #f1bfd2 | #e293b3 | 6.6, 5.0, 4.7 |

Shared inks on daily boards: `line` and givens #2b2420 (weight 700), entries #1e3a5f (weight 500), notes #4a3a30.

**Marks drawn on top** (the same on every palette; on a dark theme board they flip to the palette's light ink):

| Token | Visual | Notes | Today |
|---|---|---|---|
| `--board-cell-line` | `line` at 26 %, 0.012 units | Hairlines | `#000` |
| `--board-region-line` | `line`, 0.11 units | Bold region borders | #000 light, #7e7e7e dark (TRI-068) |
| `--board-selection` | `line`, solid 0.17 stroke + 25 % paper wash | Static, so reduced motion is honoured | grey dashed, animated |
| `--board-touching` | **one continuous outline** around the selected cell and the 12 cells touching it: `line` 0.075 over a paper halo 0.22 | Never a fill: darkening a cell would make it look like the next rule shade (measured on every palette) | 12 % dark fill |
| `--board-error-tint` | rgba(220,38,38,0.22), plus `#991b1b` digit and an underline | The red hue keeps it apart from the shades. The digit alone is 3.0–3.4:1, so the underline is required (TRI-065) | red tint, #DC2626 |
| `--board-highlight` | **inverse:** ink fill, paper digit (14:1) **[Decision: not yet prototyped]** | A tint would read as a deeper shade | opaque #3b82f6 |
| `--board-flash` | `line` at 35 %, fading over 900 ms | Undo flash; brief enough not to be read as a shade | teal |

**Dark mode.** The page goes dark; the folders and the board keep their colours.

### 2.3a Theme days

A theme day is a dated palette plus three folder colours, with an optional page background and a header line ("Halloween · No. 304"). The puzzle, timer and share text don't change.

- **Drafted:** Halloween (pumpkin board on a night page; candy-corn, pumpkin and witch-purple folders) and Christmas (frost, berry and pine; holly-red and pine folders). Josh likes both (11 Nov). See the canvas.
- **The calendar:** Claude suggests a full list at that build step (TRI-100); Josh picks.
- **Every palette passes a check before it ships:**
  - shades strictly in order, light to deep;
  - givens, entries and notes at least 4.5:1 on all four shades;
  - folder text at least 4.5:1.
  - The Halloween and Christmas drafts fail on entry digits (3.9:1 and 4.3:1) and get darker inks when they're built.

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
- **Fit rule (TRI-058).** The board width is `min(28rem, max(15rem, calc((100dvh − 330px) × 1.15)))`. Messages float or live in the header (§3.6), so nothing else takes vertical space.

### 2.6 Radius, borders, elevation, layers

| Token | Value | Use |
|---|---|---|
| `rounded-sm` | 6 | Badges, focus rings inside controls |
| `rounded-control` | 10 **[Decision: 14 on "round"]** | Buttons, segmented controls, menu items |
| `rounded-card` | 14 (20) | Notices, cards, pad keys, stat tiles, paused panel |
| `rounded-dialog` | 20 (28) | Dialogs and sheets |
| `rounded-full` | 9999 | Pills, icon buttons |

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
  - `primary`: ink (`--action`) fill with paper text;
  - `secondary`: control fill with strong border;
  - `ghost`: transparent;
  - `destructive`: solid danger with white text;
  - `link`: text colour, underlined.
- **Sizes:** `sm` 36, `md` 44 and `lg` 52. Radius `rounded-control`; `shape="pill"` gives `rounded-full`.
- **States:**
  - hover adds the `--hover` overlay, on pointer devices only;
  - pressed adds `--press` and scales to 0.98 (no scale with reduced motion);
  - focus-visible shows the focus ring;
  - disabled is 45 % opacity with no pointer events;
  - loading shows a spinner in place of the leading icon and keeps the label.
- **Do:** one primary per view. **Don't:** use primary for destructive confirmations (today "Reset Puzzle" is teal).
- **On a folder:** buttons inside a difficulty-coloured card stay ink. "Next up: Medium" on the win card is the one button that wears a difficulty colour (the next one's).
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

- 40 px tall, `rounded-full`, 15/600 label and 16 px icon. The pills sit on the folder, so they're paper at 80 % with a 14 % ink border; that reads on all three colours.
- **Variants:**
  - `default`;
  - `on` (ink fill, paper text, for toggles like Check, with `aria-pressed`).
- Undo's 2-second note ("Removed 7") changes only the label; the cell flash on the board shows what changed. Today the note and Check's on state are both solid teal, so "on" and "just happened" look the same.
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

### 3.5 Difficulty folder tabs **[Decided]**

- Three tabs across the full width, each always filled with its difficulty colour and labelled in ink.
- The selected tab is taller (46 vs 36 px) and runs straight into the **board folder** below it: a card in the same colour (`rounded-card` 20, square at the corner under an end tab, 12 px padding) that holds the board and the four corner pills.
- Unselected tabs sit "behind": shorter, with a soft inner shadow at their base.
- **Status:** a check after the label when solved today; the time when in progress ("Medium · 04:12" in `aria-label`).
- `role="tablist"` with `aria-selected`. Today the tabs have no selected state for screen readers (audit UI-15).
- **Elsewhere:**
  - The **welcome screen** shows today's three puzzles as a stacked file: three folders whose tabs are staggered left to right, each with its description and status.
  - The **win card** is the same folder: the difficulty tab on top, then "Solved" and the time in large type on the colour, then a paper section with stats, Share result (ink) and "Next up".
  - **Statistics** uses the folder tabs for Easy, Medium and Hard.

### 3.6 Messages: never move the board **[Decided, TRI-090]**

Rule: **a message never moves or resizes the board or the number pad.** Josh rejected an earlier version that shrank the board to make room, because a board that jumps while you play is worse than the message it shows. Each kind of message has its place:

| Kind | Pattern | Example |
|---|---|---|
| Mode | The controls show it: in Pencil mode the Pencil button is ink and the number keys switch to a small corner digit, like a note | Pencil on |
| First-time hint | A one-line bubble beside the control that triggered it. It goes after the first use, a tap, or 6 s, and appears once. Keyboard shortcuts are added only on devices with a fine pointer | "Notes on: tap a number to add or remove it" |
| Tip | A **TipBanner** that slides in over the top of the screen, with an action and a 40 px dismiss button, and hides after 10–12 s | "Stuck? … Show me" |
| Status that lasts all game | A few words in the header, in place of the puzzle number, tappable for the full banner | "From 13 Nov" |
| Error with no board | Inline Notice where the board would be | Couldn't load, Retry |

- **TipBanner:** `surface-raised`, `rounded-card`, elevation 2, `role="status"`. It slides from the top unless reduced motion is on, and floats (`z-toast`) over the header, never in the page flow. Only one shows at a time.
- **Notice** (inline): tone icon (16), message (14/20), optional action and dismiss. Used only where there's no board: the welcome screen and load errors.
- Copy in any message is one sentence where possible.

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
  - `aria-pressed` note on: ink fill, Pencil mode only;
  - no cell selected: muted text, still tappable, shows the hint "Pick a cell first". Today the whole pad is at 50 % opacity on first view (audit UI-19).
- Hover is a pointer-only overlay. Today hover paints the key with the same teal as "note on" (audit UI-21).
- Clear: outline key with a 24 px icon and `aria-label="Clear cell"`. It no longer turns red on hover.

### 3.10 Badge

- 22 px tall, `rounded-full`, 12/600.
- Tones: `success` (done ✓) and `neutral` (in progress, with time).
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
| Touching | one continuous `touching` outline around the selection and its 12 neighbours | TRI-032. Whether to show it on Medium and Hard is still open (R-12) |
| Error (Check on) | `error-tint` + `error-digit` + underline, also on the selected cell | TRI-065 |
| Highlighted | inverse: ink fill, paper digit | not yet prototyped |
| Flash | `flash` fading | TRI-052 |
| Paused | paper panel on the folder, same size, "Paused" `text-heading` + Resume `primary` pill | |

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
| Lightest / middle / deepest shade | blue, yellow, green (for the rule cells) |
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
- [ ] Nothing changes a board cell's fill except its rule shade (and the error tint). New board states are drawn on top.
- [ ] A new palette or theme day passes the palette check (§2.3a).
- [ ] Light and dark checked in a real browser at 360×640, 390×664 and 1440×900.
- [ ] Text 4.5:1 and UI parts 3:1. Targets 44 px. Focus visible. Keyboard reachable. `aria-*` correct.
- [ ] Reduced motion honoured. Hover only on pointer devices.
- [ ] Copy follows §4 and the glossary.
- [ ] No message moves the board or the pad (`play-through.cjs` checks), and the pad still fits at 360×640.

### Drift guard (TRI-097)

`pnpm lint:design` runs in CI next to `pnpm lint`. It's a small Node script over `app/` and `components/`. It fails on:
1. `#[0-9a-f]{3,8}`, `rgb(`, `rgba(`, `hsl(` and `oklch(` outside `app/globals.css`, the palette file (`lib/palettes.ts`), `app/og/route.tsx` and `components/rule-diagrams.tsx` (until migrated);
2. Tailwind palette colours (`(bg|text|border|fill|stroke|ring)-(red|green|blue|amber|yellow|pink|gray|zinc|…)-\d`);
3. arbitrary values `-[` except an allowlist: `max-w-[calc(...)]`, `data-[...]`, `has-[...]`, `aria-[...]`, `max-[359px]`, `@max-[350px]` and `grid-cols-[...]`;
4. `<button` in `components/*.tsx` outside `components/ui/`, unless the line carries `// design-ok: <reason>`.

Each rule prints the file, the line and the token to use instead. `/bts` is excluded (a standalone essay) but must use tokens for colour.

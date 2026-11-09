# M3 · Mobile and accessibility

**Goal.** Make the game comfortable on small phones and playable without a mouse, a touchscreen or full sight.

**Done when**
- Board and pad fit 360×640.
- A full puzzle can be finished with keyboard only and with VoiceOver.
- No information is carried by color alone; contrast targets met in both themes.
- The milestone evaluation has been run and saved in `docs/reviews/` (see [evaluation](../evaluation/README.md)).

Items are listed in the suggested order of work. Status lives in [BACKLOG.md](BACKLOG.md).

<a id="tri-058"></a>
## TRI-058 · Board and number pad fit small phones

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| High | H | M | Mobile completion rate | none | 4.1, 4.a |

**Problem.** At 360×640 the number pad starts below the fold; ~70 px is wasted between timer and board.

**Done when**
- [x] Under 700 px tall, the header collapses, timer and controls sit on the tab row and board padding is removed. *Done differently, chosen in a prototype (Proposed C): a 56 px one-line header, tighter spacing, and the timer and controls in the empty top corners beside the board (TRI-087), which frees the whole row. Applies at every size.*
- [x] Board and pad fit within 640 px of height at 360 px wide. *Pad ends at 594 px at 360×640, 620 px on an iPhone 13 (664 visible in Safari on load), 547 px on a 320×568 iPhone SE, where the board shrinks to fit. The play-through check now passes.*

**Check it in a preview.** Open the preview on the smallest phone available, or in browser dev tools at 360×640.

<a id="tri-059"></a>
## TRI-059 · Larger, more forgiving tap targets

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| High | H | S | Mobile completion, mis-tap rate | none | 4.2, 4.b |

**Problem.** Triangles are ~38×33 px at 390 px wide, with an inscribed circle of ~22 px.

**Done when**
- [x] Taps select the cell whose centroid is nearest the touch point, using the SVG coordinate system. *`nearestCellId` in `lib/tridoku.ts`; taps on lines, corners and just outside the edge count.*
- [ ] Clear-right-after-entry rate (from TRI-019 events) drops after release. *Waiting on data (TRI-059 stays In review). Now measured: completions carry `quick_clears` (a digit cleared within 2 s of being entered in the same cell). There's no before figure, so compare early weeks against later ones and against touch vs mouse.*

<a id="tri-087"></a>
## TRI-087 · Clearer game controls

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | M | S | Completion rate, mobile completion | none | Found in M3 prototyping (owner, 9 Nov) |

**Problem.** The timer was plain text with a separate pause button; error checking was an eye icon, which reads as show/hide rather than "check my work"; Reset, which wipes progress, sat beside them with equal weight. They also took a row of their own on phones.

**Done when**
- [x] The timer is a pill that pauses and resumes when tapped; paused, the board area keeps its size and shows Resume.
- [x] Error checking is a labelled "Check" toggle with a clear on state.
- [x] Reset moves into a "⋯" menu, keeping its confirmation. *Since TRI-052, ⋯ sits under Check, mirroring Undo under the timer; with the corner to itself, Check keeps its label on every phone width.*
- [x] Both sit in the empty top corners beside the triangle.
- [x] The rules modal's tip describes Check.

Owner checked on an iPhone in the preview (9 Nov): pad fits with Safari's toolbars showing; pause screen lines up.

**Check it in a preview.** On a phone: tap the timer to pause and resume, turn Check on with a wrong digit entered, and open ⋯ → Reset puzzle → Cancel.

<a id="tri-060"></a>
## TRI-060 · Readable pencil marks

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | M | S | Notes usage | none | 4.4, 4.d |

**Problem.** Up to 6 marks render at ~7 px on mobile; the code comment says the limit is 3.

**Done when**
- [ ] Either cap corner marks at 3, or use a fixed 3×3 mini-grid with a minimum on-screen font size of 9 px at 360 px width.
- [ ] The comment and the code agree.

<a id="tri-061"></a>
## TRI-061 · Player entries look different from givens

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | M | S | Error rate | none | 4.5, 4.d |

**Problem.** Givens are bold and entries regular, both black.

**Done when**
- [ ] Player entries use the primary teal in both themes with ≥4.5:1 contrast on every cell fill.

<a id="tri-062"></a>
## TRI-062 · Keyboard-playable board

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Critical | M | M | Keyboard completions | none | 6.1, 6.a |

**Problem.** Cells have no tabindex or role; keyboard-only players can't place a digit.

**Done when**
- [ ] The board is `role="grid"` with `gridcell`s and one tabbable cell (roving tabindex).
- [ ] Arrow keys move between cells; focusing the board selects the first empty cell.
- [ ] A full puzzle can be completed with keyboard only.

<a id="tri-063"></a>
## TRI-063 · Screen-reader labels for the board

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| High | M | M | Screen-reader completions | [TRI-062](m3-mobile-accessibility.md#tri-062) | 6.2, 6.b |

**Problem.** The SVG has no role or label.

**Done when**
- [ ] Each cell has a label like "Row 4, cell 7, region 3, outer edge, empty, notes 2 5".
- [ ] Tested with VoiceOver (iOS) and NVDA or VoiceOver (macOS).

<a id="tri-064"></a>
## TRI-064 · Spoken announcements

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | M | S | Screen-reader completions | [TRI-063](m3-mobile-accessibility.md#tri-063) | 6.c |

**Problem.** Conflicts and the win aren't announced.

**Done when**
- [ ] A polite live region announces conflicts ("Conflicts with row 5 cell 3") and "Puzzle solved".

<a id="tri-065"></a>
## TRI-065 · Errors visible without color

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| High | H | S | Error recovery | none | 6.3, 6.d |

**Problem.** Red digits on pink cells are 1.49:1–2.39:1 contrast, and the error overlay is skipped on the selected cell.

**Done when**
- [ ] Errors show a shape cue (underline or strike plus thicker red outline) on every fill, including the selected cell.
- [ ] Error color reaches ≥3:1 against every cell fill.

<a id="tri-066"></a>
## TRI-066 · Respect reduced motion

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | L | S | Accessibility | none | 6.4, 6.e |

**Problem.** The selection outline animates forever even when reduced motion is requested.

**Done when**
- [ ] The dash animation runs only under `prefers-reduced-motion: no-preference`; otherwise the outline is static.

<a id="tri-067"></a>
## TRI-067 · Readable welcome card text

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| Medium | M | S | Accessibility | none | 6.5 |

**Problem.** Hard subtitle 2.06:1 and Medium 3.19:1 contrast.

**Done when**
- [x] All card text reaches ≥4.5:1 in both themes.

<a id="tri-068"></a>
## TRI-068 · Region lines visible in dark mode

| Severity | Impact | Effort | Moves | Depends on | Review |
|---|---|---|---|---|---|
| High | M | S | Dark-mode completion | none | 5.1, 5.a |

**Problem.** Region lines are grey `#7e7e7e` on light cells in dark mode (3.1:1).

**Done when**
- [ ] Region lines reach ≥4.5:1 against adjacent cells in dark mode (near-black lines, or darker fills).

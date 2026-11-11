// UI audit screenshot matrix. Usage: node shots.cjs <outDir> [only-substring]
const { chromium } = require("playwright")
const { execFileSync } = require("node:child_process")
const fs = require("node:fs")
const path = require("node:path")

const BASE = "http://localhost:3000"
const OUT = process.argv[2]
const ONLY = process.argv[3] || ""
fs.mkdirSync(OUT, { recursive: true })
const REPO = "/home/user/tridoku"
const d = new Date()
const DATE = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
const T = JSON.parse(execFileSync(process.execPath, ["--experimental-strip-types", "--no-warnings", path.join(REPO, "scripts/eval/solve-day.ts"), DATE]).toString())
const CELL = "svg g.cursor-pointer"

const VP = {
  se: { width: 320, height: 568, mobile: true },
  p360: { width: 360, height: 640, mobile: true },
  i13: { width: 390, height: 664, mobile: true },
  p430: { width: 430, height: 932, mobile: true },
  tab: { width: 768, height: 1024, mobile: true },
  d1280: { width: 1280, height: 800, mobile: false },
  d1440: { width: 1440, height: 900, mobile: false },
  land: { width: 844, height: 390, mobile: true },
}
const ALL = Object.keys(VP)
const THEMES = ["light", "dark"]

let browser
async function open(vpName, theme, opts = {}) {
  const vp = VP[vpName]
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 2,
    isMobile: vp.mobile,
    hasTouch: vp.mobile,
    colorScheme: theme,
    reducedMotion: opts.reducedMotion || "no-preference",
    javaScriptEnabled: opts.js !== false,
  })
  await ctx.addInitScript(({ firstVisit, seed }) => {
    if (sessionStorage.getItem("seeded")) return
    sessionStorage.setItem("seeded", "1")
    if (!firstVisit) localStorage.setItem("tridoku-rules-seen", "true")
    for (const [k, v] of Object.entries(seed || {})) localStorage.setItem(k, v)
  }, { firstVisit: !!opts.firstVisit, seed: opts.seed })
  const page = await ctx.newPage()
  if (opts.clock) await page.clock.install({ time: opts.clock })
  if (opts.route) await page.route(opts.route[0], opts.route[1])
  return { ctx, page }
}
const shot = async (page, name, full = false) => {
  const file = path.join(OUT, `${name}.png`)
  await page.screenshot({ path: file, fullPage: full, animations: "disabled", caret: "hide" })
  console.log("saved", name)
}
async function start(page, diff) {
  await page.getByRole("button", { name: new RegExp(`^${diff}`, "i") }).first().click()
  await page.locator(CELL).first().waitFor()
  await page.waitForTimeout(250)
}
async function cellClick(page, i) {
  await page.locator(CELL).nth(i).locator("polygon").first().click({ force: true })
}
async function enter(page, i, digit) {
  await cellClick(page, i)
  await page.keyboard.press(String(digit))
}
function empties(diff) {
  return [...T[diff].puzzle].flatMap((c, i) => (c === "0" ? [i] : []))
}
async function fillHalf(page, diff, frac = 0.5) {
  const e = empties(diff)
  for (const i of e.slice(0, Math.floor(e.length * frac))) await enter(page, i, T[diff].solution[i])
}
async function solveRest(page, diff) {
  const { puzzle, solution } = T[diff]
  const vals = await page.locator(CELL).evaluateAll((es) => es.map((e) => e.querySelector("text")?.textContent || "0").join(""))
  for (let i = 0; i < 81; i++) if (puzzle[i] === "0" && vals[i] !== solution[i]) await enter(page, i, solution[i])
  await page.waitForTimeout(1200)
}

const blank = { gamesPlayed: 0, gamesWon: 0, currentStreak: 0, maxStreak: 0, bestTime: null, lastPlayedDate: null, completedToday: false }
const yday = (() => { const y = new Date(Date.now() - 864e5); return `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, "0")}-${String(y.getDate()).padStart(2, "0")}` })()
const RETURNING = {
  "tridoku-stats": JSON.stringify({
    easy: { gamesPlayed: 12, gamesWon: 11, currentStreak: 6, maxStreak: 9, bestTime: 214, previousBestTime: 214, lastPlayedDate: yday, completedToday: false },
    medium: { gamesPlayed: 7, gamesWon: 5, currentStreak: 2, maxStreak: 4, bestTime: 512, previousBestTime: 512, lastPlayedDate: yday, completedToday: false },
    hard: { ...blank, gamesPlayed: 2, gamesWon: 1, currentStreak: 0, maxStreak: 1, bestTime: 1490, lastPlayedDate: "2026-11-01" },
  }),
}

const jobs = []
const job = (name, fn) => jobs.push({ name, fn })

// ── Loading (JS off shows the server-rendered loading state forever)
for (const th of THEMES) job(`loading--i13-${th}`, async () => {
  const { ctx, page } = await open("i13", th, { js: false })
  await page.goto(BASE); await shot(page, `01-loading--i13-${th}`); await ctx.close()
})

// ── Welcome, first visit: every viewport, both themes
for (const v of ALL) for (const th of THEMES) job(`welcome-first--${v}-${th}`, async () => {
  const { ctx, page } = await open(v, th, { firstVisit: true })
  await page.goto(BASE, { waitUntil: "networkidle" }); await page.waitForTimeout(300)
  await shot(page, `02-welcome-first--${v}-${th}`, v === "i13" || v === "d1440")
  await ctx.close()
})

// ── Welcome, returning with one in progress and one done
for (const v of ["i13", "d1440", "se"]) for (const th of THEMES) job(`welcome-returning--${v}-${th}`, async () => {
  const { ctx, page } = await open(v, th, { seed: RETURNING })
  await page.goto(BASE, { waitUntil: "networkidle" })
  // make an in-progress Medium, then go back to the welcome screen via reload? progress is restored into the game,
  // so seed it by playing then reloading.
  await start(page, "medium"); await enter(page, empties("medium")[0], T.medium.solution[empties("medium")[0]])
  await page.waitForTimeout(1500)
  await page.reload({ waitUntil: "networkidle" }); await page.waitForTimeout(400)
  await shot(page, `03-welcome-returning--${v}-${th}`, true)
  await ctx.close()
})

// ── First-visit rules intro over the board
for (const [v, th] of [["i13", "light"], ["i13", "dark"], ["d1440", "light"], ["se", "light"]]) job(`rules-intro--${v}-${th}`, async () => {
  const { ctx, page } = await open(v, th, { firstVisit: true })
  await page.goto(BASE, { waitUntil: "networkidle" })
  await page.getByRole("button", { name: /play today/i }).click(); await page.waitForTimeout(500)
  await shot(page, `04-rules-intro-1--${v}-${th}`)
  if (v === "i13" && th === "light") {
    for (let s = 2; s <= 3; s++) { await page.getByRole("button", { name: /^next/i }).click(); await page.waitForTimeout(250); await shot(page, `04-rules-intro-${s}--${v}-${th}`) }
    await page.getByRole("tab", { name: "Tips" }).click(); await page.waitForTimeout(200)
    for (let s = 1; s <= 5; s++) { await shot(page, `05-tips-${s}--${v}-${th}`); if (s < 5) { await page.getByRole("button", { name: /^next/i }).click(); await page.waitForTimeout(250) } }
  }
  await ctx.close()
})

// ── Game, empty board: every viewport, both themes
for (const v of ALL) for (const th of THEMES) job(`game-empty--${v}-${th}`, async () => {
  const { ctx, page } = await open(v, th)
  await page.goto(BASE, { waitUntil: "networkidle" }); await start(page, "easy")
  await shot(page, `06-game-empty--${v}-${th}`)
  if (v === "i13" || v === "d1440") await shot(page, `06-game-empty-full--${v}-${th}`, true)
  await ctx.close()
})

// ── Game in progress with a selected cell (touching tint)
for (const v of ["se", "p360", "i13", "d1440"]) for (const th of THEMES) job(`game-progress--${v}-${th}`, async () => {
  const { ctx, page } = await open(v, th)
  await page.goto(BASE, { waitUntil: "networkidle" }); await start(page, "medium")
  await fillHalf(page, "medium", 0.45)
  await cellClick(page, empties("medium").at(-6)); await page.waitForTimeout(200)
  await shot(page, `07-game-progress--${v}-${th}`)
  await ctx.close()
})

// ── Errors with Check on (and off), selected error cell
for (const v of ["i13", "d1440"]) for (const th of THEMES) job(`game-errors--${v}-${th}`, async () => {
  const { ctx, page } = await open(v, th)
  await page.goto(BASE, { waitUntil: "networkidle" }); await start(page, "easy")
  await fillHalf(page, "easy", 0.3)
  const e = empties("easy")
  // wrong digits: one per cell colour region where possible
  for (const i of e.slice(-8, -2)) await enter(page, i, (Number(T.easy.solution[i]) % 9) + 1)
  await cellClick(page, e[e.length - 1])
  await shot(page, `08-errors-check-off--${v}-${th}`)
  await page.getByRole("button", { name: /^check/i }).click(); await page.waitForTimeout(150)
  await shot(page, `08-errors-check-on--${v}-${th}`)
  await cellClick(page, e.at(-3)); await page.waitForTimeout(150)
  await shot(page, `08-errors-check-on-selected-error--${v}-${th}`)
  await ctx.close()
})

// ── Notes-heavy, pencil mode with tip; highlight a digit
for (const v of ["i13", "d1440", "se"]) for (const th of THEMES) job(`notes--${v}-${th}`, async () => {
  const { ctx, page } = await open(v, th)
  await page.goto(BASE, { waitUntil: "networkidle" }); await start(page, "hard")
  await page.getByRole("button", { name: "Pencil", exact: true }).click()
  const e = empties("hard")
  const sets = [[1, 4], [2, 5, 7], [1, 2, 3, 4, 5, 6], [3, 8], [6, 9, 2, 4], [1, 2, 3, 4, 5, 6, 7], [5], [7, 8, 9]]
  for (let k = 0; k < 24; k++) {
    await cellClick(page, e[k])
    for (const n of sets[k % sets.length]) await page.keyboard.press(String(n))
  }
  await shot(page, `09-notes-pencil-tip--${v}-${th}`)
  if (v === "i13") {
    // tapped key keeps hover styling on touch: tap a pad key for a fresh cell
    await cellClick(page, e[30]); await page.getByRole("button", { name: "Enter 5" }).tap(); await page.waitForTimeout(150)
    await shot(page, `09-notes-pad-after-tap--${v}-${th}`)
    await page.getByRole("button", { name: "Pen", exact: true }).click()
    // highlight: double-tap a given
    const g = [...T.hard.puzzle].findIndex((c) => c !== "0")
    await cellClick(page, g); await page.waitForTimeout(80); await cellClick(page, g); await page.waitForTimeout(200)
    await shot(page, `10-highlight-digit--${v}-${th}`)
  }
  await ctx.close()
})

// ── Paused, undo note, menu open, reset confirm
for (const v of ["i13", "p360", "d1440"]) for (const th of THEMES) job(`controls--${v}-${th}`, async () => {
  const { ctx, page } = await open(v, th)
  await page.goto(BASE, { waitUntil: "networkidle" }); await start(page, "easy")
  await fillHalf(page, "easy", 0.15)
  await page.getByRole("button", { name: "Undo" }).click(); await page.waitForTimeout(120)
  await shot(page, `11-undo-note--${v}-${th}`)
  await page.waitForTimeout(2200)
  await page.getByRole("button", { name: "More" }).click(); await page.waitForTimeout(150)
  await shot(page, `12-menu-open--${v}-${th}`)
  await page.getByRole("menuitem", { name: /reset/i }).click(); await page.waitForTimeout(300)
  await shot(page, `13-reset-confirm--${v}-${th}`)
  await page.getByRole("button", { name: "Cancel" }).click(); await page.waitForTimeout(300)
  await page.getByRole("button", { name: /^pause/i }).click(); await page.waitForTimeout(200)
  await shot(page, `14-paused--${v}-${th}`)
  await ctx.close()
})

// ── Win modal, view mode, stats with data
for (const v of ["i13", "d1440", "se"]) for (const th of THEMES) job(`win--${v}-${th}`, async () => {
  const { ctx, page } = await open(v, th, { seed: RETURNING, clock: new Date() })
  await page.goto(BASE, { waitUntil: "networkidle" }); await start(page, "easy")
  await page.clock.fastForward("04:12")
  await solveRest(page, "easy")
  await page.getByRole("dialog").waitFor(); await page.waitForTimeout(500)
  await shot(page, `15-win-modal--${v}-${th}`)
  await page.keyboard.press("Escape"); await page.waitForTimeout(400)
  await shot(page, `16-view-mode--${v}-${th}`, true)
  await page.getByRole("button", { name: "Statistics" }).click(); await page.waitForTimeout(400)
  await shot(page, `17-stats--${v}-${th}`)
  await ctx.close()
})

// ── Stats empty
for (const th of THEMES) job(`stats-empty--${th}`, async () => {
  const { ctx, page } = await open("i13", th)
  await page.goto(BASE, { waitUntil: "networkidle" }); await start(page, "easy")
  await page.getByRole("button", { name: "Statistics" }).click(); await page.waitForTimeout(400)
  await shot(page, `17-stats-empty--i13-${th}`); await ctx.close()
})

// ── Load error, fallback puzzle
for (const th of THEMES) job(`load-error--${th}`, async () => {
  const { ctx, page } = await open("i13", th, { route: ["**/puzzles/**", (r) => r.fulfill({ status: 500, body: "" })] })
  await page.goto(BASE); await page.getByRole("button", { name: /^easy/i }).first().click()
  await page.getByRole("button", { name: "Retry" }).waitFor(); await page.waitForTimeout(200)
  await shot(page, `18-load-error--i13-${th}`, true); await ctx.close()
})
for (const th of THEMES) job(`fallback--${th}`, async () => {
  const { ctx, page } = await open("i13", th, { clock: new Date(Date.now() + 30 * 864e5) })
  await page.goto(BASE); await start(page, "easy")
  await shot(page, `19-fallback--i13-${th}`); await ctx.close()
})

// ── Power-cells tip (60 s without progress)
for (const th of THEMES) job(`power-tip--${th}`, async () => {
  const { ctx, page } = await open("i13", th, { clock: new Date() })
  await page.goto(BASE); await start(page, "medium")
  await page.clock.fastForward(70_000); await page.waitForTimeout(300)
  await shot(page, `20-power-tip--i13-${th}`); await ctx.close()
})

// ── Theme toggle in header (light system → toggled dark)
job(`theme-toggle`, async () => {
  const { ctx, page } = await open("i13", "light")
  await page.goto(BASE, { waitUntil: "networkidle" }); await start(page, "easy")
  await page.getByRole("button", { name: "Toggle theme" }).click(); await page.waitForTimeout(400)
  await shot(page, `21-theme-toggled-dark--i13-light-system`); await ctx.close()
})

// ── Keyboard focus walk
job(`focus`, async () => {
  const { ctx, page } = await open("d1440", "light")
  await page.goto(BASE, { waitUntil: "networkidle" }); await start(page, "easy")
  const seen = []
  for (let i = 0; i < 22; i++) {
    await page.keyboard.press("Tab"); await page.waitForTimeout(60)
    const label = await page.evaluate(() => { const a = document.activeElement; return a ? (a.getAttribute("aria-label") || a.textContent || a.tagName).trim().slice(0, 30) : "" })
    seen.push(label)
    if ([1, 4, 5, 8, 10, 12].includes(i)) await shot(page, `22-focus-${String(i).padStart(2, "0")}--d1440-light`)
  }
  fs.writeFileSync(path.join(OUT, "focus-order.txt"), seen.map((s, i) => `${i + 1}. ${s}`).join("\n"))
  await ctx.close()
})

// ── Footer, Ko-fi dialog
for (const th of THEMES) job(`footer-kofi--${th}`, async () => {
  const { ctx, page } = await open("i13", th)
  await page.goto(BASE, { waitUntil: "networkidle" }); await start(page, "easy")
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(200)
  await shot(page, `23-footer--i13-${th}`)
  await page.getByRole("button", { name: /ko-fi/i }).click(); await page.waitForTimeout(1500)
  await shot(page, `24-kofi--i13-${th}`); await ctx.close()
})

// ── Secondary pages
for (const v of ["i13", "d1440"]) for (const th of THEMES) job(`how-to-play--${v}-${th}`, async () => {
  const { ctx, page } = await open(v, th)
  await page.goto(BASE + "/how-to-play", { waitUntil: "networkidle" })
  await shot(page, `25-how-to-play--${v}-${th}`, true); await ctx.close()
})
for (const v of ["i13", "d1440"]) for (const th of THEMES) job(`bts--${v}-${th}`, async () => {
  const { ctx, page } = await open(v, th)
  await page.goto(BASE + "/bts", { waitUntil: "networkidle" })
  await shot(page, `26-bts-top--${v}-${th}`)
  if (th === "light") await shot(page, `26-bts-full--${v}-${th}`, true)
  await ctx.close()
})
for (const th of THEMES) job(`404--${th}`, async () => {
  const { ctx, page } = await open("i13", th)
  await page.goto(BASE + "/no-such-page", { waitUntil: "networkidle" })
  await shot(page, `27-404--i13-${th}`); await ctx.close()
})
job(`og`, async () => {
  const { ctx, page } = await open("d1440", "light")
  await page.goto(BASE + `/og?date=${DATE}`)
  await shot(page, `28-og-image--d1440`); await ctx.close()
})
// Reduced motion: confirm the selection outline is still animated
job(`reduced-motion`, async () => {
  const { ctx, page } = await open("i13", "light", { reducedMotion: "reduce" })
  await page.goto(BASE, { waitUntil: "networkidle" }); await start(page, "easy")
  await cellClick(page, empties("easy")[0])
  const anim = await page.evaluate(() => getComputedStyle(document.querySelector(".selected-cell")).animationName)
  fs.writeFileSync(path.join(OUT, "reduced-motion.txt"), `selected-cell animation-name under reduced motion: ${anim}\n`)
  await ctx.close()
})

;(async () => {
  browser = await chromium.launch()
  const todo = jobs.filter((j) => j.name.includes(ONLY))
  const failed = []
  // small concurrency
  const N = 4
  let idx = 0
  await Promise.all(Array.from({ length: N }, async () => {
    while (idx < todo.length) {
      const j = todo[idx++]
      try { await j.fn() } catch (e) { failed.push(`${j.name}: ${e.message.split("\n")[0]}`); console.error("FAIL", j.name, e.message.split("\n")[0]) }
    }
  }))
  console.log(`\n${todo.length - failed.length}/${todo.length} jobs ok`)
  if (failed.length) fs.writeFileSync(path.join(OUT, "failed.txt"), failed.join("\n"))
  await browser.close()
})()

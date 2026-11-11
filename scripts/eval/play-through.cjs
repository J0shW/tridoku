// Plays the app in a headless browser and reproduces the baseline review's checks.
//
// Usage:
//   node scripts/eval/play-through.cjs [baseUrl] [outDir]
//   defaults: http://localhost:3000 and docs/reviews/<today>-run/
//
// Needs Playwright with Chromium (`npm i -g playwright && npx playwright install chromium`)
// and a running server (`pnpm build && pnpm start`). Board selectors match the SVG board as of
// the baseline; update CELL below when the board changes (e.g. after TRI-062 adds role="grid").

const { chromium } = require("playwright")
const { execFileSync } = require("node:child_process")
const fs = require("node:fs")
const path = require("node:path")

const BASE = process.argv[2] || "http://localhost:3000"
const today = new Date()
const DATE = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
const OUT = process.argv[3] || path.join(__dirname, `../../docs/reviews/${DATE}-run`)
const CELL = "svg g.cursor-pointer"
fs.mkdirSync(OUT, { recursive: true })

const T = JSON.parse(
  execFileSync(process.execPath, ["--experimental-strip-types", "--no-warnings", path.join(__dirname, "solve-day.ts"), DATE]).toString(),
)
const log = []
const note = (k, v) => { log.push(`- **${k}:** ${v}`); console.log(`${k}: ${v}`) }
const shot = (page, name, full = false) => page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: full })

async function enter(page, i, digit, touch) {
  await page.locator(CELL).nth(i).locator("polygon").first().click({ force: true })
  if (touch) await page.getByRole("button", { name: `Enter ${digit}` }).click()
  else await page.keyboard.press(String(digit))
}
async function solveRest(page, diff, touch) {
  const { puzzle, solution } = T[diff]
  const vals = await page.locator(CELL).evaluateAll((es) => es.map((e) => e.querySelector("text")?.textContent || "0").join(""))
  for (let i = 0; i < 81; i++) if (puzzle[i] === "0" && vals[i] !== solution[i]) await enter(page, i, solution[i], touch)
  await page.waitForTimeout(900)
}
const start = async (page, diff) => {
  await page.getByRole("button", { name: new RegExp(`^${diff}`, "i") }).first().click()
  await page.locator(CELL).first().waitFor()
}

;(async () => {
  const browser = await chromium.launch()
  // Play as someone who has seen the rules, so the first-visit intro (TRI-029) doesn't
  // cover the board. Step 1 still opens How to Play itself for its screenshot.
  const newContext = browser.newContext.bind(browser)
  browser.newContext = async (opts) => {
    const ctx = await newContext(opts)
    await ctx.addInitScript(() => localStorage.setItem("tridoku-rules-seen", "true"))
    return ctx
  }

  // 1. Full play-throughs with screenshots
  for (const vp of [
    { name: "desktop", width: 1440, height: 900, touch: false, diff: "medium" },
    { name: "mobile", width: 390, height: 844, touch: true, diff: "easy" },
  ]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, hasTouch: vp.touch, isMobile: vp.touch })
    const page = await ctx.newPage()
    const errors = []
    page.on("pageerror", (e) => errors.push(e.message))
    const t0 = Date.now()
    await page.goto(BASE, { waitUntil: "networkidle" })
    note(`${vp.name} load`, `${Date.now() - t0} ms`)
    await shot(page, `${vp.name}-01-first`, true)
    await page.getByRole("button", { name: /how to play/i }).first().click()
    await page.waitForTimeout(400)
    await shot(page, `${vp.name}-02-rules`)
    await page.keyboard.press("Escape")
    await page.waitForTimeout(300)
    await start(page, vp.diff)
    const { puzzle, solution } = T[vp.diff]
    const empties = [...puzzle].flatMap((c, i) => (c === "0" ? [i] : []))
    const half = Math.floor(empties.length / 2)
    for (const i of empties.slice(0, half)) await enter(page, i, solution[i], vp.touch)
    await shot(page, `${vp.name}-03-midgame`, true)
    const wrong = empties[half]
    await enter(page, wrong, (Number(solution[wrong]) % 9) + 1, vp.touch)
    await page.getByRole("button", { name: /turn on error checking/i }).click().catch(() => {})
    await page.waitForTimeout(200)
    await shot(page, `${vp.name}-04-error`)
    await solveRest(page, vp.diff, vp.touch)
    await shot(page, `${vp.name}-05-win`)
    await page.keyboard.press("Escape")
    await page.getByRole("button", { name: "Statistics" }).click()
    await page.waitForTimeout(300)
    await shot(page, `${vp.name}-06-stats`)
    note(`${vp.name} page errors`, errors.length ? errors.join(" | ") : "none")
    await ctx.close()
  }

  // 2. Streak across consecutive days
  {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    await page.addInitScript((yesterday) => {
      if (localStorage.getItem("eval-seeded")) return
      localStorage.setItem("eval-seeded", "1")
      const blank = { gamesPlayed: 0, gamesWon: 0, currentStreak: 0, maxStreak: 0, bestTime: null, lastPlayedDate: null, completedToday: false }
      const easy = { gamesPlayed: 5, gamesWon: 5, currentStreak: 5, maxStreak: 5, bestTime: 300, lastPlayedDate: yesterday, completedToday: false }
      localStorage.setItem("tridoku-stats", JSON.stringify({ easy, medium: blank, hard: blank }))
    }, (() => { const y = new Date(Date.now() - 864e5); return `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, "0")}-${String(y.getDate()).padStart(2, "0")}` })())
    await page.goto(BASE)
    await start(page, "easy")
    await solveRest(page, "easy", false)
    const s = JSON.parse(await page.evaluate(() => localStorage.getItem("tridoku-stats"))).easy
    note("Streak after 5 days + today (expect 6)", s.currentStreak)
    await ctx.close()
  }

  // 3. Puzzle number in different time zones on the same local date
  const nums = []
  for (const [tz, clock] of [["America/Los_Angeles", "09:00:00-08:00"], ["America/Los_Angeles", "20:00:00-08:00"], ["Asia/Tokyo", "07:00:00+09:00"], ["Europe/London", "12:00:00Z"]]) {
    const ctx = await browser.newContext({ timezoneId: tz })
    const page = await ctx.newPage()
    await page.clock.install({ time: new Date(`${DATE}T${clock}`) })
    await page.goto(BASE)
    nums.push(`${tz} ${clock.slice(0, 5)} → ${await page.locator("text=/Puzzle #\\d+/").first().innerText()}`)
    await ctx.close()
  }
  note("Puzzle number by time zone (expect all equal)", nums.join("; "))

  // 4. Midnight rollover
  {
    const ctx = await browser.newContext({ timezoneId: "UTC" })
    const page = await ctx.newPage()
    await page.clock.install({ time: new Date(`${DATE}T23:59:00Z`) })
    await page.goto(BASE)
    await start(page, "easy")
    await page.clock.fastForward("02:00")
    await solveRest(page, "easy", false)
    await page.reload()
    await page.getByRole("button", { name: /^easy/i }).first().click()
    await page.waitForTimeout(600)
    note("Next day's Easy playable after finishing yesterday's after midnight (expect yes)", (await page.locator("text=View Mode").count()) ? "no" : "yes")
    await ctx.close()
  }

  // 5. Puzzle download fails
  {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    await page.route("**/puzzles/**", (r) => r.fulfill({ status: 500, body: "" }))
    await page.goto(BASE)
    await page.getByRole("button", { name: /^medium/i }).first().click()
    await page.waitForTimeout(1500)
    note("Failed download shows an error (expect yes)", (await page.locator("text=/couldn.t load|try again|retry/i").count()) ? "yes" : "no")
    await shot(page, "fetch-failure")
    await ctx.close()
  }

  // 6. Keyboard only
  {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    await page.goto(BASE)
    await start(page, "easy")
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press("Tab")
      if (await page.evaluate(() => !!document.activeElement?.closest("svg"))) break
    }
    for (const k of ["ArrowDown", "ArrowRight", "ArrowRight"]) await page.keyboard.press(k)
    for (const d of "123456789") await page.keyboard.press(d)
    const progress = JSON.parse((await page.evaluate(() => localStorage.getItem("tridoku-game-state"))) || "{}")
    note("Keyboard-only entry possible (expect yes)", progress.easy?.userCells?.length ? "yes" : "no")
    await ctx.close()
  }

  // 7. Small phone and reduced motion
  {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 640 }, hasTouch: true, isMobile: true, reducedMotion: "reduce" })
    const page = await ctx.newPage()
    await page.goto(BASE)
    await start(page, "hard")
    await page.evaluate(() => window.scrollTo(0, 0)) // measure what a player sees on arrival
    const box = await page.getByRole("button", { name: "Enter 9" }).boundingBox()
    note("Number pad fully visible at 360×640 (expect yes)", box && box.y + box.height <= 640 ? "yes" : `no (bottom at ${Math.round(box.y + box.height)} px)`)
    // TRI-090: a tip must not push the pad off screen
    await page.getByRole("button", { name: "Pencil", exact: true }).tap()
    await page.waitForTimeout(200)
    const clear = await page.getByRole("button", { name: "Clear cell" }).boundingBox()
    note("Number pad fully visible at 360×640 with the pencil tip (expect yes)", clear && clear.y + clear.height <= 640 ? "yes" : `no (bottom at ${Math.round(clear.y + clear.height)} px)`)
    await page.getByRole("button", { name: "Pen", exact: true }).tap()
    await page.locator(CELL).nth(2).locator("polygon").first().tap({ force: true })
    const anim = await page.evaluate(() => { const el = document.querySelector(".selected-cell"); return el ? getComputedStyle(el).animationName : "none" })
    note("Selection animation with reduced motion (expect none)", anim)
    await shot(page, "mobile-360")
    await ctx.close()
  }

  // 8. Win rate counts unfinished puzzles (TRI-007)
  {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    await page.goto(BASE)
    await start(page, "medium")
    const { puzzle, solution } = T.medium
    const first = puzzle.indexOf("0")
    await enter(page, first, solution[first], false)
    await page.getByRole("button", { name: "Statistics" }).click()
    await page.getByRole("tab", { name: "Medium" }).click()
    const text = (await page.locator("[role=dialog]").innerText()).replace(/\s+/g, " ")
    note("Stats after starting one Medium puzzle (expect 1 played, 0 win %)", text.match(/(\d+) Played (\d+) Win %/)?.slice(1).join(" played, ") + " win %")
    await ctx.close()
  }

  // 8b. iPhone 13 visible area: pad on screen and board unmoved with the pencil hint and the fallback notice (TRI-090)
  for (const [label, ahead] of [["pencil tip", 0], ["fallback notice", 30]]) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 664 }, hasTouch: true, isMobile: true })
    const page = await ctx.newPage()
    if (ahead) await page.clock.install({ time: new Date(Date.now() + ahead * 864e5) })
    await page.goto(BASE)
    await start(page, "easy")
    await page.evaluate(() => window.scrollTo(0, 0))
    const boardBox = () => page.locator(CELL).first().boundingBox()
    const before = await boardBox()
    if (!ahead) await page.getByRole("button", { name: "Pencil", exact: true }).tap()
    await page.waitForTimeout(400)
    await page.evaluate(() => window.scrollTo(0, 0))
    const after = await boardBox()
    note(`Board stays put at 390×664 with the ${label} (expect yes)`, ahead ? "n/a (notice shows on load)" : Math.abs(after.y - before.y) < 1 && Math.abs(after.width - before.width) < 1 ? "yes" : `no (moved ${Math.round(after.y - before.y)} px)`)
    const clear = await page.getByRole("button", { name: "Clear cell" }).boundingBox()
    note(`Number pad fully visible at 390×664 with the ${label} (expect yes)`, clear && clear.y + clear.height <= 664 ? "yes" : `no (bottom at ${Math.round(clear.y + clear.height)} px)`)
    await shot(page, `iphone13-${label.replace(" ", "-")}`)
    await ctx.close()
  }

  // 9. Missing date: most recent puzzle with a notice (TRI-010)
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const page = await ctx.newPage()
    await page.clock.install({ time: new Date(Date.now() + 30 * 864e5) })
    await page.goto(BASE)
    await start(page, "easy")
    const notice = await page.locator("[role=status]", { hasText: "isn't ready" }).first().innerText().catch(() => "")
    note("30 days ahead (no puzzle published): notice shown (expect yes)", notice ? `yes: "${notice}"` : "no")
    await shot(page, "fallback-notice")
    await ctx.close()
  }

  // 10. Retry recovers after a failed download (TRI-011)
  {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    let fail = true
    await page.route("**/puzzles/**", (r) => (fail ? r.fulfill({ status: 503, body: "" }) : r.continue()))
    await page.goto(BASE)
    await page.getByRole("button", { name: /^easy/i }).first().click()
    await page.getByRole("button", { name: "Retry" }).waitFor()
    fail = false
    await page.getByRole("button", { name: "Retry" }).click()
    const loaded = await page.locator(CELL).first().waitFor({ timeout: 5000 }).then(() => true).catch(() => false)
    note("Retry loads the puzzle once the server recovers (expect yes)", loaded ? "yes" : "no")
    await ctx.close()
  }

  fs.writeFileSync(path.join(OUT, "results.md"), `# Play-through results (${DATE})\n\nBase URL: ${BASE}\n\n${log.join("\n")}\n`)
  console.log(`\nSaved screenshots and results.md to ${OUT}`)
  await browser.close()
})().catch((e) => { console.error(e); process.exit(1) })

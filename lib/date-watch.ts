// Notices when the local date changes in a tab left open past midnight (TRI-086):
// checks every minute, and whenever the tab regains focus or becomes visible
// (timers are slowed or paused in background tabs).

import { todayKey, type DateKey } from "@/lib/dates"

export function watchDateChange(onChange: (today: DateKey) => void, intervalMs = 60_000): () => void {
  if (typeof window === "undefined") return () => {}
  let last = todayKey()
  const check = () => {
    const today = todayKey()
    if (today === last) return
    last = today
    onChange(today)
  }
  const timer = setInterval(check, intervalMs)
  window.addEventListener("focus", check)
  document.addEventListener("visibilitychange", check)
  return () => {
    clearInterval(timer)
    window.removeEventListener("focus", check)
    document.removeEventListener("visibilitychange", check)
  }
}

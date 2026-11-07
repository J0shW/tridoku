import { afterEach, describe, expect, it, vi } from "vitest"
import { addDays, daysBetween, fromDateKey, normalizeDateKey, toDateKey, todayKey } from "@/lib/dates"

afterEach(() => vi.useRealTimers())

describe("toDateKey", () => {
  it("zero-pads single-digit months and days", () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe("2026-01-05")
    expect(toDateKey(new Date(2026, 10, 7))).toBe("2026-11-07")
  })

  it("uses the local calendar date, not UTC", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 10, 6, 23, 59)) // 23:59 local
    expect(todayKey()).toBe("2026-11-06")
  })
})

describe("normalizeDateKey", () => {
  it("pads older unpadded keys", () => {
    expect(normalizeDateKey("2026-11-5")).toBe("2026-11-05")
    expect(normalizeDateKey("2026-1-9")).toBe("2026-01-09")
  })
  it("rejects junk", () => {
    expect(normalizeDateKey(null)).toBeNull()
    expect(normalizeDateKey("yesterday")).toBeNull()
  })
})

describe("daysBetween", () => {
  it("counts consecutive days on single-digit dates", () => {
    for (let d = 1; d < 9; d++) {
      expect(daysBetween(`2026-11-0${d}`, `2026-11-0${d + 1}`)).toBe(1)
    }
  })
  it("crosses month and year boundaries", () => {
    expect(daysBetween("2026-10-31", "2026-11-01")).toBe(1)
    expect(daysBetween("2026-12-31", "2027-01-01")).toBe(1)
    expect(daysBetween("2028-02-28", "2028-02-29")).toBe(1)
  })
  it("is 1 across daylight-saving changes", () => {
    expect(daysBetween("2026-03-08", "2026-03-09")).toBe(1) // US spring forward
    expect(daysBetween("2026-11-01", "2026-11-02")).toBe(1) // US fall back
    expect(daysBetween("2026-03-29", "2026-03-30")).toBe(1) // EU spring forward
  })
  it("reports gaps and same day", () => {
    expect(daysBetween("2026-11-05", "2026-11-07")).toBe(2)
    expect(daysBetween("2026-11-07", "2026-11-07")).toBe(0)
  })
  it("accepts older unpadded keys", () => {
    expect(daysBetween("2026-11-5", "2026-11-06")).toBe(1)
  })
})

describe("addDays / fromDateKey", () => {
  it("round-trips", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01")
    expect(toDateKey(fromDateKey("2026-03-08"))).toBe("2026-03-08")
  })
})

describe("dateKeyInZone (TRI-038)", () => {
  it("gives the calendar date in another zone", async () => {
    const { dateKeyInZone } = await import("@/lib/dates")
    const instant = new Date("2026-11-08T05:30:00Z") // 22:30 on the 7th in Edmonton
    expect(dateKeyInZone(instant, "America/Edmonton")).toBe("2026-11-07")
    expect(dateKeyInZone(instant, "Asia/Tokyo")).toBe("2026-11-08")
  })
})

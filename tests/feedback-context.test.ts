// TRI-043: the feedback form's hidden fields.
import { describe, expect, it } from "vitest"
import { deviceType, feedbackFields, feedbackUrl } from "@/lib/feedback-context"

describe("feedback context (TRI-043)", () => {
  it("describes the puzzle on screen", () => {
    expect(feedbackFields({ puzzleDate: "2026-11-08", difficulty: "hard", solved: false, device: "phone", appVersion: "abc1234" })).toEqual({
      puzzle_number: "312",
      puzzle_date: "2026-11-08",
      difficulty: "hard",
      solved: "no",
      device_type: "phone",
      app_version: "abc1234",
    })
  })

  it("says none when no puzzle is open", () => {
    const f = feedbackFields({ puzzleDate: null, difficulty: null, solved: false, device: "desktop", appVersion: "dev" })
    expect(f).toMatchObject({ puzzle_number: "none", puzzle_date: "none", difficulty: "none", solved: "none" })
  })

  it("classifies devices", () => {
    expect(deviceType(390, true)).toBe("phone")
    expect(deviceType(820, true)).toBe("tablet")
    expect(deviceType(820, false)).toBe("desktop")
    expect(deviceType(1440, false)).toBe("desktop")
  })

  it("builds the form's own URL with the same fields", () => {
    expect(feedbackUrl({ difficulty: "easy", solved: "yes" })).toBe("https://tally.so/r/44qzGB?difficulty=easy&solved=yes")
  })
})

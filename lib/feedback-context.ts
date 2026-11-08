// Context sent with the Tally feedback form as hidden fields (TRI-043), so each
// response says which puzzle, difficulty and device it came from. The field names
// must match hidden fields created in the Tally form editor.

import type { DateKey } from "@/lib/dates"
import { getPuzzleNumber, type Difficulty } from "@/lib/tridoku"

export const FEEDBACK_FORM_ID = "44qzGB"

export type DeviceType = "phone" | "tablet" | "desktop"

/** Rough device class from the viewport and the main pointer. */
export function deviceType(viewportWidth: number, coarsePointer: boolean): DeviceType {
  if (viewportWidth < 640) return "phone"
  if (coarsePointer && viewportWidth < 1200) return "tablet"
  return "desktop"
}

export interface FeedbackContext {
  puzzleDate: DateKey | null
  difficulty: Difficulty | null
  solved: boolean
  device: DeviceType
  appVersion: string
}

export function feedbackFields({ puzzleDate, difficulty, solved, device, appVersion }: FeedbackContext): Record<string, string> {
  return {
    puzzle_number: puzzleDate ? String(getPuzzleNumber(puzzleDate)) : "none",
    puzzle_date: puzzleDate ?? "none",
    difficulty: difficulty ?? "none",
    solved: difficulty ? (solved ? "yes" : "no") : "none",
    device_type: device,
    app_version: appVersion,
  }
}

/** The form's own page, with the same fields in the URL (used if the popup script isn't loaded). */
export function feedbackUrl(fields: Record<string, string>): string {
  return `https://tally.so/r/${FEEDBACK_FORM_ID}?${new URLSearchParams(fields).toString()}`
}

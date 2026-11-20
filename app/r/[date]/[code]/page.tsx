// A shared Mountain result (TRI-106): /r/2026-11-20/e192-m400-h521. Chat apps read the
// metadata and show a lift-ticket preview of those times; a person who taps it lands on
// the game straight away.

import type { Metadata } from "next"
import { normalizeDateKey } from "@/lib/dates"
import { decodeRunTimes, encodeRunTimes, RUN_SHAPE } from "@/lib/share"
import { formatTime, getPuzzleNumber } from "@/lib/tridoku"
import { DIFFICULTIES } from "@/lib/stats"
import { OG_IMAGE_SIZE } from "@/lib/og"
import { GoToGame } from "./go-to-game"

type Params = Promise<{ date: string; code: string }>

const GAME = "/?utm_source=share&utm_content=mountain"

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { date: rawDate, code } = await params
  const date = normalizeDateKey(rawDate)
  const times = decodeRunTimes(code)
  if (!date || encodeRunTimes(times) === "") return { title: "Daily Tridoku", robots: { index: false } }
  const runs = DIFFICULTIES.filter((d) => times[d] != null).map((d) => `${RUN_SHAPE[d]} ${formatTime(times[d]!)}`).join("  ")
  const title = `Daily Tridoku #${getPuzzleNumber(date)}`
  const image = { url: `/og/ticket?date=${date}&t=${encodeRunTimes(times)}`, ...OG_IMAGE_SIZE, alt: `A lift ticket for Daily Tridoku #${getPuzzleNumber(date)}: ${runs}` }
  return {
    title,
    description: `${runs}. Sudoku on a triangle, three new runs every day.`,
    robots: { index: false, follow: false },
    openGraph: { title, description: runs, images: [image], type: "website", siteName: "Tridoku" },
    twitter: { card: "summary_large_image", title, description: runs, images: [image] },
  }
}

export default function SharedResult() {
  return <GoToGame href={GAME} />
}

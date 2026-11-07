// Social preview image settings, shared by app/og/route.tsx and app/layout.tsx (TRI-038).

import { dateKeyInZone, type DateKey } from "@/lib/dates"

export const OG_IMAGE_SIZE = { width: 1200, height: 630 }

/**
 * Link previews are made on the server, which has no player time zone. The image
 * shows the puzzle for this zone's date (the owner's), so it changes at midnight
 * Mountain Time. Players elsewhere may see the previous or next day's number.
 */
export const OG_TIME_ZONE = "America/Edmonton"

export function ogImagePath(date: DateKey = dateKeyInZone(new Date(), OG_TIME_ZONE)): string {
  return `/og?date=${date}`
}

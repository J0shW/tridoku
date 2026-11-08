// /sitemap.xml (TRI-039): the pages worth finding in search.

import type { MetadataRoute } from "next"

const SITE = "https://www.tridokupuzzle.com"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE}/how-to-play`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE}/bts`, changeFrequency: "yearly", priority: 0.4 },
  ]
}

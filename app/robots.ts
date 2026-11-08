// /robots.txt (TRI-039). Production lets search engines in, except for the test page
// and the analytics proxy; preview and development builds keep everything out.

import type { MetadataRoute } from "next"
import { IS_PRODUCTION } from "@/lib/app-env"

const SITE = "https://www.tridokupuzzle.com"

export default function robots(): MetadataRoute.Robots {
  if (!IS_PRODUCTION) return { rules: { userAgent: "*", disallow: "/" } }
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/test", "/p/"] },
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  }
}

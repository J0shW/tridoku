// TRI-039: robots.txt keeps previews out of search and blocks /test in production.
import { afterEach, describe, expect, it, vi } from "vitest"

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

async function robotsFor(env: string) {
  vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", env)
  vi.resetModules()
  return (await import("@/app/robots")).default()
}

describe("robots.txt (TRI-039)", () => {
  it("lets search engines in on production, except /test and the analytics proxy", async () => {
    const r = await robotsFor("production")
    expect(r.rules).toEqual({ userAgent: "*", allow: "/", disallow: ["/test", "/p/"] })
    expect(r.sitemap).toBe("https://www.tridokupuzzle.com/sitemap.xml")
  })

  it("keeps preview builds out entirely", async () => {
    expect((await robotsFor("preview")).rules).toEqual({ userAgent: "*", disallow: "/" })
  })
})

describe("sitemap.xml (TRI-039)", () => {
  it("lists the game and the how-to-play page", async () => {
    const urls = (await import("@/app/sitemap")).default().map((e) => e.url)
    expect(urls).toContain("https://www.tridokupuzzle.com/")
    expect(urls).toContain("https://www.tridokupuzzle.com/how-to-play")
  })
})

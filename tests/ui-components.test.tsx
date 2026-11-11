// TRI-089: the core components expose the right roles, names and states.

import { describe, expect, it } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { Button, IconButton, Pill } from "@/components/ui/button"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { Notice } from "@/components/ui/notice"
import { Badge, StatTile } from "@/components/ui/badge"

const html = (node: React.ReactElement) => renderToStaticMarkup(node)
const noop = () => {}

describe("Button", () => {
  it("is a real button that doesn't submit forms by default", () => {
    expect(html(<Button>Share</Button>)).toMatch(/^<button[^>]*type="button"/)
  })

  it("marks loading for assistive tech and keeps the label", () => {
    const out = html(<Button loading>Share</Button>)
    expect(out).toContain('aria-busy="true"')
    expect(out).toContain("Share")
  })

  it("passes disabled through", () => {
    expect(html(<Button disabled>Share</Button>)).toContain("disabled")
  })

  it("can render a link with button styling", () => {
    const out = html(<Button asChild><a href="#rules">Play</a></Button>)
    expect(out).toMatch(/^<a [^>]*href="#rules"/)
    expect(out).not.toContain('type="button"')
  })
})

describe("IconButton", () => {
  it("always has an accessible name", () => {
    const out = html(<IconButton label="Statistics"><svg /></IconButton>)
    expect(out).toContain('aria-label="Statistics"')
    expect(out).toContain('type="button"')
  })
})

describe("Pill", () => {
  it("is a toggle only when pressed is given", () => {
    expect(html(<Pill pressed={true}>Check</Pill>)).toContain('aria-pressed="true"')
    expect(html(<Pill pressed={false}>Check</Pill>)).toContain('aria-pressed="false"')
    expect(html(<Pill>Undo</Pill>)).not.toContain("aria-pressed")
  })
})

describe("SegmentedControl", () => {
  const segments = [
    { value: "pen", label: "Pen" },
    { value: "pencil", label: "Pencil" },
  ] as const

  it("as a group, names itself and marks the pressed segment", () => {
    const out = html(<SegmentedControl label="Input mode" segments={[...segments]} value="pencil" onChange={noop} />)
    expect(out).toMatch(/role="group"[^>]*aria-label="Input mode"/)
    expect(out).toMatch(/aria-pressed="false"[^>]*>Pen</)
    expect(out).toMatch(/aria-pressed="true"[^>]*>Pencil</)
    expect(out).not.toContain('role="tab"')
  })

  it("as a tablist, marks the selected tab and keeps only it in the tab order", () => {
    const out = html(<SegmentedControl label="Difficulty" role="tablist" segments={[...segments]} value="pen" onChange={noop} />)
    expect(out).toMatch(/role="tablist"[^>]*aria-label="Difficulty"/)
    expect(out.match(/role="tab"/g)).toHaveLength(2)
    expect(out).toMatch(/role="tab" aria-selected="true"[^>]*>Pen</)
    expect(out).toMatch(/role="tab" aria-selected="false" tabindex="-1"[^>]*>Pencil</)
  })
})

describe("Notice", () => {
  it("is a status, and an alert when it's an error", () => {
    expect(html(<Notice>Tip</Notice>)).toMatch(/^<div role="status"/)
    expect(html(<Notice tone="danger">Couldn&apos;t load</Notice>)).toMatch(/^<div role="alert"/)
  })

  it("has a named dismiss button only when it can be dismissed", () => {
    expect(html(<Notice onDismiss={noop}>Tip</Notice>)).toContain('aria-label="Dismiss"')
    expect(html(<Notice>Tip</Notice>)).not.toContain("Dismiss")
  })

  it("hides its decorative icon from screen readers", () => {
    expect(html(<Notice>Tip</Notice>)).toMatch(/<svg[^>]*aria-hidden="true"/)
  })
})

describe("Badge and StatTile", () => {
  it("render their content", () => {
    expect(html(<Badge tone="success">✓</Badge>)).toContain("✓")
    const tile = html(<StatTile value={7} label="Day streak" />)
    expect(tile).toContain(">7<")
    expect(tile).toContain("Day streak")
  })
})

describe("class merging", () => {
  it("keeps a colour class next to a named text size (tailwind-merge config)", () => {
    const out = html(<Button>Share</Button>)
    expect(out).toContain("text-on-action")
    expect(out).toContain("text-body")
    const pill = html(<Pill pressed={true}>Check</Pill>)
    expect(pill).toContain("text-on-action")
    expect(pill).toContain("text-label")
  })
})

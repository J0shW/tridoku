"use client"

import { useState } from "react"
import { Check, Clock, MoreHorizontal, Pause, Pen, Pencil, Play, Share2, Undo2, BarChart3, HelpCircle, X } from "lucide-react"
import { Button, IconButton, Pill } from "@/components/ui/button"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { Notice } from "@/components/ui/notice"
import { Badge, StatTile } from "@/components/ui/badge"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-label-sm font-semibold uppercase tracking-wide text-fg-muted">{title}</h2>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </section>
  )
}

function Sheet({ theme }: { theme: "light" | "dark" }) {
  const [mode, setMode] = useState<"pen" | "pencil">("pen")
  const [tab, setTab] = useState<"rules" | "tips">("rules")
  const [diff, setDiff] = useState<"easy" | "medium" | "hard">("medium")
  const [check, setCheck] = useState(false)
  const [tip, setTip] = useState(true)

  return (
    <div className={`${theme === "dark" ? "dark" : ""} min-w-0 flex-1`}>
      <div className="space-y-8 rounded-dialog bg-bg p-6 text-fg">
        <h1 className="text-heading font-bold">{theme === "dark" ? "Dark" : "Light"}</h1>

        <Section title="Button · variants">
          <Button><Share2 aria-hidden="true" />Share result</Button>
          <Button variant="secondary">Next: Medium</Button>
          <Button variant="ghost"><HelpCircle aria-hidden="true" />How to play</Button>
          <Button variant="destructive">Reset puzzle</Button>
          <Button variant="link">Buy me a coffee</Button>
        </Section>

        <Section title="Button · sizes, shape and states">
          <Button size="sm">Retry</Button>
          <Button>Medium</Button>
          <Button size="lg"><Play aria-hidden="true" />Play today’s puzzle</Button>
          <Button shape="pill"><Play aria-hidden="true" />Resume</Button>
          <Button disabled>Disabled</Button>
          <Button loading>Sharing</Button>
        </Section>

        <Section title="IconButton">
          <IconButton label="Statistics"><BarChart3 aria-hidden="true" /></IconButton>
          <IconButton label="Copy result" variant="secondary"><Share2 aria-hidden="true" /></IconButton>
          <IconButton label="Dismiss" size="sm"><X aria-hidden="true" /></IconButton>
          <IconButton label="Disabled" disabled><HelpCircle aria-hidden="true" /></IconButton>
        </Section>

        <Section title="Pill · board corners">
          <Pill aria-label="Pause, time 04:12"><Pause className="fill-current" aria-hidden="true" />04:12</Pill>
          <Pill disabled aria-label="Time 04:12"><Clock aria-hidden="true" />04:12</Pill>
          <Pill><Undo2 aria-hidden="true" />Undo</Pill>
          <Pill pressed={check} onClick={() => setCheck((c) => !c)}><Check aria-hidden="true" />Check</Pill>
          <Pill iconOnly aria-label="More"><MoreHorizontal aria-hidden="true" /></Pill>
        </Section>

        <Section title="SegmentedControl">
          <SegmentedControl
            label="Input mode"
            segments={[
              { value: "pen", label: "Pen", icon: <Pen aria-hidden="true" /> },
              { value: "pencil", label: "Pencil", icon: <Pencil aria-hidden="true" /> },
            ]}
            value={mode}
            onChange={setMode}
          />
          <SegmentedControl label="How to play" role="tablist" segments={[{ value: "rules", label: "Rules" }, { value: "tips", label: "Tips" }]} value={tab} onChange={setTab} />
          <SegmentedControl
            label="Difficulty"
            role="tablist"
            fill
            segments={[
              { value: "easy", label: "Easy" },
              { value: "medium", label: "Medium" },
              { value: "hard", label: "Hard" },
            ]}
            value={diff}
            onChange={setDiff}
          />
          <SegmentedControl label="Disabled" segments={[{ value: "a", label: "Pen" }, { value: "b", label: "Pencil" }]} value="a" onChange={() => {}} disabled />
        </Section>

        <div className="space-y-3">
          <h2 className="text-label-sm font-semibold uppercase tracking-wide text-fg-muted">Notice</h2>
          {tip && <Notice onDismiss={() => setTip(false)}>Stuck? A digit just outside a region rules out every cell it touches inside it.</Notice>}
          <Notice tone="warning">Today’s puzzle isn’t ready yet, so this is the one from 13 November.</Notice>
          <Notice tone="danger" action={<Button size="sm" variant="secondary">Retry</Button>}>Couldn’t load today’s puzzle. Check your connection.</Notice>
          <Notice tone="success" action={<Button size="sm">Share result</Button>}>You solved this puzzle today.</Notice>
        </div>

        <Section title="Badge and StatTile">
          <Badge tone="success"><Check aria-hidden="true" /></Badge>
          <Badge>12:40</Badge>
          <div className="grid w-full max-w-sm grid-cols-3 gap-2">
            <StatTile value={7} label="Day streak" />
            <StatTile value={9} label="Best streak" />
            <StatTile value={31} label="Solved" />
          </div>
        </Section>
      </div>
    </div>
  )
}

export function ComponentSheet() {
  return (
    <main className="min-h-screen bg-surface-sunken p-4 sm:p-8">
      <p className="mb-4 text-label text-fg-muted">
        Design-system components (TRI-089). Not used on the game screens yet. Hover, press and Tab to see the states.
      </p>
      <div className="flex flex-col gap-6 lg:flex-row">
        <Sheet theme="light" />
        <Sheet theme="dark" />
      </div>
    </main>
  )
}

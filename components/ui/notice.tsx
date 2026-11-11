// Notice (design system §3.6, TRI-089): an inline message in four tones, for places with no
// board (the welcome screen, load errors). Floating tips use TipBanner instead, so nothing
// ever moves the board (TRI-090).

import * as React from "react"
import { AlertCircle, Check, Info, Lightbulb, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { IconButton } from "@/components/ui/button"

type Tone = "info" | "warning" | "danger" | "success"

const TONE: Record<Tone, { box: string; icon: string; Icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }> }> = {
  info: { box: "bg-fg/5 border-border", icon: "text-fg-muted", Icon: Lightbulb },
  warning: { box: "bg-warning/8 border-warning/30", icon: "text-warning", Icon: Info },
  danger: { box: "bg-danger/8 border-danger/30", icon: "text-danger", Icon: AlertCircle },
  success: { box: "bg-success/8 border-success/30", icon: "text-success", Icon: Check },
}

interface NoticeProps {
  tone?: Tone
  children: React.ReactNode
  /** An inline action, such as a Retry button or a "Show me" link. */
  action?: React.ReactNode
  onDismiss?: () => void
  className?: string
}

export function Notice({ tone = "info", children, action, onDismiss, className }: NoticeProps) {
  const t = TONE[tone]
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      data-tone={tone}
      className={cn(
        "flex items-start gap-2.5 rounded-card border py-2.5 pl-3 text-label text-fg",
        onDismiss ? "pr-1.5" : "pr-3",
        t.box,
        className,
      )}
    >
      <t.Icon className={cn("mt-0.5 size-4 shrink-0", t.icon)} aria-hidden={true} />
      <div className="flex-1 text-pretty">{children}</div>
      {action && <div className="shrink-0 self-center">{action}</div>}
      {onDismiss && (
        <IconButton label="Dismiss" size="sm" className="-my-1 text-fg-muted" onClick={onDismiss}>
          <X aria-hidden="true" />
        </IconButton>
      )}
    </div>
  )
}

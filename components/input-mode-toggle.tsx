"use client"

import { Pen, Pencil } from "lucide-react"
import { SegmentedControl } from "@/components/ui/segmented-control"
import type { InputMode } from "@/hooks/use-tridoku"

interface InputModeToggleProps {
  mode: InputMode
  onModeChange: (mode: InputMode) => void
  disabled?: boolean
}

/** Pen or Pencil, on the shared segmented control (TRI-093): 44 px to touch. */
export function InputModeToggle({ mode, onModeChange, disabled }: InputModeToggleProps) {
  return (
    <SegmentedControl<InputMode>
      label="Input mode"
      value={mode}
      onChange={onModeChange}
      disabled={disabled}
      segments={[
        {
          value: "pen",
          label: "Pen",
          icon: <Pen aria-hidden="true" />,
          // The theme's own "on" segment colour (Mountain's night mode lifts it off the track)
          selectedClassName: "bg-segment-on text-fg shadow-thumb ring-1 ring-border",
        },
        {
          value: "pencil",
          label: "Pencil",
          icon: <Pencil aria-hidden="true" />,
          // Pencil is the special mode, so it shows strongly when on (TRI-090).
          // Classic: ink. Mountain: a pale run tint with a coloured border (TRI-101)
          selectedClassName: "bg-toggle-on text-toggle-on-fg shadow-[inset_0_0_0_1.5px_var(--toggle-on-border)]",
        },
      ]}
    />
  )
}

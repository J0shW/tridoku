"use client"

// DropdownMenu (design system §3.7, TRI-093): Radix's menu, so it opens from the keyboard,
// moves with the arrow keys, closes on Escape or a tap outside, and returns focus to the
// button that opened it. Items are 44 px tall.

import * as React from "react"
import * as Menu from "@radix-ui/react-dropdown-menu"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const DropdownMenu = Menu.Root
const DropdownMenuTrigger = Menu.Trigger
const DropdownMenuRadioGroup = Menu.RadioGroup

function DropdownMenuContent({ className, sideOffset = 8, align = "end", ...props }: React.ComponentProps<typeof Menu.Content>) {
  return (
    <Menu.Portal>
      <Menu.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        align={align}
        className={cn(
          "z-50 min-w-52 rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg",
          "data-[state=open]:motion-safe:animate-in data-[state=open]:motion-safe:fade-in-0 data-[state=open]:motion-safe:zoom-in-95",
          className,
        )}
        {...props}
      />
    </Menu.Portal>
  )
}

const ITEM =
  "relative flex h-11 w-full cursor-default select-none items-center gap-2.5 rounded-lg px-2.5 text-left text-sm font-medium outline-none data-[highlighted]:bg-secondary data-[disabled]:pointer-events-none data-[disabled]:opacity-45 [&_svg]:size-[18px] [&_svg]:shrink-0"

function DropdownMenuItem({ className, tone, ...props }: React.ComponentProps<typeof Menu.Item> & { tone?: "danger" }) {
  return <Menu.Item data-slot="dropdown-menu-item" className={cn(ITEM, tone === "danger" && "text-danger", className)} {...props} />
}

function DropdownMenuRadioItem({ className, children, ...props }: React.ComponentProps<typeof Menu.RadioItem>) {
  return (
    <Menu.RadioItem data-slot="dropdown-menu-radio-item" className={cn(ITEM, className)} {...props}>
      <span className="inline-flex size-[18px] items-center justify-center">
        <Menu.ItemIndicator>
          <Check aria-hidden="true" />
        </Menu.ItemIndicator>
      </span>
      {children}
    </Menu.RadioItem>
  )
}

function DropdownMenuLabel({ className, ...props }: React.ComponentProps<typeof Menu.Label>) {
  return <Menu.Label className={cn("px-2.5 pt-1 pb-1 text-xs font-medium text-muted-foreground", className)} {...props} />
}

function DropdownMenuSeparator({ className, ...props }: React.ComponentProps<typeof Menu.Separator>) {
  return <Menu.Separator className={cn("-mx-1.5 my-1.5 h-px bg-border", className)} {...props} />
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
}

// Button, IconButton and Pill: the one way to draw a button (design system §3.1–3.3, TRI-089).
// Every size has a hit area of at least 44 px, focus shows one ink ring, hover is a neutral
// overlay (Tailwind's `hover:` only applies on devices that can hover), and pressing scales
// slightly unless reduced motion is on.

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const base = [
  "relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-semibold select-none",
  "transition-[background-color,color,border-color,transform] duration-(--dur-fast) ease-standard",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
  "active:scale-98 motion-reduce:active:scale-100",
  "disabled:pointer-events-none disabled:opacity-45 aria-busy:pointer-events-none",
  "[&_svg]:pointer-events-none [&_svg]:shrink-0",
].join(" ")

const buttonVariants = cva(base, {
  variants: {
    variant: {
      primary: "bg-action text-on-action hover:bg-action/90 active:bg-action/85",
      secondary: "border border-border-strong bg-control text-fg hover:bg-hover active:bg-press",
      ghost: "text-fg hover:bg-hover active:bg-press",
      destructive: "bg-danger-solid text-on-danger-solid hover:bg-danger-solid/90 active:bg-danger-solid/85",
      link: "text-fg underline underline-offset-4 hover:decoration-2",
    },
    size: {
      // 36 px to see, 44 px to touch
      sm: "h-9 px-3 text-label before:absolute before:-inset-y-1 before:inset-x-0 before:content-[''] [&_svg]:size-4",
      md: "h-11 px-4.5 text-body [&_svg]:size-4",
      lg: "h-13 px-5.5 text-body [&_svg]:size-5",
    },
    shape: {
      rect: "rounded-control",
      pill: "rounded-full",
    },
  },
  compoundVariants: [{ variant: "link", class: "h-auto px-1" }],
  defaultVariants: { variant: "primary", size: "md", shape: "rect" },
})

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    /** Shows a spinner in place of the leading icon and keeps the label. */
    loading?: boolean
  }

function Button({ className, variant, size, shape, asChild = false, loading = false, children, disabled, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, shape }), className)}
      disabled={asChild ? undefined : disabled}
      aria-busy={loading || undefined}
      {...(asChild ? {} : { type: props.type ?? "button" })}
      {...props}
    >
      {loading && !asChild ? (
        <>
          <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
          {React.Children.toArray(children).filter((c) => typeof c === "string" || typeof c === "number")}
        </>
      ) : (
        children
      )}
    </Comp>
  )
}

const iconButtonVariants = cva(
  [base, "rounded-full [&_svg]:size-5"].join(" "),
  {
    variants: {
      variant: {
        ghost: "text-fg hover:bg-hover active:bg-press",
        secondary: "border border-border-strong bg-control text-fg hover:bg-hover active:bg-press",
      },
      size: {
        md: "size-11",
        // 32 px to see (dismiss buttons), 44 px to touch
        sm: "size-8 before:absolute before:-inset-1.5 before:content-[''] [&_svg]:size-4",
      },
    },
    defaultVariants: { variant: "ghost", size: "md" },
  },
)

type IconButtonProps = Omit<React.ComponentProps<"button">, "aria-label"> &
  VariantProps<typeof iconButtonVariants> & {
    /** Required: an icon-only button needs a name for screen readers. */
    label: string
  }

function IconButton({ className, variant, size, label, type = "button", ...props }: IconButtonProps) {
  return (
    <button
      data-slot="icon-button"
      type={type}
      aria-label={label}
      title={label}
      className={cn(iconButtonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

const pillVariants = cva(
  [base, "h-10 gap-1.5 rounded-full border pl-3 pr-3.5 text-label tabular-nums before:absolute before:-inset-y-0.5 before:inset-x-0 before:content-[''] [&_svg]:size-4"].join(" "),
  {
    variants: {
      on: {
        false: "border-border-strong bg-control text-fg hover:bg-hover active:bg-press",
        // Toggle on. Ink for now; TRI-099 gives toggles the palette's tone.
        true: "border-action bg-action text-on-action hover:bg-action/90",
      },
      iconOnly: { true: "w-10 px-0", false: "" },
    },
    defaultVariants: { on: false, iconOnly: false },
  },
)

type PillProps = React.ComponentProps<"button"> &
  VariantProps<typeof pillVariants> & {
    /** For toggles (Check): sets aria-pressed. Leave undefined for plain actions (Undo). */
    pressed?: boolean
  }

/** The board-corner controls: timer, Undo, Check, More (design system §3.3). */
function Pill({ className, on, iconOnly, pressed, type = "button", ...props }: PillProps) {
  return (
    <button
      data-slot="pill"
      type={type}
      aria-pressed={pressed}
      className={cn(pillVariants({ on: on ?? pressed ?? false, iconOnly }), className)}
      {...props}
    />
  )
}

export { Button, buttonVariants, IconButton, iconButtonVariants, Pill, pillVariants }
export type { ButtonProps, IconButtonProps, PillProps }

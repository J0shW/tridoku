import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Teach tailwind-merge the design system's named text sizes (app/globals.css). Without
// this it reads `text-label` as a text colour and drops the real colour class, e.g.
// `text-on-action` on a primary button (TRI-089).
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        { text: ['caption', 'label-sm', 'label', 'body', 'title-sm', 'title', 'heading', 'display-sm', 'display'] },
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

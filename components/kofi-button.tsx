import { Coffee } from "lucide-react"

export function KofiButton({ className }: { className?: string }) {
  return (
    <a
      href="https://ko-fi.com/joshwhitney"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 rounded-full bg-[#00b9fe] px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 ${className ?? ""}`}
    >
      <Coffee className="h-3.5 w-3.5" />
      Support me on Ko-fi
    </a>
  )
}

import { notFound } from "next/navigation"
import { IS_PRODUCTION } from "@/lib/app-env"
import { PerformanceTest } from "./perf-test"

// Generator performance test. It runs the generator on the main thread and freezes
// the tab, so it only exists on preview and development builds.
export const metadata = { robots: { index: false, follow: false } }

export default function TestPage() {
  if (IS_PRODUCTION) notFound()
  return <PerformanceTest />
}

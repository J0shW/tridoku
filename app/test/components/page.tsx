import { notFound } from "next/navigation"
import { IS_PRODUCTION } from "@/lib/app-env"
import { ComponentSheet } from "./sheet"

// The design-system component sheet (TRI-089). Previews and development only.
export const metadata = { title: "Components · Daily Tridoku", robots: { index: false, follow: false } }

export default function ComponentsPage() {
  if (IS_PRODUCTION) notFound()
  return <ComponentSheet />
}

"use client"

import { useEffect } from "react"
import Link from "next/link"

/** Sends a person on to the game. Link-preview crawlers don't run scripts, so they read the page's metadata. */
export function GoToGame({ href }: { href: string }) {
  useEffect(() => {
    window.location.replace(href)
  }, [href])
  return (
    <main className="flex min-h-screen items-center justify-center p-6 text-center">
      <Link href={href} className="text-body font-semibold underline underline-offset-4">
        Play today&apos;s Tridoku
      </Link>
    </main>
  )
}

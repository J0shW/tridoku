import type { Metadata } from 'next'
import { Barlow, Barlow_Condensed, Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import Script from 'next/script'
import { ThemeProvider } from '@/components/theme-provider'
import { IS_PRODUCTION, DEV_CLOCK_SCRIPT } from '@/lib/app-env'
import { BOARD_THEME_SCRIPT, THEME_PICKER_ENABLED } from '@/lib/board-theme'
import { OG_IMAGE_SIZE, ogImagePath } from '@/lib/og'
import './globals.css'

// Calling the loaders registers the Geist font faces referenced in globals.css.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _geist = Geist({ subsets: ["latin"] });
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _geistMono = Geist_Mono({ subsets: ["latin"] });
// The Mountain look's type (TRI-101): Barlow for text, Barlow Condensed for signs and headings.
const barlow = Barlow({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-barlow", display: "swap" });
const barlowCondensed = Barlow_Condensed({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-barlow-condensed", display: "swap" });

const DESCRIPTION = 'A daily triangular sudoku puzzle game. Fill the triangle with digits 1-9 following unique rules!'

// Rebuilt hourly so the preview image (TRI-038) follows the date.
export const revalidate = 3600

export function generateMetadata(): Metadata {
  const image = {
    url: ogImagePath(),
    width: OG_IMAGE_SIZE.width,
    height: OG_IMAGE_SIZE.height,
    alt: "Today's Daily Tridoku: a triangular Sudoku board, partly filled",
  }
  return {
    metadataBase: new URL('https://www.tridokupuzzle.com'),
    title: 'Daily Tridoku',
    description: DESCRIPTION,
    // Keep preview and development builds out of search results.
    ...(IS_PRODUCTION ? {} : { robots: { index: false, follow: false } }),
    openGraph: {
      title: 'Daily Tridoku',
      description: DESCRIPTION,
      url: 'https://www.tridokupuzzle.com',
      siteName: 'Tridoku',
      type: 'website',
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Daily Tridoku',
      description: DESCRIPTION,
      images: [image],
    },
    icons: {
      icon: [
        {
          url: '/icon-light-32x32.png',
          media: '(prefers-color-scheme: light)',
        },
        {
          url: '/icon-dark-32x32.png',
          media: '(prefers-color-scheme: dark)',
        },
        {
          url: '/icon.svg',
          type: 'image/svg+xml',
        },
      ],
      apple: '/apple-icon.png',
    },
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${barlow.variable} ${barlowCondensed.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground">
        {THEME_PICKER_ENABLED && (
          <Script id="board-theme" strategy="beforeInteractive">
            {BOARD_THEME_SCRIPT}
          </Script>
        )}
        {!IS_PRODUCTION && (
          <Script id="dev-clock" strategy="beforeInteractive">
            {DEV_CLOCK_SCRIPT}
          </Script>
        )}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <Analytics />
        <Script
          defer
          src="/p/t.js"
          data-host-url="/p"
          data-website-id="9646cebf-b670-48a6-ad78-c9a7ddc38c63"
          data-domains="www.tridokupuzzle.com,tridokupuzzle.com"
        />
      </body>
    </html>
  )
}

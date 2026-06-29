import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import Script from 'next/script'
import { ThemeProvider } from '@/components/theme-provider'
import { KofiWidget } from '@/components/kofi-widget'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://www.tridokupuzzle.com'),
  title: 'Daily Tridoku',
  description: 'A daily triangular sudoku puzzle game. Fill the triangle with digits 1-9 following unique rules!',
  generator: 'v0.app',
  openGraph: {
    title: 'Daily Tridoku',
    description: 'A daily triangular sudoku puzzle game. Fill the triangle with digits 1-9 following unique rules!',
    url: 'https://www.tridokupuzzle.com',
    siteName: 'Tridoku',
    type: 'website',
    images: [
      {
        url: 'https://www.tridokupuzzle.com/og-image.png',
        width: 1024,
        height: 1024,
        alt: 'Tridoku - A Daily Triangular Sudoku Puzzle',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Daily Tridoku',
    description: 'A daily triangular sudoku puzzle game. Fill the triangle with digits 1-9 following unique rules!',
    images: ['https://www.tridokupuzzle.com/og-image.png'],
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <KofiWidget />
        <Analytics />
        <Script
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id="9646cebf-b670-48a6-ad78-c9a7ddc38c63"
          data-domains="www.tridokupuzzle.com,tridokupuzzle.com"
        />
      </body>
    </html>
  )
}

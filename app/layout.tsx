import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Naviss SDM — Kwara State',
  description: 'Sustainable Development Monitor for Kwara State, Nigeria. Monitor health, power, water, and road infrastructure across all 16 LGAs.',
  authors: [{ name: 'Naviss Technologies', url: 'https://naviss.com.ng' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#1A5F3F',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased">{children}</body>
    </html>
  )
}

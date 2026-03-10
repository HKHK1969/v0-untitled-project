import type React from "react"
import type { Metadata } from "next"
import { ClientLayout } from "./ClientLayout"
import "./globals.css" // Imported globals.css at the top of the file

export const metadata: Metadata = {
  title: "Apparel Supply Chain Tracker",
  description:
    "Track your apparel supply chain from design to delivery with comprehensive data management, analytics, and collaboration tools",
  keywords: "apparel, supply chain, tracking, inventory, production, analytics",
  authors: [{ name: "Supply Chain Team" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Apparel Supply Chain Tracker",
    description: "Track your apparel supply chain from design to delivery",
    type: "website",
  },
  other: {
    "theme-color": "#ffffff",
    "color-scheme": "light dark",
  },
    generator: 'v0.app'
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}

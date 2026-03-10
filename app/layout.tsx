import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ClientLayout } from "./ClientLayout"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

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
      <body className={`${inter.className} min-h-screen bg-background font-sans antialiased`}>
        {/* Skip links for keyboard navigation */}
        <div className="sr-only">
          <a
            href="#main-content"
            className="absolute top-0 left-0 bg-primary text-primary-foreground p-2 m-2 rounded focus:not-sr-only focus:z-50"
          >
            Skip to main content
          </a>
          <a
            href="#navigation"
            className="absolute top-0 left-0 bg-primary text-primary-foreground p-2 m-2 rounded focus:not-sr-only focus:z-50"
          >
            Skip to navigation
          </a>
        </div>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}

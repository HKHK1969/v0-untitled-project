import type React from "react"
import type { Metadata } from "next"
import { ClientLayout } from "./ClientLayout"
import "./globals.css"

export const metadata: Metadata = {
  title: "Apparel Supply Chain Tracker",
  description: "Track your apparel supply chain from design to delivery",
  icons: {
    icon: "/favicon.ico",
  },
    generator: 'v0.app'
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}

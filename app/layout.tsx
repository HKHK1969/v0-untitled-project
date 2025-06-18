import type React from "react"
import type { Metadata } from "next"
import { ClientLayout } from "./ClientLayout"

// Dynamic metadata hook (Recommendation 1)
export const metadata: Metadata = {
  title: "Apparel Supply Chain Tracker",
  description: "Track your apparel supply chain from design to delivery",
  icons: {
    icon: "/favicon.ico",
  },
    generator: 'v0.dev'
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return <ClientLayout>{children}</ClientLayout>
}


import './globals.css'
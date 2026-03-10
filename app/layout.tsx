import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { DataRecoveryNotification } from "@/components/data-recovery-notification"
import { DataPersistenceInitializer } from "@/components/data-persistence-initializer"
import { SonnerProvider } from "@/components/sonner-provider"
import dynamic from "next/dynamic"

const inter = Inter({ subsets: ["latin"] })

const AIAssistant = dynamic(() => import("@/components/ai-assistant"), { ssr: false })

export const metadata: Metadata = {
  title: "Sourcing Ninja - Apparel Supply Chain Tracker",
  description: "Track your apparel supply chain from design to delivery",
  icons: {
    icon: "/favicon.ico",
  },
    generator: 'v0.app'
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <DataRecoveryNotification />
          <DataPersistenceInitializer />
          <AIAssistant />
          <SonnerProvider />
        </ThemeProvider>
      </body>
    </html>
  )
}

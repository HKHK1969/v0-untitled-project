"use client"

import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { DataRecoveryNotification } from "@/components/data-recovery-notification"
import { DataPersistenceInitializer } from "@/components/data-persistence-initializer"
import { SonnerProvider } from "@/components/sonner-provider"
import dynamic from "next/dynamic"

const AIAssistant = dynamic(() => import("@/components/ai-assistant"), { ssr: false })

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
      <DataRecoveryNotification />
      <DataPersistenceInitializer />
      <AIAssistant />
      <SonnerProvider />
    </ThemeProvider>
  )
}

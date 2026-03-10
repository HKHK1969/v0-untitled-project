"use client"

import { useState, useEffect, useCallback, memo, Suspense, createContext, useContext, useMemo } from "react"
import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { DataRecoveryNotification } from "@/components/data-recovery-notification"
import { DataPersistenceInitializer } from "@/components/data-persistence-initializer"
import { SonnerProvider } from "@/components/sonner-provider"
import { ErrorBoundary } from "@/components/error-boundary"
import { AccessibilityManager } from "@/lib/accessibility-utils"
import { ErrorLogger } from "@/lib/error-handling"
import dynamic from "next/dynamic"

// Dynamically import the AIAssistant with no SSR to avoid hydration issues
const AIAssistant = dynamic(() => import("@/components/ai-assistant"), { ssr: false })

// Constants
const LOADING_DELAY = 500 // ms, for simulating loading
const APP_NAME = "Sourcing Ninja" // Could be dynamic via config or API

// Font setup
const inter = Inter({ subsets: ["latin"] })

// Enhanced Loading fallback component with accessibility
const LoadingFallback: React.FC = () => (
  <div
    className="flex min-h-screen items-center justify-center"
    role="status"
    aria-live="polite"
    aria-label={`Loading ${APP_NAME}`}
  >
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" aria-hidden="true" />
      <p className="text-lg font-medium">Loading {APP_NAME}...</p>
      <p className="text-sm text-muted-foreground mt-2">Please wait while we prepare your workspace</p>
    </div>
  </div>
)

// Props interface
interface ClientLayoutProps {
  children: React.ReactNode
}

// Global state context
interface DataContextType {
  dataInitialized: boolean
  setDataInitialized: (value: boolean) => void
  appVersion: string
  isLoading: boolean
  error: Error | null
}

const DataContext = createContext<DataContextType | undefined>(undefined)

const DataContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dataInitialized, setDataInitialized] = useState<boolean>(false)
  const [appVersion] = useState<string>("1.0.0")
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)

  // Initialize accessibility features
  useEffect(() => {
    AccessibilityManager.initialize()

    // Announce app loading
    AccessibilityManager.announceLoading(`Loading ${APP_NAME}`)

    const timer = setTimeout(() => {
      setIsLoading(false)
      AccessibilityManager.announceLoadingComplete(`${APP_NAME} is ready`)
    }, LOADING_DELAY)

    return () => clearTimeout(timer)
  }, [])

  // Handle global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyboard = (e: KeyboardEvent) => {
      // Skip to main content (Alt + M)
      if (e.altKey && e.key === "m") {
        e.preventDefault()
        const main = document.querySelector("main")
        if (main) {
          main.focus()
          AccessibilityManager.announce("Skipped to main content")
        }
      }

      // Skip to navigation (Alt + N)
      if (e.altKey && e.key === "n") {
        e.preventDefault()
        const nav = document.querySelector("nav")
        if (nav) {
          nav.focus()
          AccessibilityManager.announce("Skipped to navigation")
        }
      }
    }

    document.addEventListener("keydown", handleGlobalKeyboard)
    return () => document.removeEventListener("keydown", handleGlobalKeyboard)
  }, [])

  const value = useMemo(
    () => ({
      dataInitialized,
      setDataInitialized,
      appVersion,
      isLoading,
      error,
    }),
    [dataInitialized, appVersion, isLoading, error],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

const useDataContext = (): DataContextType => {
  const context = useContext(DataContext)
  if (!context) throw new Error("useDataContext must be used within DataContextProvider")
  return context
}

// Main layout component
const ClientLayoutComponent: React.FC<ClientLayoutProps> = ({ children }) => {
  // Enhanced error logging
  const logError = useCallback((error: Error, info: { componentStack: string }) => {
    ErrorLogger.logError(error, {
      componentStack: info.componentStack,
      level: "critical",
      context: "ClientLayout",
    })

    // Analytics integration would go here
    console.error("ClientLayout Critical Error:", error, info)
  }, [])

  // Analytics initialization
  useEffect(() => {
    console.log(`${APP_NAME} Analytics initialized`)
    // Example: window.ga('create', 'UA-XXXXX-Y', 'auto')
    // window.ga('send', 'pageview')
  }, [])

  return (
    <div className={inter.className}>
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

      <ErrorBoundary level="critical" onError={logError}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <DataContextProvider>
            <Suspense fallback={<LoadingFallback />}>
              {/* Main content wrapper */}
              <div id="main-content" tabIndex={-1}>
                {children}
              </div>

              {/* Global components */}
              <DataRecoveryNotification />
              <DataPersistenceInitializer />
              <AIAssistant />
              <SonnerProvider />
            </Suspense>
          </DataContextProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </div>
  )
}

// Memoized export with explicit typing
export const ClientLayout: React.ComponentType<ClientLayoutProps> = memo(ClientLayoutComponent)

// Export context hook for use in other components
export { useDataContext }

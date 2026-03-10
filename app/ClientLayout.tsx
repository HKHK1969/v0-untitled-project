"use client"

import { useState, useEffect, useCallback, memo, Suspense, createContext, useContext, useMemo } from "react"
import type React from "react"
import { Inter } from "next/font/google"
import { ErrorBoundary } from "react-error-boundary" // Dependency: npm install react-error-boundary
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { DataRecoveryNotification } from "@/components/data-recovery-notification"
import { DataPersistenceInitializer } from "@/components/data-persistence-initializer"
import { Button } from "@/components/ui/button"
import { SonnerProvider } from "@/components/sonner-provider"
import { AIAssistant } from "@/components/ai-assistant"

// Constants
const LOADING_DELAY = 500 // ms, for simulating loading
const APP_NAME = "Sourcing Ninja" // Could be dynamic via config or API

// Font setup
const inter = Inter({ subsets: ["latin"] })

// Error fallback component
const ErrorFallback: React.FC<{ error: Error; resetErrorBoundary: () => void }> = ({ error, resetErrorBoundary }) => {
  const handleReset = useCallback(() => {
    resetErrorBoundary()
  }, [resetErrorBoundary])

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="max-w-md text-center">
        <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
        <p className="text-muted-foreground mb-4">{error.message}</p>
        <Button onClick={handleReset}>Try Again</Button>
      </div>
    </div>
  )
}

// Loading fallback component
const LoadingFallback: React.FC = () => (
  <div className="flex min-h-screen items-center justify-center">
    <p>Loading {APP_NAME}...</p>
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
  appVersion: string // Added for dynamic content example
}

const DataContext = createContext<DataContextType | undefined>(undefined)

const DataContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dataInitialized, setDataInitialized] = useState<boolean>(false)
  const [appVersion] = useState<string>("1.0.0") // Example dynamic content (Recommendation 1)

  const value = useMemo(
    () => ({
      dataInitialized,
      setDataInitialized,
      appVersion,
    }),
    [dataInitialized, appVersion],
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
  // Error logging with potential integration (enhanced)
  const logError = useCallback((error: Error, info: { componentStack: string }) => {
    console.error("ClientLayout Error:", error, info)
    // Recommendation 2: Analytics integration
    // Example: window.ga('send', 'exception', { exDescription: error.message, exFatal: false })
  }, [])

  // Analytics initialization (Recommendation 2)
  useEffect(() => {
    console.log(`${APP_NAME} Analytics initialized`)
    // Example: window.ga('create', 'UA-XXXXX-Y', 'auto')
    // window.ga('send', 'pageview')
  }, [])

  // Accessibility live region (Recommendation 4)
  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), LOADING_DELAY)
    return () => clearTimeout(timer)
  }, [])

  // Dynamic content placeholder (Recommendation 1)
  const appVersion = "1.0.0" // Hardcoded for the layout component

  return (
    <html lang="en">
      <head>
        {/* Dynamic metadata - Recommendation 1 */}
        <title>{`${APP_NAME} v${appVersion}`}</title>
        <meta name="description" content="Track your apparel supply chain from design to delivery" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>
        <ErrorBoundary FallbackComponent={ErrorFallback} onError={logError}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <DataContextProvider>
              <Suspense fallback={<LoadingFallback />}>
                {/* Accessibility live region */}
                <div aria-live="polite" className="sr-only">
                  {isLoading ? `Loading ${APP_NAME}` : `${APP_NAME} content loaded`}
                </div>
                {children}
                {/* Lazy-loaded components could be added here - Recommendation 3 */}
                <DataRecoveryNotification />
                <DataPersistenceInitializer />
                <SonnerProvider />
                <AIAssistant />
              </Suspense>
            </DataContextProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}

// Memoized export with explicit typing
export const ClientLayout: React.ComponentType<ClientLayoutProps> = memo(ClientLayoutComponent)

// TODO: Add unit tests in a separate file (e.g., client-layout.test.tsx) - Recommendation 5
// Suggested tests:
// 1. Test renders children correctly
// 2. Test error boundary catches and displays errors
// 3. Test suspense fallback displays during loading
// 4. Test theme provider applies correct classes
// 5. Test context provides initialized state and version
// Example test file structure:
// import { render, screen } from "@testing-library/react"
// test("renders children", () => {
//   render(<ClientLayout><div>Test</div></ClientLayout>)
//   expect(screen.getByText("Test")).toBeInTheDocument()
// })
// test("context provides version", () => {
//   const TestComponent = () => {
//     const { appVersion } = useDataContext()
//     return <div>{appVersion}</div>
//   }
//   render(<ClientLayout><TestComponent /></ClientLayout>)
//   expect(screen.getByText("1.0.0")).toBeInTheDocument()
// })

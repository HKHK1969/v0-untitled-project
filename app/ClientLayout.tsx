"use client"

import { useState, useEffect, useCallback, memo, Suspense, createContext, useContext, useMemo } from "react"
import type React from "react"
import { ErrorBoundary } from "react-error-boundary"
import { ThemeProvider } from "@/components/theme-provider"
import { DataRecoveryNotification } from "@/components/data-recovery-notification"
import { DataPersistenceInitializer } from "@/components/data-persistence-initializer"
import { Button } from "@/components/ui/button"
import { SonnerProvider } from "@/components/sonner-provider"
import { AIAssistant } from "@/components/ai-assistant"

// Constants
const LOADING_DELAY = 500
const APP_NAME = "Sourcing Ninja"

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
interface ClientProvidersProps {
  children: React.ReactNode
}

// Global state context
interface DataContextType {
  dataInitialized: boolean
  setDataInitialized: (value: boolean) => void
  appVersion: string
}

const DataContext = createContext<DataContextType | undefined>(undefined)

const DataContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dataInitialized, setDataInitialized] = useState<boolean>(false)
  const [appVersion] = useState<string>("1.0.0")

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

export const useDataContext = (): DataContextType => {
  const context = useContext(DataContext)
  if (!context) throw new Error("useDataContext must be used within DataContextProvider")
  return context
}

// Client providers component (wraps children with all providers)
const ClientProvidersComponent: React.FC<ClientProvidersProps> = ({ children }) => {
  const logError = useCallback((error: Error, info: { componentStack: string }) => {
    console.error("ClientLayout Error:", error, info)
  }, [])

  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), LOADING_DELAY)
    return () => clearTimeout(timer)
  }, [])

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onError={logError}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <DataContextProvider>
          <Suspense fallback={<LoadingFallback />}>
            <div aria-live="polite" className="sr-only">
              {isLoading ? `Loading ${APP_NAME}` : `${APP_NAME} content loaded`}
            </div>
            {children}
            <DataRecoveryNotification />
            <DataPersistenceInitializer />
            <SonnerProvider />
            <AIAssistant />
          </Suspense>
        </DataContextProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export const ClientProviders: React.ComponentType<ClientProvidersProps> = memo(ClientProvidersComponent)

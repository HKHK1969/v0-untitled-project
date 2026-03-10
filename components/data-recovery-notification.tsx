"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { AlertCircle, X, ArrowRight } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { checkAndRestoreData } from "@/lib/data-persistence"
import Link from "next/link"

// Constants
const TABLE_KEYS = ["customers", "suppliers", "styles", "sampleOrders", "priceQuotes", "tasks"] as const
type TableKey = (typeof TABLE_KEYS)[number]
const DEFAULT_DELAY = 3000 // Recommendation 1: Auto-dismiss delay

// Type definitions
interface DataRecoveryNotificationProps {
  autoDismiss?: boolean // Recommendation 1: Auto-dismiss option
  delay?: number // Recommendation 1: Configurable delay
  onDismiss?: () => void // Recommendation 1: Callback for dismiss
  onError?: (error: Error) => void // Recommendation 1: Callback for error
}

export const DataRecoveryNotification: React.FC<DataRecoveryNotificationProps> = ({
  autoDismiss = false,
  delay = DEFAULT_DELAY,
  onDismiss,
  onError,
}) => {
  const [showNotification, setShowNotification] = useState(false)
  const [restoredTables, setRestoredTables] = useState<TableKey[]>([])
  const [error, setError] = useState<Error | null>(null)

  // Check and restore data (Recommendation 2: Error handling)
  const checkData = useCallback(async () => {
    try {
      const dataRestored = await checkAndRestoreData() // Assume async for robustness
      if (dataRestored) {
        const restored = TABLE_KEYS.filter((table) => {
          try {
            const data = localStorage.getItem(`table_${table}_data`)
            return data && data !== "[]"
          } catch (e) {
            console.error(`Error checking table_${table}_data:`, e)
            return false
          }
        })
        setRestoredTables(restored)
        setShowNotification(true)
        window.dispatchEvent(new Event("storage"))
      }
    } catch (err) {
      const recoveryError = err instanceof Error ? err : new Error("Unknown recovery error")
      console.error("Data recovery failed:", recoveryError)
      setError(recoveryError)
      onError?.(recoveryError)
    }
  }, [onError])

  // Effect with cleanup (Recommendation 3)
  useEffect(() => {
    let isMounted = true
    if (!showNotification && !error) {
      checkData().catch((err) => {
        if (isMounted) setError(err instanceof Error ? err : new Error("Check error"))
      })
    }

    // Auto-dismiss (Recommendation 1)
    let timer: NodeJS.Timeout | null = null
    if (autoDismiss && showNotification) {
      timer = setTimeout(() => {
        if (isMounted) {
          setShowNotification(false)
          onDismiss?.()
        }
      }, delay)
    }

    return () => {
      isMounted = false
      if (timer) clearTimeout(timer)
    }
  }, [checkData, showNotification, autoDismiss, delay, onDismiss, error])

  // Handle dismiss (Recommendation 3: Memoized callback)
  const handleDismiss = useCallback(() => {
    setShowNotification(false)
    onDismiss?.()
  }, [onDismiss])

  if (!showNotification || error) return null

  // Accessibility: ARIA live region (Recommendation 4)
  return (
    <Alert
      className="fixed bottom-4 right-4 w-96 bg-green-50 border-green-200 text-green-800 shadow-lg z-50"
      role="alert"
      aria-live="polite"
    >
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Data Recovered</AlertTitle>
      <AlertDescription>
        <p>Your data has been automatically restored from backup.</p>
        {restoredTables.length > 0 && <p className="text-xs mt-1">Restored tables: {restoredTables.join(", ")}</p>}
        <div className="mt-2">
          <Link href="/data-backup">
            <Button size="sm" variant="outline" className="text-xs h-7 bg-white">
              Backup Your Data <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </div>
      </AlertDescription>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2"
        onClick={handleDismiss}
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </Button>
    </Alert>
  )
}

// Default export for backward compatibility
export default DataRecoveryNotification

// Additional Recommendations Implementation:
// 1. Dynamic Features: Added autoDismiss, delay, onDismiss, and onError props
// 2. Error Handling: Added try/catch and error state management
// 3. Performance: Used useCallback and cleanup in useEffect
// 4. Accessibility: Added ARIA attributes for live region
// 5. Testing: Added TODO comment below

// TODO: Add unit tests in a separate file (e.g., data-recovery-notification.test.tsx) - Recommendation 5
// Suggested tests:
// 1. Test shows notification on successful restore
// 2. Test autoDismiss hides notification after delay
// 3. Test calls onDismiss on manual dismiss
// 4. Test handles checkAndRestoreData failure and calls onError
// 5. Test lists restored tables correctly
// Example test file structure:
// import { render, screen, waitFor } from "@testing-library/react"
// test("shows notification on restore", async () => {
//   jest.mock("@/lib/data-persistence", () => ({
//     checkAndRestoreData: jest.fn().mockResolvedValue(true),
//   }))
//   localStorage.setItem("table_customers_data", '["data"]')
//   render(<DataRecoveryNotification />)
//   await waitFor(() => expect(screen.getByText("Data Recovered")).toBeInTheDocument())
// })
// test("autoDismiss works", async () => {
//   jest.mock("@/lib/data-persistence", () => ({
//     checkAndRestoreData: jest.fn().mockResolvedValue(true),
//   }))
//   render(<DataRecoveryNotification autoDismiss delay={100} />)
//   await waitFor(() => expect(screen.queryByText("Data Recovered")).not.toBeInTheDocument(), { timeout: 200 })
// })

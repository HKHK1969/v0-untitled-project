"use client"

import type React from "react"

import { useEffect, useState, useCallback } from "react"
import { initDataPersistence } from "@/lib/data-persistence"

// Type definitions
interface DataPersistenceInitializerProps {
  onInitSuccess?: () => void // Recommendation 1: Callback for success
  onInitError?: (error: Error) => void // Recommendation 1: Callback for error
  delay?: number // Recommendation 1: Configurable delay
}

// Constants
const DEFAULT_DELAY = 0 // No delay by default
const INIT_LOG_MESSAGE = "Enhanced data persistence system initialized"

// Enhanced DataPersistenceInitializer
export const DataPersistenceInitializer: React.FC<DataPersistenceInitializerProps> = ({
  onInitSuccess,
  onInitError,
  delay = DEFAULT_DELAY,
}) => {
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Initialization logic with error handling (Recommendation 2)
  const initializePersistence = useCallback(async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, delay)) // Recommendation 1: Delay
      await initDataPersistence() // Assume this returns a Promise for async support
      console.log(INIT_LOG_MESSAGE)
      setIsInitialized(true)
      onInitSuccess?.()
    } catch (err) {
      const initError = err instanceof Error ? err : new Error("Unknown initialization error")
      console.error("Data persistence initialization failed:", initError)
      setError(initError)
      onInitError?.(initError)
    }
  }, [delay, onInitSuccess, onInitError])

  // Effect with cleanup (Recommendation 3)
  useEffect(() => {
    let isMounted = true
    if (!isInitialized && !error) {
      initializePersistence().catch((err) => {
        if (isMounted) setError(err instanceof Error ? err : new Error("Initialization error"))
      })
    }
    return () => {
      isMounted = false // Prevent state updates after unmount
    }
  }, [initializePersistence, isInitialized, error])

  // Accessibility: Log state for screen readers or debugging (Recommendation 4)
  useEffect(() => {
    if (isInitialized) {
      console.log("Data persistence fully initialized")
    } else if (error) {
      console.log("Data persistence initialization error:", error.message)
    }
  }, [isInitialized, error])

  // This component doesn't render anything
  return null
}

// Default export for backward compatibility
export default DataPersistenceInitializer

// Additional Recommendations Implementation:
// 1. Dynamic Features: Added onInitSuccess, onInitError, and delay props
// 2. Error Handling: Added try/catch and error state management
// 3. Performance: Used useCallback and cleanup in useEffect
// 4. Accessibility: Added logging for state changes
// 5. Testing: Added TODO comment below

// TODO: Add unit tests in a separate file (e.g., data-persistence-initializer.test.tsx) - Recommendation 5
// Suggested tests:
// 1. Test initializes successfully with default props
// 2. Test calls onInitSuccess on successful init
// 3. Test handles initDataPersistence failure and calls onInitError
// 4. Test respects delay prop
// 5. Test cleanup prevents state updates after unmount
// Example test file structure:
// import { render, waitFor } from "@testing-library/react"
// test("initializes successfully", async () => {
//   const mockInit = jest.fn().mockResolvedValue(undefined)
//   jest.mock("@/lib/data-persistence", () => ({ initDataPersistence: mockInit }))
//   render(<DataPersistenceInitializer />)
//   await waitFor(() => expect(mockInit).toHaveBeenCalled())
// })
// test("handles error", async () => {
//   const mockError = new Error("Init failed")
//   const mockInit = jest.fn().mockRejectedValue(mockError)
//   jest.mock("@/lib/data-persistence", () => ({ initDataPersistence: mockInit }))
//   const onInitError = jest.fn()
//   render(<DataPersistenceInitializer onInitError={onInitError} />)
//   await waitFor(() => expect(onInitError).toHaveBeenCalledWith(mockError))
// })

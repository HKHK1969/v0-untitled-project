"use client"

/**
 * Example Test File
 *
 * This file demonstrates testing patterns for the application.
 * Copy and adapt these patterns for your own tests.
 */

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom"
import jest from "jest" // Declare the jest variable

// Example: Testing a simple component
describe("Button Component", () => {
  it("renders with correct text", () => {
    render(<button>Click me</button>)
    expect(screen.getByText("Click me")).toBeInTheDocument()
  })

  it("calls onClick handler when clicked", async () => {
    const handleClick = jest.fn()
    render(<button onClick={handleClick}>Click me</button>)

    await userEvent.click(screen.getByText("Click me"))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it("is disabled when disabled prop is true", () => {
    render(<button disabled>Click me</button>)
    expect(screen.getByText("Click me")).toBeDisabled()
  })
})

// Example: Testing form validation
describe("Form Validation", () => {
  it("shows error message for invalid email", async () => {
    const { validateField } = await import("@/lib/validation")

    const result = validateField("invalid-email", [{ type: "required" }, { type: "email" }])

    expect(result.isValid).toBe(false)
    expect(result.errors).toContain("Please enter a valid email address")
  })

  it("sanitizes input correctly", async () => {
    const { sanitizeInput } = await import("@/lib/validation")

    const maliciousInput = '<script>alert("xss")</script>Hello'
    const sanitized = sanitizeInput(maliciousInput)

    expect(sanitized).not.toContain("<script>")
    expect(sanitized).toBe("Hello")
  })
})

// Example: Testing localStorage operations
describe("Data Persistence", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("saves data to localStorage", async () => {
    const testData = [{ id: "1", name: "Test" }]
    localStorage.setItem("table_test_data", JSON.stringify(testData))

    const saved = localStorage.getItem("table_test_data")
    expect(saved).toBeTruthy()
    expect(JSON.parse(saved!)).toEqual(testData)
  })

  it("loads data from localStorage", async () => {
    const { loadData } = await import("@/lib/data-persistence")

    const testData = [{ id: "1", name: "Test" }]
    localStorage.setItem("table_test_data", JSON.stringify(testData))

    const loaded = loadData("test")
    expect(loaded).toEqual(testData)
  })

  it("returns empty array when no data exists", async () => {
    const { loadData } = await import("@/lib/data-persistence")

    const loaded = loadData("nonexistent")
    expect(loaded).toEqual([])
  })
})

// Example: Testing async operations
describe("Async Operations", () => {
  it("handles async data loading", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: "test" }),
    })

    global.fetch = mockFetch

    const response = await fetch("/api/test")
    const data = await response.json()

    expect(data).toEqual({ data: "test" })
    expect(mockFetch).toHaveBeenCalledWith("/api/test")
  })

  it("handles errors gracefully", async () => {
    const mockFetch = jest.fn().mockRejectedValue(new Error("Network error"))
    global.fetch = mockFetch

    await expect(fetch("/api/test")).rejects.toThrow("Network error")
  })
})

// Example: Testing with React hooks
describe("Custom Hooks", () => {
  it("updates state correctly", async () => {
    const { renderHook, act } = await import("@testing-library/react")
    const { useState } = await import("react")

    const { result } = renderHook(() => useState(0))

    expect(result.current[0]).toBe(0)

    act(() => {
      result.current[1](1)
    })

    expect(result.current[0]).toBe(1)
  })
})

// Example: Testing error boundaries
describe("Error Handling", () => {
  it("logs errors correctly", async () => {
    const { ErrorLogger } = await import("@/lib/error-handling")
    const consoleSpy = jest.spyOn(console, "error").mockImplementation()

    const error = new Error("Test error")
    ErrorLogger.logError(error, "TestComponent", "error")

    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})

// Example: Testing rate limiting
describe("Rate Limiting", () => {
  it("allows requests within limit", async () => {
    const { RateLimiter } = await import("@/lib/validation")
    const limiter = new RateLimiter()

    expect(limiter.isAllowed("test-id", 3, 60000)).toBe(true)
    expect(limiter.isAllowed("test-id", 3, 60000)).toBe(true)
    expect(limiter.isAllowed("test-id", 3, 60000)).toBe(true)
  })

  it("blocks requests over limit", async () => {
    const { RateLimiter } = await import("@/lib/validation")
    const limiter = new RateLimiter()

    limiter.isAllowed("test-id", 2, 60000)
    limiter.isAllowed("test-id", 2, 60000)

    expect(limiter.isAllowed("test-id", 2, 60000)).toBe(false)
  })
})

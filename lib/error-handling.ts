export interface ErrorInfo {
  message: string
  stack?: string
  componentStack?: string
  timestamp: number
  userAgent: string
  url: string
  userId?: string
}

export class ErrorLogger {
  private static errors: ErrorInfo[] = []
  private static maxErrors = 50

  static logError(error: Error, additionalInfo?: Record<string, any>): void {
    const errorInfo: ErrorInfo = {
      message: error.message,
      stack: error.stack,
      componentStack: additionalInfo?.componentStack,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: additionalInfo?.userId,
      ...additionalInfo,
    }

    // Add to local storage for persistence
    this.errors.push(errorInfo)
    if (this.errors.length > this.maxErrors) {
      this.errors.shift()
    }

    try {
      localStorage.setItem("app_errors", JSON.stringify(this.errors))
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        console.warn("Failed to save error to localStorage:", e)
      }
    }

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Application Error:", errorInfo)
    }

    if (process.env.NODE_ENV === "production" && typeof window !== "undefined") {
      // Send to Sentry if available
      if (window.Sentry) {
        window.Sentry.captureException(error, {
          extra: additionalInfo,
          tags: {
            component: additionalInfo?.component,
            userId: additionalInfo?.userId,
          },
        })
      }
    }
  }

  static getErrors(): ErrorInfo[] {
    try {
      const stored = localStorage.getItem("app_errors")
      return stored ? JSON.parse(stored) : []
    } catch (e) {
      return this.errors
    }
  }

  static clearErrors(): void {
    this.errors = []
    try {
      localStorage.removeItem("app_errors")
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        console.warn("Failed to clear errors from localStorage:", e)
      }
    }
  }
}

// Retry mechanism for failed operations
export class RetryHandler {
  static async withRetry<T>(operation: () => Promise<T>, maxRetries = 3, delay = 1000, backoff = 2): Promise<T> {
    let lastError: Error

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error

        if (attempt === maxRetries) {
          ErrorLogger.logError(lastError, {
            context: "RetryHandler",
            attempts: attempt,
            maxRetries,
          })
          throw lastError
        }

        // Wait before retrying with exponential backoff
        await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(backoff, attempt - 1)))
      }
    }

    throw lastError!
  }
}

// Network error handling
export class NetworkErrorHandler {
  static isNetworkError(error: Error): boolean {
    return (
      error.message.includes("fetch") || error.message.includes("network") || error.message.includes("Failed to fetch")
    )
  }

  static isTimeoutError(error: Error): boolean {
    return error.message.includes("timeout") || error.name === "TimeoutError"
  }

  static getErrorMessage(error: Error): string {
    if (this.isNetworkError(error)) {
      return "Network connection error. Please check your internet connection and try again."
    }

    if (this.isTimeoutError(error)) {
      return "Request timed out. Please try again."
    }

    return error.message || "An unexpected error occurred."
  }
}

// Form validation error handling
export class ValidationErrorHandler {
  static formatValidationErrors(errors: Record<string, string[]>): string {
    const messages = Object.entries(errors).map(([field, fieldErrors]) => {
      const fieldName = field.replace(/([A-Z])/g, " $1").toLowerCase()
      return `${fieldName}: ${fieldErrors.join(", ")}`
    })

    return messages.join("; ")
  }

  static getFirstError(errors: Record<string, string[]>): string | null {
    for (const fieldErrors of Object.values(errors)) {
      if (fieldErrors.length > 0) {
        return fieldErrors[0]
      }
    }
    return null
  }
}

declare global {
  interface Window {
    Sentry?: {
      captureException: (error: Error, context?: any) => void
      captureMessage: (message: string, context?: any) => void
    }
  }
}

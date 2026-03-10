"use client"

import type React from "react"
import { Component, type ErrorInfo, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react"
import { ErrorLogger } from "@/lib/error-handling"
import { AccessibilityManager } from "@/lib/accessibility-utils"

interface Props {
  children: ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  level?: "page" | "component" | "critical"
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string | null
}

export interface ErrorFallbackProps {
  error: Error
  errorInfo: ErrorInfo | null
  resetError: () => void
  level: "page" | "component" | "critical"
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })

    // Log error
    ErrorLogger.logError(error, {
      componentStack: errorInfo.componentStack,
      level: this.props.level || "component",
      errorId: this.state.errorId,
    })

    // Announce error to screen readers
    AccessibilityManager.announceError(
      `An error occurred in the ${this.props.level || "component"}. Please try refreshing or contact support.`,
    )

    // Call custom error handler
    this.props.onError?.(error, errorInfo)
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    })
    AccessibilityManager.announce("Error cleared, content reloaded")
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return (
        <FallbackComponent
          error={this.state.error!}
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
          level={this.props.level || "component"}
        />
      )
    }

    return this.props.children
  }
}

const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError, level }) => {
  const handleReload = () => {
    if (level === "critical" || level === "page") {
      window.location.reload()
    } else {
      resetError()
    }
  }

  const handleGoHome = () => {
    window.location.href = "/"
  }

  const handleReportError = () => {
    // In a real app, this would open a support ticket or error reporting form
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    }

    console.log("Error report:", errorDetails)
    AccessibilityManager.announce("Error report generated")
  }

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4" role="alert" aria-live="assertive">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
          </div>
          <CardTitle className="text-xl">{level === "critical" ? "Critical Error" : "Something went wrong"}</CardTitle>
          <CardDescription>
            {level === "critical"
              ? "A critical error has occurred that requires a page reload."
              : "An unexpected error occurred. You can try refreshing this section or continue using other parts of the application."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <Bug className="h-4 w-4" />
            <AlertTitle>Error Details</AlertTitle>
            <AlertDescription className="font-mono text-xs break-all">{error.message}</AlertDescription>
          </Alert>

          <div className="flex flex-col gap-2">
            <Button onClick={handleReload} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              {level === "critical" ? "Reload Page" : "Try Again"}
            </Button>

            {level !== "critical" && (
              <Button variant="outline" onClick={handleGoHome} className="w-full bg-transparent">
                <Home className="mr-2 h-4 w-4" />
                Go to Homepage
              </Button>
            )}

            <Button variant="ghost" onClick={handleReportError} className="w-full text-sm">
              <Bug className="mr-2 h-4 w-4" />
              Report This Error
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export { ErrorBoundary }

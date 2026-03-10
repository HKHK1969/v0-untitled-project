"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { memo, useCallback } from "react"

// Constants for maintainability
const ALERT_BASE_CLASSES =
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground"

// Variant configuration extracted
const alertVariants = cva(ALERT_BASE_CLASSES, {
  variants: {
    variant: {
      default: "bg-background text-foreground",
      destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
      // Added for flexibility (Recommendation 1: Extensibility)
      success: "border-success/50 text-success dark:border-success [&>svg]:text-success",
    },
    size: {
      // Added for responsiveness (Recommendation 3)
      sm: "text-sm p-3 [&>svg]:top-3 [&>svg]:left-3",
      default: "",
      lg: "text-lg p-6 [&>svg]:top-5 [&>svg]:left-5",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
})

// Type definitions
interface AlertProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
  dismissible?: boolean // Recommendation 1: Add interactivity
}

// Alert component with memoization
const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, size, dismissible = false, children, ...props }, ref) => {
    const [isVisible, setIsVisible] = React.useState(true)

    // Handle dismiss (Recommendation 1)
    const handleDismiss = useCallback(() => {
      setIsVisible(false)
    }, [])

    if (!isVisible) return null

    // Error handling for children (Recommendation 2)
    const hasContent = React.Children.count(children) > 0
    if (!hasContent) {
      console.warn("Alert component requires children to render meaningful content")
    }

    return (
      <div ref={ref} role="alert" className={cn(alertVariants({ variant, size }), className)} {...props}>
        {dismissible && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-6 w-6 p-0"
            onClick={handleDismiss}
            aria-label="Dismiss alert"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        )}
        {children}
      </div>
    )
  },
)
Alert.displayName = "Alert"

// Memoized to prevent unnecessary re-renders (Recommendation 3)
const MemoizedAlert = memo(Alert)

// AlertTitle component with memoization
const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => {
    // Accessibility check (Recommendation 4)
    if (!children) {
      console.warn("AlertTitle should have content for accessibility")
    }

    return (
      <h5 ref={ref} className={cn("mb-1 font-medium leading-none tracking-tight", className)} {...props}>
        {children}
      </h5>
    )
  },
)
AlertTitle.displayName = "AlertTitle"
const MemoizedAlertTitle = memo(AlertTitle)

// AlertDescription component with memoization
const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => {
    // Accessibility check (Recommendation 4)
    if (!children) {
      console.warn("AlertDescription should have content for accessibility")
    }

    return (
      <div ref={ref} className={cn("text-sm [&_p]:leading-relaxed", className)} {...props}>
        {children}
      </div>
    )
  },
)
AlertDescription.displayName = "AlertDescription"
const MemoizedAlertDescription = memo(AlertDescription)

// Exports
export { MemoizedAlert as Alert, MemoizedAlertTitle as AlertTitle, MemoizedAlertDescription as AlertDescription }

// Additional Recommendations Implementation:
// 1. Dynamic Features: Added dismissible prop and success variant
// 2. Error Handling: Added warnings for missing content
// 3. Performance: Memoized all components and added size variant
// 4. Accessibility: Added checks and aria-label for dismiss button
// 5. Testing: Added TODO comment below

// TODO: Add unit tests in a separate file (e.g., alert.test.tsx) - Recommendation 5
// Suggested tests:
// 1. Test renders with default variant correctly
// 2. Test destructive variant applies correct classes
// 3. Test dismissible functionality hides the alert
// 4. Test size variants adjust padding and text
// 5. Test warnings are logged for missing content
// Example test file structure:
// import { render, screen, fireEvent } from "@testing-library/react"
// test("renders default alert", () => {
//   render(<Alert><AlertTitle>Test</AlertTitle></Alert>)
//   expect(screen.getByRole("alert")).toHaveClass("bg-background")
// })
// test("dismissible alert hides on click", () => {
//   render(<Alert dismissible><AlertTitle>Test</AlertTitle></Alert>)
//   fireEvent.click(screen.getByLabelText("Dismiss alert"))
//   expect(screen.queryByRole("alert")).not.toBeInTheDocument()
// })

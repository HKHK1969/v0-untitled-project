"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { memo, useCallback } from "react"

// Constants for maintainability
const BADGE_BASE_CLASSES =
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"

// Variant configuration extracted
const badgeVariants = cva(BADGE_BASE_CLASSES, {
  variants: {
    variant: {
      default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
      secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
      destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
      outline: "text-foreground",
      // Added for flexibility (Recommendation 1: Extensibility)
      success: "border-transparent bg-success text-success-foreground hover:bg-success/80",
    },
    size: {
      // Added for responsiveness (Recommendation 3)
      sm: "px-2 py-0 text-[10px]",
      default: "",
      lg: "px-3.5 py-1 text-sm",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
})

// Type definitions
export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  dismissible?: boolean // Recommendation 1: Add interactivity
}

// Badge component with forwardRef and memoization
const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, dismissible = false, children, ...props }, ref) => {
    const [isVisible, setIsVisible] = React.useState(true)

    // Handle dismiss (Recommendation 1)
    const handleDismiss = useCallback((e: React.MouseEvent) => {
      e.stopPropagation() // Prevent click events from bubbling
      setIsVisible(false)
    }, [])

    // Error handling for children (Recommendation 2)
    const hasContent = React.Children.count(children) > 0
    React.useEffect(() => {
      if (!hasContent) {
        console.warn("Badge component should have children to render meaningful content")
      }
    }, [hasContent])

    if (!isVisible) return null

    return (
      <div ref={ref} className={cn(badgeVariants({ variant, size }), className)} {...props}>
        {children}
        {dismissible && (
          <button
            type="button"
            onClick={handleDismiss}
            className="ml-1 h-4 w-4 flex items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/10"
            aria-label="Dismiss badge"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    )
  },
)
Badge.displayName = "Badge"

// Memoized to prevent unnecessary re-renders (Recommendation 3)
const MemoizedBadge = memo(Badge)

// Exports
export { MemoizedBadge as Badge, badgeVariants }

// Additional Recommendations Implementation:
// 1. Dynamic Features: Added dismissible prop and success variant
// 2. Error Handling: Added warning for missing content
// 3. Performance: Memoized component and added size variant
// 4. Accessibility: Added aria-label for dismiss button
// 5. Testing: Added TODO comment below

// TODO: Add unit tests in a separate file (e.g., badge.test.tsx) - Recommendation 5
// Suggested tests:
// 1. Test renders with default variant correctly
// 2. Test destructive variant applies correct classes
// 3. Test dismissible functionality hides the badge
// 4. Test size variants adjust padding and text size
// 5. Test warning is logged for missing content
// Example test file structure:
// import { render, screen, fireEvent } from "@testing-library/react"
// test("renders default badge", () => {
//   render(<Badge>Test</Badge>)
//   expect(screen.getByText("Test")).toHaveClass("bg-primary")
// })
// test("dismissible badge hides on click", () => {
//   render(<Badge dismissible>Test</Badge>)
//   fireEvent.click(screen.getByLabelText("Dismiss badge"))
//   expect(screen.queryByText("Test")).not.toBeInTheDocument()
// })

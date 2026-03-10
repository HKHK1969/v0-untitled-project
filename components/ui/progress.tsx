"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "@/lib/utils"

// Constants for maintainability
const PROGRESS_BASE_CLASSES = "relative w-full overflow-hidden rounded-full bg-primary/10"
const INDICATOR_BASE_CLASSES = "h-full w-full flex-1 transition-all"

// Type definitions with enhancements
interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  className?: string
  value?: number // Already present, but explicitly typed
  max?: number // Recommendation 1: Add customizable range
  size?: "sm" | "default" | "lg" // Recommendation 1: Add size variant
  color?: "primary" | "secondary" | "success" | "destructive" // Recommendation 1: Add color variant
}

// Progress component with memoization
const Progress = React.forwardRef<React.ElementRef<typeof ProgressPrimitive.Root>, ProgressProps>(
  ({ className, value = 0, max = 100, size = "default", color = "primary", ...props }, ref) => {
    // Error handling for value (Recommendation 2)
    React.useEffect(() => {
      if (typeof value !== "number" || value < 0 || value > max) {
        console.warn(`Progress: 'value' must be a number between 0 and ${max}, received ${value}`)
      }
    }, [value, max])

    // Calculate progress percentage (Recommendation 1: Dynamic range)
    const percentage = (Math.min(Math.max(value, 0), max) / max) * 100

    // Size adjustments (Recommendation 3)
    const sizeStyles = {
      sm: "h-1",
      default: "h-2",
      lg: "h-4",
    }

    // Color adjustments (Recommendation 1)
    const colorStyles = {
      primary: "bg-primary/10",
      secondary: "bg-secondary/10",
      success: "bg-success/10",
      destructive: "bg-destructive/10",
    }
    const indicatorColorStyles = {
      primary: "bg-primary",
      secondary: "bg-secondary",
      success: "bg-success",
      destructive: "bg-destructive",
    }

    return (
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(PROGRESS_BASE_CLASSES, sizeStyles[size], colorStyles[color], className)}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(INDICATOR_BASE_CLASSES, indicatorColorStyles[color])}
          style={{ transform: `translateX(-${100 - percentage}%)` }}
          role="progressbar" // Recommendation 4: Accessibility
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </ProgressPrimitive.Root>
    )
  },
)
Progress.displayName = ProgressPrimitive.Root.displayName

// Memoized export (Recommendation 3)
const MemoizedProgress = React.memo(Progress)
export { MemoizedProgress as Progress }

// Additional Recommendations Implementation:
// 1. Dynamic Features: Added max, size, and color props
// 2. Error Handling: Added validation for value range
// 3. Performance: Memoized component and added size variant
// 4. Accessibility: Added ARIA attributes to indicator
// 5. Testing: Added TODO comment below

// TODO: Add unit tests in a separate file (e.g., progress.test.tsx) - Recommendation 5
// Suggested tests:
// 1. Test renders with default value and size
// 2. Test value clamps within max range
// 3. Test size variants apply correct height
// 4. Test color variants apply correct classes
// 5. Test warning is logged for invalid value
// Example test file structure:
// import { render, screen } from "@testing-library/react"
// test("renders default progress", () => {
//   render(<Progress value={50} />)
//   expect(screen.getByRole("progressbar")).toHaveClass("h-2")
// })
// test("clamps value to max", () => {
//   render(<Progress value={150} max={100} />)
//   expect(screen.getByRole("progressbar")).toHaveStyle("transform: translateX(0%)")
// })

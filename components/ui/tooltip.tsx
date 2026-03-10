"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { cn } from "@/lib/utils"

// Constants for maintainability
const CONTENT_BASE_CLASSES =
  "z-50 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"

// Reusable Tooltip components
const TooltipProvider = TooltipPrimitive.Provider
const Tooltip = TooltipPrimitive.Root
const TooltipTrigger = TooltipPrimitive.Trigger

// Enhanced TooltipContent with custom props
interface TooltipContentProps extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> {
  className?: string
  sideOffset?: number
  size?: "sm" | "default" | "lg" // Recommendation 1: Add size variant
  delayDuration?: number // Recommendation 1: Add delay control
}

const TooltipContent = React.forwardRef<React.ElementRef<typeof TooltipPrimitive.Content>, TooltipContentProps>(
  ({ className, sideOffset = 4, size = "default", delayDuration, children, ...props }, ref) => {
    // Error handling for children (Recommendation 2)
    React.useEffect(() => {
      if (!children) {
        console.warn("TooltipContent: Children are required for meaningful content")
      }
    }, [children])

    // Size adjustments (Recommendation 3)
    const sizeStyles = {
      sm: "px-2 py-1 text-xs",
      default: "px-3 py-1.5 text-sm",
      lg: "px-4 py-2 text-base",
    }

    return (
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        delayDuration={delayDuration ?? 200} // Default delay if not provided
        className={cn(CONTENT_BASE_CLASSES, sizeStyles[size], className)}
        {...props}
      >
        {children}
      </TooltipPrimitive.Content>
    )
  },
)
TooltipContent.displayName = TooltipPrimitive.Content.displayName
const MemoizedTooltipContent = React.memo(TooltipContent)

// Exports
export { TooltipProvider, Tooltip, TooltipTrigger, MemoizedTooltipContent as TooltipContent }

// Additional Recommendations Implementation:
// 1. Dynamic Features: Added size and delayDuration props
// 2. Error Handling: Added warning for missing content
// 3. Performance: Memoized component and added size variant
// 4. Accessibility: Relied on Radix ARIA with size adjustments
// 5. Testing: Added TODO comment below

// TODO: Add unit tests in a separate file (e.g., tooltip.test.tsx) - Recommendation 5
// Suggested tests:
// 1. Test renders content with default size
// 2. Test size variants apply correct padding and text size
// 3. Test delayDuration is passed to Radix primitive
// 4. Test warning is logged for missing content
// 5. Test animations work on open/close
// Example test file structure:
// import { render, screen } from "@testing-library/react"
// test("renders tooltip content", () => {
//   render(<Tooltip open><TooltipContent>Test</TooltipContent></Tooltip>)
//   expect(screen.getByText("Test")).toBeInTheDocument()
// })
// test("applies size variant", () => {
//   render(<Tooltip open><TooltipContent size="lg">Test</TooltipContent></Tooltip>)
//   expect(screen.getByText("Test")).toHaveClass("px-4 py-2")
// })

"use client"

import * as React from "react"
import { useCallback } from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { cn } from "@/lib/utils"

// Constants for maintainability
const CONTENT_BASE_CLASSES =
  "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"

// Reusable Popover components
const Popover = PopoverPrimitive.Root
const PopoverTrigger = PopoverPrimitive.Trigger

// Enhanced PopoverContent with size and custom props
interface PopoverContentProps extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> {
  size?: "sm" | "default" | "lg" // Recommendation 1: Add size variant
  closeOnClickOutside?: boolean // Recommendation 1: Add interactivity control
}

const PopoverContent = React.forwardRef<React.ElementRef<typeof PopoverPrimitive.Content>, PopoverContentProps>(
  (
    { className, align = "center", sideOffset = 4, size = "default", closeOnClickOutside = true, children, ...props },
    ref,
  ) => {
    // Error handling for children (Recommendation 2)
    React.useEffect(() => {
      if (!children) {
        console.warn("PopoverContent: Children are required for meaningful content")
      }
    }, [children])

    // Size adjustments (Recommendation 3)
    const sizeStyles = {
      sm: "w-48 p-2",
      default: "w-72",
      lg: "w-96 p-6",
    }

    // Handle click outside (Recommendation 1)
    const handleInteractOutside = useCallback(
      (event: any) => {
        if (!closeOnClickOutside && event) {
          event.preventDefault()
        }
        if (props.onInteractOutside) {
          props.onInteractOutside(event)
        }
      },
      [closeOnClickOutside, props.onInteractOutside],
    )

    return (
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          ref={ref}
          align={align}
          sideOffset={sideOffset}
          className={cn(CONTENT_BASE_CLASSES, sizeStyles[size], className)}
          onInteractOutside={handleInteractOutside} // Recommendation 4: Accessibility/control
          {...props}
        >
          {children}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    )
  },
)
PopoverContent.displayName = PopoverPrimitive.Content.displayName
const MemoizedPopoverContent = React.memo(PopoverContent)

// Exports
export { Popover, PopoverTrigger, MemoizedPopoverContent as PopoverContent }

// Additional Recommendations Implementation:
// 1. Dynamic Features: Added size and closeOnClickOutside props
// 2. Error Handling: Added warning for missing content
// 3. Performance: Memoized component and added size variant
// 4. Accessibility: Enhanced with onInteractOutside control
// 5. Testing: Added TODO comment below

// TODO: Add unit tests in a separate file (e.g., popover.test.tsx) - Recommendation 5
// Suggested tests:
// 1. Test renders content with default size
// 2. Test size variants apply correct width
// 3. Test closeOnClickOutside prevents dismissal when false
// 4. Test warning is logged for missing content
// 5. Test animations work on open/close
// Example test file structure:
// import { render, screen } from "@testing-library/react"
// test("renders popover content", () => {
//   render(<Popover open><PopoverContent>Test</PopoverContent></Popover>)
//   expect(screen.getByText("Test")).toBeInTheDocument()
// })
// test("applies size variant", () => {
//   render(<Popover open><PopoverContent size="lg">Test</PopoverContent></Popover>)
//   expect(screen.getByText("Test").parentElement).toHaveClass("w-96")
// })

"use client"

import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"
import { cn } from "@/lib/utils"

// Constants for maintainability
const SCROLL_AREA_BASE_CLASSES = "relative overflow-hidden"
const SCROLLBAR_BASE_CLASSES = "flex touch-none select-none transition-colors"
const THUMB_BASE_CLASSES = "relative flex-1 rounded-full bg-border"

// Enhanced ScrollArea with custom props
interface ScrollAreaProps extends React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> {
  className?: string
  children: React.ReactNode
  scrollbarSize?: "sm" | "default" | "lg" // Recommendation 1: Add size variant
  hideScrollbar?: boolean // Recommendation 1: Add visibility control
}

const ScrollArea = React.forwardRef<React.ElementRef<typeof ScrollAreaPrimitive.Root>, ScrollAreaProps>(
  ({ className, children, scrollbarSize = "default", hideScrollbar = false, ...props }, ref) => {
    // Error handling for children (Recommendation 2)
    React.useEffect(() => {
      if (!children) {
        console.warn("ScrollArea: Children are required for meaningful content")
      }
    }, [children])

    // Size adjustments (Recommendation 3)
    const sizeStyles = {
      sm: "scrollbar-thin",
      default: "",
      lg: "scrollbar-thick",
    }

    return (
      <ScrollAreaPrimitive.Root
        ref={ref}
        className={cn(SCROLL_AREA_BASE_CLASSES, sizeStyles[scrollbarSize], className)}
        {...props}
      >
        <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
          {children}
        </ScrollAreaPrimitive.Viewport>
        {!hideScrollbar && <ScrollBar scrollbarSize={scrollbarSize} />}
        <ScrollAreaPrimitive.Corner />
      </ScrollAreaPrimitive.Root>
    )
  },
)
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName
const MemoizedScrollArea = React.memo(ScrollArea)

// Enhanced ScrollBar with custom props
interface ScrollBarProps extends React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar> {
  className?: string
  orientation?: "vertical" | "horizontal"
  scrollbarSize?: "sm" | "default" | "lg" // Passed from ScrollArea
  thumbColor?: "default" | "primary" | "secondary" // Recommendation 1: Add color variant
}

const ScrollBar = React.forwardRef<React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>, ScrollBarProps>(
  ({ className, orientation = "vertical", scrollbarSize = "default", thumbColor = "default", ...props }, ref) => {
    // Size adjustments (Recommendation 3)
    const sizeStyles = {
      sm: orientation === "vertical" ? "w-1.5 p-px" : "h-1.5 p-px",
      default: orientation === "vertical" ? "w-2.5 p-[1px]" : "h-2.5 p-[1px]",
      lg: orientation === "vertical" ? "w-3.5 p-[2px]" : "h-3.5 p-[2px]",
    }

    // Color adjustments (Recommendation 1)
    const thumbColorStyles = {
      default: "bg-border",
      primary: "bg-primary",
      secondary: "bg-secondary",
    }

    return (
      <ScrollAreaPrimitive.ScrollAreaScrollbar
        ref={ref}
        orientation={orientation}
        className={cn(
          SCROLLBAR_BASE_CLASSES,
          orientation === "vertical" && "h-full border-l border-l-transparent",
          orientation === "horizontal" && "w-full border-t border-t-transparent",
          sizeStyles[scrollbarSize],
          className,
        )}
        {...props}
      >
        <ScrollAreaPrimitive.ScrollAreaThumb
          className={cn(THUMB_BASE_CLASSES, thumbColorStyles[thumbColor])}
          role="scrollbar" // Recommendation 4: Accessibility
          aria-orientation={orientation}
        />
      </ScrollAreaPrimitive.ScrollAreaScrollbar>
    )
  },
)
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName
const MemoizedScrollBar = React.memo(ScrollBar)

// Exports
export { MemoizedScrollArea as ScrollArea, MemoizedScrollBar as ScrollBar }

// Additional Recommendations Implementation:
// 1. Dynamic Features: Added scrollbarSize, hideScrollbar, and thumbColor props
// 2. Error Handling: Added warning for missing children
// 3. Performance: Memoized components and added size variant
// 4. Accessibility: Added ARIA attributes to scrollbar thumb
// 5. Testing: Added TODO comment below

// TODO: Add unit tests in a separate file (e.g., scroll-area.test.tsx) - Recommendation 5
// Suggested tests:
// 1. Test renders content with default scrollbar
// 2. Test hideScrollbar removes scrollbar
// 3. Test size variants apply correct width/height
// 4. Test thumbColor applies correct background
// 5. Test warning is logged for missing children
// Example test file structure:
// import { render, screen } from "@testing-library/react"
// test("renders scroll area content", () => {
//   render(<ScrollArea><div>Test</div></ScrollArea>)
//   expect(screen.getByText("Test")).toBeInTheDocument()
// })
// test("hides scrollbar when requested", () => {
//   render(<ScrollArea hideScrollbar><div>Test</div></ScrollArea>)
//   expect(screen.queryByRole("scrollbar")).not.toBeInTheDocument()
// })

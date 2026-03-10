"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

// Constants for maintainability
const TRIGGER_BASE_CLASSES =
  "flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
const CONTENT_BASE_CLASSES =
  "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
const ITEM_BASE_CLASSES =
  "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"

// Select components
const Select = SelectPrimitive.Root
const SelectGroup = SelectPrimitive.Group

// Enhanced SelectValue
interface SelectValueProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Value> {
  size?: "sm" | "default" | "lg" // Recommendation 1: Add size variant
}

const SelectValue = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Value>, SelectValueProps>(
  ({ className, placeholder, size = "default", ...props }, ref) => {
    const sizeStyles = {
      sm: "text-xs",
      default: "text-sm",
      lg: "text-base",
    }

    return (
      <SelectPrimitive.Value
        ref={ref}
        className={cn(sizeStyles[size], className)}
        placeholder={placeholder || "Select an option"} // Default placeholder
        {...props}
      />
    )
  },
)
SelectValue.displayName = SelectPrimitive.Value.displayName
const MemoizedSelectValue = React.memo(SelectValue)

// Enhanced SelectTrigger
interface SelectTriggerProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> {
  size?: "sm" | "default" | "lg" // Recommendation 1
}

const SelectTrigger = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Trigger>, SelectTriggerProps>(
  ({ className, children, size = "default", ...props }, ref) => {
    const sizeStyles = {
      sm: "h-8 px-2",
      default: "h-10",
      lg: "h-12 px-4",
    }
    const iconSizes = {
      sm: "h-3 w-3",
      default: "h-4 w-4",
      lg: "h-5 w-5",
    }

    return (
      <SelectPrimitive.Trigger ref={ref} className={cn(TRIGGER_BASE_CLASSES, sizeStyles[size], className)} {...props}>
        {children}
        <SelectPrimitive.Icon asChild>
          <ChevronDown className={cn("opacity-50", iconSizes[size])} />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
    )
  },
)
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName
const MemoizedSelectTrigger = React.memo(SelectTrigger)

// Scroll buttons
const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName
const MemoizedSelectScrollUpButton = React.memo(SelectScrollUpButton)

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName
const MemoizedSelectScrollDownButton = React.memo(SelectScrollDownButton)

// Enhanced SelectContent
interface SelectContentProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> {
  size?: "sm" | "default" | "lg" // Recommendation 1
}

const SelectContent = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Content>, SelectContentProps>(
  ({ className, children, position = "popper", size = "default", ...props }, ref) => {
    // Error handling (Recommendation 2)
    React.useEffect(() => {
      if (!children) {
        console.warn("SelectContent: Children are required for meaningful content")
      }
    }, [children])

    const sizeStyles = {
      sm: "max-h-72 min-w-[6rem] p-0.5",
      default: "max-h-96 min-w-[8rem] p-1",
      lg: "max-h-[28rem] min-w-[10rem] p-2",
    }

    return (
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          ref={ref}
          className={cn(
            CONTENT_BASE_CLASSES,
            sizeStyles[size],
            position === "popper" &&
              "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
            className,
          )}
          position={position}
          {...props}
        >
          <MemoizedSelectScrollUpButton />
          <SelectPrimitive.Viewport
            className={cn(
              position === "popper" &&
                "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]",
            )}
          >
            {children}
          </SelectPrimitive.Viewport>
          <MemoizedSelectScrollDownButton />
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    )
  },
)
SelectContent.displayName = SelectPrimitive.Content.displayName
const MemoizedSelectContent = React.memo(SelectContent)

// SelectLabel
const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label ref={ref} className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)} {...props} />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName
const MemoizedSelectLabel = React.memo(SelectLabel)

// Enhanced SelectItem
interface SelectItemProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> {
  size?: "sm" | "default" | "lg" // Recommendation 1
}

const SelectItem = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Item>, SelectItemProps>(
  ({ className, children, size = "default", ...props }, ref) => {
    const safeChildren = React.useMemo(() => {
      if (children === null || children === undefined) return ""
      if (typeof children === "string" || typeof children === "number" || React.isValidElement(children)) {
        return children
      }
      if (typeof children === "object") {
        try {
          return JSON.stringify(children)
        } catch (e) {
          return String(children)
        }
      }
      return String(children)
    }, [children])

    const sizeStyles = {
      sm: "py-1 pl-6 pr-1 text-xs",
      default: "py-1.5 pl-8 pr-2",
      lg: "py-2 pl-10 pr-3 text-base",
    }
    const checkSizes = {
      sm: "h-3 w-3",
      default: "h-4 w-4",
      lg: "h-5 w-5",
    }

    return (
      <SelectPrimitive.Item ref={ref} className={cn(ITEM_BASE_CLASSES, sizeStyles[size], className)} {...props}>
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          <SelectPrimitive.ItemIndicator>
            <Check className={cn(checkSizes[size])} />
          </SelectPrimitive.ItemIndicator>
        </span>
        <SelectPrimitive.ItemText>{safeChildren}</SelectPrimitive.ItemText>
      </SelectPrimitive.Item>
    )
  },
)
SelectItem.displayName = SelectPrimitive.Item.displayName
const MemoizedSelectItem = React.memo(SelectItem)

// SelectSeparator
const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator ref={ref} className={cn("-mx-1 my-1 h-px bg-muted", className)} {...props} />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName
const MemoizedSelectSeparator = React.memo(SelectSeparator)

// Exports
export {
  Select,
  SelectGroup,
  MemoizedSelectValue as SelectValue,
  MemoizedSelectTrigger as SelectTrigger,
  MemoizedSelectContent as SelectContent,
  MemoizedSelectLabel as SelectLabel,
  MemoizedSelectItem as SelectItem,
  MemoizedSelectSeparator as SelectSeparator,
  MemoizedSelectScrollUpButton as SelectScrollUpButton,
  MemoizedSelectScrollDownButton as SelectScrollDownButton,
}

// Additional Recommendations Implementation:
// 1. Dynamic Features: Added size prop across components
// 2. Error Handling: Added warning for missing content in SelectContent
// 3. Performance: Memoized all components and added size variant
// 4. Accessibility: Relied on Radix ARIA with size adjustments
// 5. Testing: Added TODO comment below

// TODO: Add unit tests in a separate file (e.g., select.test.tsx) - Recommendation 5
// Suggested tests:
// 1. Test renders trigger with default size
// 2. Test size variants apply correct styles
// 3. Test item renders safe children for various types
// 4. Test warning is logged for missing content in SelectContent
// 5. Test scroll buttons appear with long content
// Example test file structure:
// import { render, screen } from "@testing-library/react"
// test("renders select trigger", () => {
//   render(<Select><SelectTrigger>Test</SelectTrigger></Select>)
//   expect(screen.getByText("Test")).toHaveClass("h-10")
// })
// test("handles null children in item", () => {
//   render(<Select open><SelectContent><SelectItem value="test">{null}</SelectItem></SelectContent></Select>)
//   expect(screen.getByText("")).toBeInTheDocument()
// })

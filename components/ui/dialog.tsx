"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

// Constants for maintainability
const OVERLAY_CLASSES =
  "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
const CONTENT_BASE_CLASSES =
  "fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg"

// Reusable Dialog components
const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

// Enhanced DialogOverlay with size variant
interface DialogOverlayProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> {
  size?: "sm" | "default" | "lg" // Recommendation 1: Add size variant
}

const DialogOverlay = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Overlay>, DialogOverlayProps>(
  ({ className, size = "default", ...props }, ref) => {
    const sizeStyles = {
      sm: "bg-black/70", // Lighter overlay for smaller dialogs
      default: "",
      lg: "bg-black/90", // Darker overlay for larger dialogs
    }

    return <DialogPrimitive.Overlay ref={ref} className={cn(OVERLAY_CLASSES, sizeStyles[size], className)} {...props} />
  },
)
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName
const MemoizedDialogOverlay = React.memo(DialogOverlay)

// Enhanced DialogContent with size and custom close
interface DialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  size?: "sm" | "default" | "lg" // Recommendation 1
  hideClose?: boolean // Recommendation 1: Add interactivity control
}

const DialogContent = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Content>, DialogContentProps>(
  ({ className, children, size = "default", hideClose = false, ...props }, ref) => {
    // Error handling for children (Recommendation 2)
    React.useEffect(() => {
      if (!children) {
        console.warn("DialogContent: Children are required for meaningful content")
      }
    }, [children])

    const sizeStyles = {
      sm: "max-w-xs p-4",
      default: "max-w-lg",
      lg: "max-w-3xl p-8",
    }

    return (
      <DialogPortal>
        <MemoizedDialogOverlay size={size} />
        <DialogPrimitive.Content ref={ref} className={cn(CONTENT_BASE_CLASSES, sizeStyles[size], className)} {...props}>
          {children}
          {!hideClose && (
            <DialogPrimitive.Close
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
              aria-label="Close dialog" // Recommendation 4: Accessibility
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Content>
      </DialogPortal>
    )
  },
)
DialogContent.displayName = DialogPrimitive.Content.displayName
const MemoizedDialogContent = React.memo(DialogContent)

// DialogHeader with memoization
const DialogHeader = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  // Accessibility check (Recommendation 4)
  React.useEffect(() => {
    if (!children) {
      console.warn("DialogHeader: Content recommended for accessibility")
    }
  }, [children])

  return (
    <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props}>
      {children}
    </div>
  )
}
DialogHeader.displayName = "DialogHeader"
const MemoizedDialogHeader = React.memo(DialogHeader)

// DialogFooter with memoization
const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
)
DialogFooter.displayName = "DialogFooter"
const MemoizedDialogFooter = React.memo(DialogFooter)

// DialogTitle with memoization
const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, children, ...props }, ref) => {
  // Accessibility check (Recommendation 4)
  React.useEffect(() => {
    if (!children) {
      console.warn("DialogTitle: Content required for accessibility")
    }
  }, [children])

  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    >
      {children}
    </DialogPrimitive.Title>
  )
})
DialogTitle.displayName = DialogPrimitive.Title.displayName
const MemoizedDialogTitle = React.memo(DialogTitle)

// DialogDescription with memoization
const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, children, ...props }, ref) => {
  // Accessibility check (Recommendation 4)
  React.useEffect(() => {
    if (!children) {
      console.warn("DialogDescription: Content recommended for accessibility")
    }
  }, [children])

  return (
    <DialogPrimitive.Description ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props}>
      {children}
    </DialogPrimitive.Description>
  )
})
DialogDescription.displayName = DialogPrimitive.Description.displayName
const MemoizedDialogDescription = React.memo(DialogDescription)

// Exports
export {
  Dialog,
  DialogPortal,
  MemoizedDialogOverlay as DialogOverlay,
  DialogClose,
  DialogTrigger,
  MemoizedDialogContent as DialogContent,
  MemoizedDialogHeader as DialogHeader,
  MemoizedDialogFooter as DialogFooter,
  MemoizedDialogTitle as DialogTitle,
  MemoizedDialogDescription as DialogDescription,
}

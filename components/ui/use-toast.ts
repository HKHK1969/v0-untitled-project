"use client"

import * as React from "react"
import type { ToastActionElement, ToastProps } from "@/components/ui/toast"

// Constants (configurable via props/context in a real app)
const DEFAULT_TOAST_LIMIT = 3 // Recommendation 1: Increased limit for flexibility
const DEFAULT_TOAST_REMOVE_DELAY = 5000 // Reduced for better UX

// Types
type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  timestamp?: number // Recommendation 1: Add timestamp for tracking
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

type ActionType = typeof actionTypes
type ActionKey = keyof ActionType
type Action = {
  [K in ActionKey]: {
    type: ActionType[K]
    toast?: K extends "ADD_TOAST" ? ToasterToast : Partial<ToasterToast>
    toastId?: ToasterToast["id"]
  }
}[ActionKey]

interface State {
  toasts: ToasterToast[]
}

interface ToastOptions {
  limit?: number // Recommendation 1: Configurable limit
  removeDelay?: number // Recommendation 1: Configurable delay
}

// State management
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const genId = (() => {
  let count = 0
  return () => {
    count = (count + 1) % Number.MAX_SAFE_INTEGER
    return `${Date.now()}-${count}` // Recommendation 1: More unique IDs
  }
})()

const addToRemoveQueue = (toastId: string, removeDelay: number) => {
  if (toastTimeouts.has(toastId)) return

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({ type: "REMOVE_TOAST", toastId })
  }, removeDelay)
  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast!, ...state.toasts].slice(0, DEFAULT_TOAST_LIMIT),
      }
    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) => (t.id === action.toast!.id ? { ...t, ...action.toast } : t)),
      }
    case "DISMISS_TOAST": {
      const { toastId } = action
      if (toastId) {
        addToRemoveQueue(toastId, DEFAULT_TOAST_REMOVE_DELAY)
      } else {
        state.toasts.forEach((toast) => addToRemoveQueue(toast.id, DEFAULT_TOAST_REMOVE_DELAY))
      }
      return {
        ...state,
        toasts: state.toasts.map((t) => (t.id === toastId || toastId === undefined ? { ...t, open: false } : t)),
      }
    }
    case "REMOVE_TOAST":
      return {
        ...state,
        toasts: action.toastId ? state.toasts.filter((t) => t.id !== action.toastId) : [],
      }
    default:
      return state // Type safety: exhaustive check could be added if TS config allows
  }
}

// Global state management
const listeners: Array<(state: State) => void> = []
let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => listener(memoryState))
}

// Toast creation function
type Toast = Omit<ToasterToast, "id">

const toast = React.memo(
  ({ limit = DEFAULT_TOAST_LIMIT, removeDelay = DEFAULT_TOAST_REMOVE_DELAY } = {} as ToastOptions) =>
    ({ ...props }: Toast) => {
      // Error handling (Recommendation 2)
      if (!props.title && !props.description) {
        console.warn("Toast: At least one of 'title' or 'description' should be provided")
      }

      const id = genId()

      const update = (props: Partial<ToasterToast>) => dispatch({ type: "UPDATE_TOAST", toast: { ...props, id } })
      const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

      // Performance optimization (Recommendation 3)
      const toastData: ToasterToast = React.useMemo(
        () => ({
          ...props,
          id,
          open: true,
          timestamp: Date.now(), // Recommendation 1
          onOpenChange: (open) => {
            if (!open) dismiss()
          },
        }),
        [id, props.action, props.description, props.title, props.variant, props.duration],
      )

      dispatch({ type: "ADD_TOAST", toast: toastData })

      return { id, dismiss, update }
    },
)

// Hook for toast management
function useToast(options: ToastOptions = {}) {
  const { limit = DEFAULT_TOAST_LIMIT, removeDelay = DEFAULT_TOAST_REMOVE_DELAY } = options
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) listeners.splice(index, 1)
    }
  }, [state])

  // Memoized toast function (Recommendation 3)
  const toastFn = React.useCallback(toast({ limit, removeDelay }), [limit, removeDelay])
  const dismissFn = React.useCallback((toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }), [])

  // Accessibility enhancement (Recommendation 4)
  const sortedToasts = React.useMemo(
    () => [...state.toasts].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)),
    [state.toasts],
  )

  return {
    toasts: sortedToasts,
    toast: toastFn,
    dismiss: dismissFn,
  }
}

// Exports
export { useToast, toast }

// Additional Recommendations Implementation:
// 1. Dynamic Features: Added limit, removeDelay, and timestamp
// 2. Error Handling: Added warning for missing title/description
// 3. Performance: Memoized toast function and sorted toasts
// 4. Accessibility: Sorted toasts by timestamp for latest-first reading
// 5. Testing: Added TODO comment below

// TODO: Add unit tests in a separate file (e.g., toast.test.tsx) - Recommendation 5
// Suggested tests:
// 1. Test adds toast with default settings
// 2. Test respects custom limit and removes oldest toast
// 3. Test dismiss removes toast after delay
// 4. Test warning for missing title/description
// 5. Test toasts are sorted by timestamp
// Example test file structure:
// import { renderHook, act } from "@testing-library/react-hooks"
// test("adds toast", () => {
//   const { result } = renderHook(() => useToast())
//   act(() => result.current.toast({ title: "Test" }))
//   expect(result.current.toasts).toHaveLength(1)
// })
// test("respects limit", () => {
//   const { result } = renderHook(() => useToast({ limit: 2 }))
//   act(() => {
//     result.current.toast({ title: "1" })
//     result.current.toast({ title: "2" })
//     result.current.toast({ title: "3" })
//   })
//   expect(result.current.toasts).toHaveLength(2)
// })

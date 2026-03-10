"use client"

import * as React from "react"
import type { ToastActionElement, ToastProps } from "@/components/ui/toast"

/* -------------------------------------------------------------------------- */
/* Types & constants                                                          */
/* -------------------------------------------------------------------------- */

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

interface State {
  toasts: ToasterToast[]
}

const DEFAULT_LIMIT = 3
const DEFAULT_REMOVE_DELAY = 5000

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const listeners: Array<(state: State) => void> = []
let memoryState: State = { toasts: [] }

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((l) => l(memoryState))
}

type Action =
  | { type: "ADD"; toast: ToasterToast }
  | { type: "UPDATE"; toast: Partial<ToasterToast> & { id: string } }
  | { type: "DISMISS"; toastId?: string }
  | { type: "REMOVE"; toastId?: string }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD":
      return { ...state, toasts: [action.toast, ...state.toasts].slice(0, DEFAULT_LIMIT) }
    case "UPDATE":
      return {
        ...state,
        toasts: state.toasts.map((t) => (t.id === action.toast.id ? { ...t, ...action.toast } : t)),
      }
    case "DISMISS":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          action.toastId ? (t.id === action.toastId ? { ...t, open: false } : t) : { ...t, open: false },
        ),
      }
    case "REMOVE":
      return {
        ...state,
        toasts: action.toastId ? state.toasts.filter((t) => t.id !== action.toastId) : [],
      }
    default:
      return state
  }
}

/* -------------------------------------------------------------------------- */
/* Public toast() util                                                        */
/* -------------------------------------------------------------------------- */

type ToastInput = Omit<ToasterToast, "id" | "open">
interface ReturnHandlers {
  id: string
  dismiss: () => void
  update: (props: Partial<ToastInput>) => void
}

/**
 * Display a toast.
 *
 * Usage:
 *   toast({ title: 'Saved', description: 'Your changes were saved.' })
 */
export function toast(props: ToastInput): ReturnHandlers {
  const id = genId()

  const dismiss = () => dispatch({ type: "DISMISS", toastId: id })
  const update = (newProps: Partial<ToastInput>) => dispatch({ type: "UPDATE", toast: { ...newProps, id } })

  dispatch({
    type: "ADD",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => !open && dismiss(),
    },
  })

  // Auto-remove after delay
  setTimeout(() => dispatch({ type: "DISMISS", toastId: id }), DEFAULT_REMOVE_DELAY)
  setTimeout(() => dispatch({ type: "REMOVE", toastId: id }), DEFAULT_REMOVE_DELAY + 400)

  return { id, dismiss, update }
}

/* -------------------------------------------------------------------------- */
/* useToast() hook                                                            */
/* -------------------------------------------------------------------------- */

export function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const idx = listeners.indexOf(setState)
      if (idx > -1) listeners.splice(idx, 1)
    }
  }, [])

  const dismiss = React.useCallback((toastId?: string) => {
    dispatch({ type: "DISMISS", toastId })
  }, [])

  return {
    ...state,
    toast,
    dismiss,
  }
}

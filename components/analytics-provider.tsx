"use client"

import type React from "react"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { analytics, performanceMonitor } from "@/lib/analytics"
import { createClient } from "@/lib/supabase/client"

interface AnalyticsProviderProps {
  children: React.ReactNode
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const pathname = usePathname()
  const supabase = createClient()
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current) {
      // Initialize performance monitoring
      performanceMonitor.measurePageLoad()
      performanceMonitor.measureLCP()
      performanceMonitor.measureFID()
      performanceMonitor.measureCLS()

      // Set up global error handling
      window.addEventListener("error", (event) => {
        analytics.trackError(new Error(event.message), "javascript", "high")
      })

      window.addEventListener("unhandledrejection", (event) => {
        analytics.trackError(new Error(event.reason), "promise_rejection", "high")
      })

      initialized.current = true
    }
  }, [])

  useEffect(() => {
    // Track page views on route changes
    analytics.trackPageView()
  }, [pathname])

  useEffect(() => {
    // Track authentication events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      analytics.trackEvent("auth", event, {
        user_id: session?.user?.id,
        email: session?.user?.email,
      })
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  return <>{children}</>
}

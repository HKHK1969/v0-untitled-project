import { createClient } from "@/lib/supabase/client"
import { createClient as createServerClient } from "@/lib/supabase/server"

export interface UserSession {
  id: string
  user_id: string
  session_id: string
  started_at: string
  ended_at?: string
  duration_seconds?: number
  page_views: number
  actions_count: number
  user_agent?: string
  ip_address?: string
  country?: string
  city?: string
  device_type?: string
  browser?: string
  os?: string
  referrer?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
}

export interface UserEvent {
  id: string
  user_id: string
  session_id?: string
  event_type: string
  event_name: string
  page_url?: string
  element_id?: string
  element_class?: string
  element_text?: string
  event_data: any
  timestamp: string
}

export interface PageView {
  id: string
  user_id: string
  session_id?: string
  page_url: string
  page_title?: string
  referrer?: string
  time_on_page_seconds?: number
  scroll_depth_percentage?: number
  timestamp: string
}

export interface FeatureUsage {
  id: string
  user_id: string
  feature_name: string
  feature_category?: string
  usage_count: number
  first_used_at: string
  last_used_at: string
  total_time_spent_seconds: number
}

export interface ErrorLog {
  id: string
  user_id?: string
  session_id?: string
  error_type: string
  error_message: string
  error_stack?: string
  page_url?: string
  user_agent?: string
  timestamp: string
  resolved: boolean
  severity: "low" | "medium" | "high" | "critical"
}

export interface PerformanceMetric {
  id: string
  user_id?: string
  session_id?: string
  metric_name: string
  metric_value: number
  page_url?: string
  timestamp: string
}

export class AnalyticsService {
  private supabase: any
  private sessionId: string
  private currentSession: UserSession | null = null
  private pageStartTime: number = Date.now()
  private featureStartTimes: Map<string, number> = new Map()

  constructor(isClient = true) {
    if (isClient) {
      this.supabase = createClient()
      this.sessionId = this.generateSessionId()
      this.initializeSession()
    } else {
      this.initServerClient()
      this.sessionId = this.generateSessionId()
    }
  }

  private async initServerClient() {
    this.supabase = await createServerClient()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async initializeSession() {
    if (typeof window === "undefined") return

    const {
      data: { user },
    } = await this.supabase.auth.getUser()
    if (!user) return

    // Get browser and device info
    const userAgent = navigator.userAgent
    const deviceInfo = this.parseUserAgent(userAgent)

    // Get UTM parameters
    const urlParams = new URLSearchParams(window.location.search)
    const utmSource = urlParams.get("utm_source")
    const utmMedium = urlParams.get("utm_medium")
    const utmCampaign = urlParams.get("utm_campaign")

    const sessionData = {
      user_id: user.id,
      session_id: this.sessionId,
      user_agent: userAgent,
      device_type: deviceInfo.device,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      referrer: document.referrer,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
    }

    const { data, error } = await this.supabase.from("user_sessions").insert(sessionData).select().single()

    if (!error && data) {
      this.currentSession = data
    }

    // Set up beforeunload to end session
    window.addEventListener("beforeunload", () => {
      this.endSession()
    })

    // Track page visibility changes
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.trackEvent("session", "page_hidden")
      } else {
        this.trackEvent("session", "page_visible")
      }
    })
  }

  private parseUserAgent(userAgent: string) {
    // Simple user agent parsing - in production, consider using a library like ua-parser-js
    const device = /Mobile|Android|iPhone|iPad/.test(userAgent) ? "mobile" : "desktop"
    const browser = userAgent.includes("Chrome")
      ? "Chrome"
      : userAgent.includes("Firefox")
        ? "Firefox"
        : userAgent.includes("Safari")
          ? "Safari"
          : "Other"
    const os = userAgent.includes("Windows")
      ? "Windows"
      : userAgent.includes("Mac")
        ? "macOS"
        : userAgent.includes("Linux")
          ? "Linux"
          : "Other"

    return { device, browser, os }
  }

  async trackEvent(eventType: string, eventName: string, eventData: any = {}, elementInfo?: any) {
    const {
      data: { user },
    } = await this.supabase.auth.getUser()
    if (!user) return

    const event = {
      user_id: user.id,
      session_id: this.sessionId,
      event_type: eventType,
      event_name: eventName,
      page_url: typeof window !== "undefined" ? window.location.href : undefined,
      element_id: elementInfo?.id,
      element_class: elementInfo?.className,
      element_text: elementInfo?.textContent?.slice(0, 100),
      event_data: eventData,
    }

    await this.supabase.from("user_events").insert(event)

    // Update session actions count
    if (this.currentSession) {
      await this.supabase
        .from("user_sessions")
        .update({ actions_count: this.currentSession.actions_count + 1 })
        .eq("id", this.currentSession.id)
      this.currentSession.actions_count += 1
    }
  }

  async trackPageView(pageTitle?: string) {
    const {
      data: { user },
    } = await this.supabase.auth.getUser()
    if (!user || typeof window === "undefined") return

    // End previous page view if exists
    const timeOnPage = Math.floor((Date.now() - this.pageStartTime) / 1000)
    this.pageStartTime = Date.now()

    const pageView = {
      user_id: user.id,
      session_id: this.sessionId,
      page_url: window.location.href,
      page_title: pageTitle || document.title,
      referrer: document.referrer,
    }

    await this.supabase.from("page_views").insert(pageView)

    // Update session page views count
    if (this.currentSession) {
      await this.supabase
        .from("user_sessions")
        .update({ page_views: this.currentSession.page_views + 1 })
        .eq("id", this.currentSession.id)
      this.currentSession.page_views += 1
    }
  }

  async trackFeatureUsage(featureName: string, featureCategory?: string) {
    const {
      data: { user },
    } = await this.supabase.auth.getUser()
    if (!user) return

    // Start timing for this feature
    this.featureStartTimes.set(featureName, Date.now())

    await this.supabase.rpc("update_feature_usage", {
      p_user_id: user.id,
      p_feature_name: featureName,
      p_feature_category: featureCategory,
      p_time_spent: 0,
    })
  }

  async endFeatureUsage(featureName: string) {
    const {
      data: { user },
    } = await this.supabase.auth.getUser()
    if (!user) return

    const startTime = this.featureStartTimes.get(featureName)
    if (startTime) {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000)
      this.featureStartTimes.delete(featureName)

      await this.supabase.rpc("update_feature_usage", {
        p_user_id: user.id,
        p_feature_name: featureName,
        p_time_spent: timeSpent,
      })
    }
  }

  async trackError(
    error: Error,
    errorType = "javascript",
    severity: "low" | "medium" | "high" | "critical" = "medium",
  ) {
    const {
      data: { user },
    } = await this.supabase.auth.getUser()

    const errorLog = {
      user_id: user?.id,
      session_id: this.sessionId,
      error_type: errorType,
      error_message: error.message,
      error_stack: error.stack,
      page_url: typeof window !== "undefined" ? window.location.href : undefined,
      user_agent: typeof window !== "undefined" ? navigator.userAgent : undefined,
      severity,
    }

    await this.supabase.from("error_logs").insert(errorLog)
  }

  async trackPerformanceMetric(metricName: string, metricValue: number) {
    const {
      data: { user },
    } = await this.supabase.auth.getUser()

    const metric = {
      user_id: user?.id,
      session_id: this.sessionId,
      metric_name: metricName,
      metric_value: metricValue,
      page_url: typeof window !== "undefined" ? window.location.href : undefined,
    }

    await this.supabase.from("performance_metrics").insert(metric)
  }

  async endSession() {
    if (!this.currentSession) return

    const duration = Math.floor((Date.now() - new Date(this.currentSession.started_at).getTime()) / 1000)

    await this.supabase
      .from("user_sessions")
      .update({
        ended_at: new Date().toISOString(),
        duration_seconds: duration,
      })
      .eq("id", this.currentSession.id)
  }

  // Analytics queries
  async getUserAnalytics(userId: string, days = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const [sessions, events, pageViews, featureUsage] = await Promise.all([
      this.supabase
        .from("user_sessions")
        .select("*")
        .eq("user_id", userId)
        .gte("started_at", startDate.toISOString())
        .order("started_at", { ascending: false }),

      this.supabase
        .from("user_events")
        .select("*")
        .eq("user_id", userId)
        .gte("timestamp", startDate.toISOString())
        .order("timestamp", { ascending: false }),

      this.supabase
        .from("page_views")
        .select("*")
        .eq("user_id", userId)
        .gte("timestamp", startDate.toISOString())
        .order("timestamp", { ascending: false }),

      this.supabase.from("feature_usage").select("*").eq("user_id", userId).order("usage_count", { ascending: false }),
    ])

    return {
      sessions: sessions.data || [],
      events: events.data || [],
      pageViews: pageViews.data || [],
      featureUsage: featureUsage.data || [],
    }
  }
}

// Global analytics instance
export const analytics = new AnalyticsService(true)
export const createServerAnalytics = () => new AnalyticsService(false)

// Performance monitoring utilities
export const performanceMonitor = {
  measurePageLoad: () => {
    if (typeof window === "undefined") return

    window.addEventListener("load", () => {
      const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming
      if (navigation) {
        analytics.trackPerformanceMetric("page_load_time", navigation.loadEventEnd - navigation.fetchStart)
        analytics.trackPerformanceMetric(
          "dom_content_loaded",
          navigation.domContentLoadedEventEnd - navigation.fetchStart,
        )
        analytics.trackPerformanceMetric("first_contentful_paint", navigation.loadEventEnd - navigation.fetchStart)
      }
    })
  },

  measureLCP: () => {
    if (typeof window === "undefined") return

    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      const lastEntry = entries[entries.length - 1]
      analytics.trackPerformanceMetric("largest_contentful_paint", lastEntry.startTime)
    }).observe({ entryTypes: ["largest-contentful-paint"] })
  },

  measureFID: () => {
    if (typeof window === "undefined") return

    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      entries.forEach((entry) => {
        analytics.trackPerformanceMetric("first_input_delay", entry.processingStart - entry.startTime)
      })
    }).observe({ entryTypes: ["first-input"] })
  },

  measureCLS: () => {
    if (typeof window === "undefined") return

    let clsValue = 0
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      })
      analytics.trackPerformanceMetric("cumulative_layout_shift", clsValue)
    }).observe({ entryTypes: ["layout-shift"] })
  },
}

export async function trackEvent(eventType: string, eventName: string, eventData: any = {}, elementInfo?: any) {
  return analytics.trackEvent(eventType, eventName, eventData, elementInfo)
}

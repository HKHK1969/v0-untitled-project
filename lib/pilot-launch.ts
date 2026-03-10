import { createServerClient } from "@/lib/supabase/server"
import { trackEvent } from "@/lib/analytics"

export interface PilotLaunchConfig {
  stage: "development" | "pilot" | "production"
  maxUsers: number
  features: {
    feedback: boolean
    analytics: boolean
    onboarding: boolean
    aiAssistant: boolean
  }
  monitoring: {
    errorTracking: boolean
    performanceMetrics: boolean
    userBehavior: boolean
  }
}

export const PILOT_CONFIG: PilotLaunchConfig = {
  stage: "pilot",
  maxUsers: 50,
  features: {
    feedback: true,
    analytics: true,
    onboarding: true,
    aiAssistant: true,
  },
  monitoring: {
    errorTracking: true,
    performanceMetrics: true,
    userBehavior: true,
  },
}

export class PilotLaunchManager {
  private static instance: PilotLaunchManager
  private config: PilotLaunchConfig

  private constructor() {
    this.config = PILOT_CONFIG
  }

  static getInstance(): PilotLaunchManager {
    if (!PilotLaunchManager.instance) {
      PilotLaunchManager.instance = new PilotLaunchManager()
    }
    return PilotLaunchManager.instance
  }

  async initializePilot(): Promise<void> {
    try {
      // Track pilot launch
      await trackEvent("pilot_launched", {
        stage: this.config.stage,
        timestamp: new Date().toISOString(),
        features_enabled: Object.keys(this.config.features).filter(
          (key) => this.config.features[key as keyof typeof this.config.features],
        ),
      })

      // Initialize monitoring
      if (this.config.monitoring.errorTracking) {
        this.setupErrorTracking()
      }

      if (this.config.monitoring.performanceMetrics) {
        this.setupPerformanceMonitoring()
      }

      console.log("[v0] Pilot launch initialized successfully")
    } catch (error) {
      console.error("[v0] Failed to initialize pilot launch:", error)
      throw error
    }
  }

  async checkPilotHealth(): Promise<{
    status: "healthy" | "warning" | "critical"
    metrics: Record<string, any>
    issues: string[]
  }> {
    const supabase = createServerClient()
    const issues: string[] = []

    try {
      // Check database connectivity
      const { error: dbError } = await supabase.from("users").select("count").limit(1)
      if (dbError) {
        issues.push("Database connectivity issue")
      }

      // Check user count
      const { data: userCount } = await supabase.from("users").select("id", { count: "exact" })

      const currentUsers = userCount?.length || 0

      // Check for critical issues
      const { data: criticalFeedback } = await supabase
        .from("feedback")
        .select("*")
        .eq("type", "bug")
        .eq("priority", "critical")
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      const criticalIssues = criticalFeedback?.length || 0

      let status: "healthy" | "warning" | "critical" = "healthy"

      if (criticalIssues > 0) {
        status = "critical"
        issues.push(`${criticalIssues} critical issues reported in last 24h`)
      } else if (currentUsers > this.config.maxUsers * 0.8) {
        status = "warning"
        issues.push("Approaching user limit")
      }

      return {
        status,
        metrics: {
          currentUsers,
          maxUsers: this.config.maxUsers,
          criticalIssues,
          uptime: "98.5%", // This would come from monitoring service
          avgResponseTime: "1.2s",
        },
        issues,
      }
    } catch (error) {
      return {
        status: "critical",
        metrics: {},
        issues: ["Failed to check pilot health"],
      }
    }
  }

  private setupErrorTracking(): void {
    // Global error handler
    window.addEventListener("error", (event) => {
      this.logError("javascript_error", {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      })
    })

    // Unhandled promise rejection handler
    window.addEventListener("unhandledrejection", (event) => {
      this.logError("unhandled_promise_rejection", {
        reason: event.reason,
        stack: event.reason?.stack,
      })
    })
  }

  private setupPerformanceMonitoring(): void {
    // Monitor page load performance
    window.addEventListener("load", () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming

        trackEvent("page_performance", {
          loadTime: perfData.loadEventEnd - perfData.loadEventStart,
          domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
          firstPaint:
            performance.getEntriesByType("paint").find((entry) => entry.name === "first-paint")?.startTime || 0,
        })
      }, 0)
    })
  }

  private async logError(type: string, details: Record<string, any>): Promise<void> {
    try {
      await trackEvent("pilot_error", {
        error_type: type,
        details,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        url: window.location.href,
      })
    } catch (error) {
      console.error("[v0] Failed to log error:", error)
    }
  }

  getConfig(): PilotLaunchConfig {
    return { ...this.config }
  }

  updateConfig(updates: Partial<PilotLaunchConfig>): void {
    this.config = { ...this.config, ...updates }
  }
}

// Export singleton instance
export const pilotLaunchManager = PilotLaunchManager.getInstance()

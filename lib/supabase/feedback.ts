import { createClient } from "@/lib/supabase/client"
import { createClient as createServerClient } from "@/lib/supabase/server"

export interface FeedbackSubmission {
  id: string
  user_id: string
  type: "bug" | "feature" | "improvement" | "general"
  title: string
  description: string
  rating?: number
  page_url?: string
  user_agent?: string
  screenshot_url?: string
  status: "open" | "in-progress" | "resolved" | "closed"
  priority: "low" | "medium" | "high" | "critical"
  created_at: string
  updated_at: string
}

export interface FeatureRequest {
  id: string
  user_id: string
  title: string
  description: string
  category: "ui-ux" | "data-management" | "analytics" | "integrations" | "performance" | "general"
  votes: number
  status: "submitted" | "under-review" | "planned" | "in-development" | "completed" | "rejected"
  priority: "low" | "medium" | "high" | "critical"
  estimated_effort?: "small" | "medium" | "large" | "extra-large"
  target_release?: string
  created_at: string
  updated_at: string
  user_has_voted?: boolean
}

export interface NPSSurvey {
  id: string
  user_id: string
  score: number
  feedback?: string
  survey_type: "periodic" | "feature-specific" | "onboarding" | "exit"
  context: any
  created_at: string
}

export class FeedbackService {
  private supabase: any

  constructor(isClient = true) {
    if (isClient) {
      this.supabase = createClient()
    } else {
      this.initServerClient()
    }
  }

  private async initServerClient() {
    this.supabase = await createServerClient()
  }

  // Feedback submissions
  async submitFeedback(
    feedback: Omit<FeedbackSubmission, "id" | "created_at" | "updated_at" | "status" | "priority">,
  ): Promise<FeedbackSubmission | null> {
    const { data, error } = await this.supabase
      .from("feedback_submissions")
      .insert({
        ...feedback,
        page_url: window.location.href,
        user_agent: navigator.userAgent,
      })
      .select()
      .single()

    if (error) {
      console.error("Error submitting feedback:", error)
      return null
    }
    return data
  }

  async getUserFeedback(userId: string): Promise<FeedbackSubmission[]> {
    const { data, error } = await this.supabase
      .from("feedback_submissions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching user feedback:", error)
      return []
    }
    return data || []
  }

  // Feature requests
  async submitFeatureRequest(
    request: Omit<FeatureRequest, "id" | "created_at" | "updated_at" | "votes" | "status" | "priority">,
  ): Promise<FeatureRequest | null> {
    const { data, error } = await this.supabase.from("feature_requests").insert(request).select().single()

    if (error) {
      console.error("Error submitting feature request:", error)
      return null
    }
    return data
  }

  async getFeatureRequests(userId?: string): Promise<FeatureRequest[]> {
    const query = this.supabase
      .from("feature_requests")
      .select("*")
      .order("votes", { ascending: false })
      .order("created_at", { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error("Error fetching feature requests:", error)
      return []
    }

    // Check if user has voted for each request
    if (userId && data) {
      const { data: votes } = await this.supabase
        .from("feature_request_votes")
        .select("feature_request_id")
        .eq("user_id", userId)

      const votedIds = new Set(votes?.map((v) => v.feature_request_id) || [])

      return data.map((request) => ({
        ...request,
        user_has_voted: votedIds.has(request.id),
      }))
    }

    return data || []
  }

  async voteForFeatureRequest(featureRequestId: string, userId: string): Promise<boolean> {
    const { error } = await this.supabase.from("feature_request_votes").insert({
      feature_request_id: featureRequestId,
      user_id: userId,
    })

    if (error) {
      console.error("Error voting for feature request:", error)
      return false
    }
    return true
  }

  async removeVoteForFeatureRequest(featureRequestId: string, userId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from("feature_request_votes")
      .delete()
      .eq("feature_request_id", featureRequestId)
      .eq("user_id", userId)

    if (error) {
      console.error("Error removing vote:", error)
      return false
    }
    return true
  }

  // NPS surveys
  async submitNPSSurvey(survey: Omit<NPSSurvey, "id" | "created_at">): Promise<NPSSurvey | null> {
    const { data, error } = await this.supabase.from("nps_surveys").insert(survey).select().single()

    if (error) {
      console.error("Error submitting NPS survey:", error)
      return null
    }
    return data
  }

  async getUserNPSSurveys(userId: string): Promise<NPSSurvey[]> {
    const { data, error } = await this.supabase
      .from("nps_surveys")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching NPS surveys:", error)
      return []
    }
    return data || []
  }

  async shouldShowNPSSurvey(userId: string): Promise<boolean> {
    const { data } = await this.supabase
      .from("nps_surveys")
      .select("created_at")
      .eq("user_id", userId)
      .eq("survey_type", "periodic")
      .order("created_at", { ascending: false })
      .limit(1)

    if (!data || data.length === 0) return true

    const lastSurvey = new Date(data[0].created_at)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    return lastSurvey < thirtyDaysAgo
  }
}

// Global instances
export const feedbackService = new FeedbackService(true)
export const createServerFeedbackService = () => new FeedbackService(false)

import { createClient } from "@/lib/supabase/client"
import { createClient as createServerClient } from "@/lib/supabase/server"

export interface PilotUser {
  id: string
  user_id: string
  email: string
  company_name?: string
  role?: string
  industry?: string
  company_size?: string
  invited_by?: string
  invitation_code?: string
  status: "invited" | "active" | "completed" | "dropped"
  onboarding_completed: boolean
  testing_phase: "phase1" | "phase2" | "phase3"
  assigned_tasks: string[]
  completed_tasks: string[]
  feedback_score?: number
  would_recommend?: boolean
  pain_points?: string[]
  feature_requests?: string[]
  testing_notes?: string
  invited_at: string
  activated_at?: string
  completed_at?: string
  last_active_at?: string
}

export interface TestingTask {
  id: string
  name: string
  description: string
  category: "onboarding" | "data-entry" | "navigation" | "features" | "workflow"
  priority: "low" | "medium" | "high"
  estimated_time_minutes?: number
  instructions?: string
  success_criteria?: string
  phase: "phase1" | "phase2" | "phase3"
  is_required: boolean
  order_index: number
}

export interface TaskCompletion {
  id: string
  user_id: string
  task_id: string
  status: "assigned" | "in_progress" | "completed" | "skipped" | "failed"
  started_at?: string
  completed_at?: string
  time_spent_minutes?: number
  difficulty_rating?: number
  completion_notes?: string
  issues_encountered?: string
  suggestions?: string
  task?: TestingTask
}

export interface TestingSession {
  id: string
  user_id: string
  session_type: "self_guided" | "moderated" | "interview"
  phase: "phase1" | "phase2" | "phase3"
  started_at: string
  ended_at?: string
  duration_minutes?: number
  tasks_assigned: number
  tasks_completed: number
  overall_rating?: number
  session_notes?: string
  moderator_notes?: string
  recording_url?: string
}

export class UserTestingService {
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

  // Pilot user management
  async getPilotUser(userId: string): Promise<PilotUser | null> {
    const { data, error } = await this.supabase.from("pilot_users").select("*").eq("user_id", userId).single()

    if (error) {
      console.error("Error fetching pilot user:", error)
      return null
    }
    return data
  }

  async createPilotUser(userData: Partial<PilotUser>): Promise<PilotUser | null> {
    const { data, error } = await this.supabase.from("pilot_users").insert(userData).select().single()

    if (error) {
      console.error("Error creating pilot user:", error)
      return null
    }
    return data
  }

  async updatePilotUser(userId: string, updates: Partial<PilotUser>): Promise<boolean> {
    const { error } = await this.supabase.from("pilot_users").update(updates).eq("user_id", userId)

    if (error) {
      console.error("Error updating pilot user:", error)
      return false
    }
    return true
  }

  // Testing tasks
  async getTestingTasks(phase?: string): Promise<TestingTask[]> {
    let query = this.supabase.from("testing_tasks").select("*").order("order_index", { ascending: true })

    if (phase) {
      query = query.eq("phase", phase)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching testing tasks:", error)
      return []
    }
    return data || []
  }

  async getUserTaskCompletions(userId: string): Promise<TaskCompletion[]> {
    const { data, error } = await this.supabase
      .from("task_completions")
      .select(`
        *,
        task:testing_tasks(*)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching task completions:", error)
      return []
    }
    return data || []
  }

  async assignTasksToUser(userId: string, phase: string): Promise<boolean> {
    const tasks = await this.getTestingTasks(phase)
    const taskCompletions = tasks.map((task) => ({
      user_id: userId,
      task_id: task.id,
      status: "assigned" as const,
    }))

    const { error } = await this.supabase
      .from("task_completions")
      .upsert(taskCompletions, { onConflict: "user_id,task_id" })

    if (error) {
      console.error("Error assigning tasks:", error)
      return false
    }

    // Update pilot user with assigned tasks
    const taskIds = tasks.map((t) => t.id)
    await this.updatePilotUser(userId, { assigned_tasks: taskIds })

    return true
  }

  async updateTaskCompletion(userId: string, taskId: string, updates: Partial<TaskCompletion>): Promise<boolean> {
    const { error } = await this.supabase
      .from("task_completions")
      .update(updates)
      .eq("user_id", userId)
      .eq("task_id", taskId)

    if (error) {
      console.error("Error updating task completion:", error)
      return false
    }

    // Update completed tasks in pilot user if task is completed
    if (updates.status === "completed") {
      const pilotUser = await this.getPilotUser(userId)
      if (pilotUser) {
        const completedTasks = [...(pilotUser.completed_tasks || []), taskId]
        await this.updatePilotUser(userId, { completed_tasks: completedTasks })
      }
    }

    return true
  }

  // Testing sessions
  async createTestingSession(sessionData: Partial<TestingSession>): Promise<TestingSession | null> {
    const { data, error } = await this.supabase.from("testing_sessions").insert(sessionData).select().single()

    if (error) {
      console.error("Error creating testing session:", error)
      return null
    }
    return data
  }

  async endTestingSession(sessionId: string, updates: Partial<TestingSession>): Promise<boolean> {
    const { error } = await this.supabase
      .from("testing_sessions")
      .update({
        ...updates,
        ended_at: new Date().toISOString(),
      })
      .eq("id", sessionId)

    if (error) {
      console.error("Error ending testing session:", error)
      return false
    }
    return true
  }

  async getUserTestingSessions(userId: string): Promise<TestingSession[]> {
    const { data, error } = await this.supabase
      .from("testing_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("started_at", { ascending: false })

    if (error) {
      console.error("Error fetching testing sessions:", error)
      return []
    }
    return data || []
  }

  // Progress tracking
  async getUserProgress(userId: string): Promise<{
    phase: string
    tasksAssigned: number
    tasksCompleted: number
    completionRate: number
    averageDifficulty: number
    totalTimeSpent: number
  }> {
    const [pilotUser, taskCompletions] = await Promise.all([
      this.getPilotUser(userId),
      this.getUserTaskCompletions(userId),
    ])

    const completedTasks = taskCompletions.filter((tc) => tc.status === "completed")
    const totalTimeSpent = completedTasks.reduce((sum, tc) => sum + (tc.time_spent_minutes || 0), 0)
    const averageDifficulty =
      completedTasks.length > 0
        ? completedTasks.reduce((sum, tc) => sum + (tc.difficulty_rating || 0), 0) / completedTasks.length
        : 0

    return {
      phase: pilotUser?.testing_phase || "phase1",
      tasksAssigned: taskCompletions.length,
      tasksCompleted: completedTasks.length,
      completionRate: taskCompletions.length > 0 ? (completedTasks.length / taskCompletions.length) * 100 : 0,
      averageDifficulty,
      totalTimeSpent,
    }
  }

  // Analytics
  async getPilotAnalytics(): Promise<{
    totalUsers: number
    activeUsers: number
    completedUsers: number
    averageCompletionRate: number
    commonPainPoints: string[]
    topFeatureRequests: string[]
  }> {
    const { data: pilotUsers } = await this.supabase.from("pilot_users").select("*")

    if (!pilotUsers)
      return {
        totalUsers: 0,
        activeUsers: 0,
        completedUsers: 0,
        averageCompletionRate: 0,
        commonPainPoints: [],
        topFeatureRequests: [],
      }

    const totalUsers = pilotUsers.length
    const activeUsers = pilotUsers.filter((u) => u.status === "active").length
    const completedUsers = pilotUsers.filter((u) => u.status === "completed").length

    // Calculate average completion rate
    const completionRates = await Promise.all(pilotUsers.map((user) => this.getUserProgress(user.user_id)))
    const averageCompletionRate =
      completionRates.length > 0
        ? completionRates.reduce((sum, p) => sum + p.completionRate, 0) / completionRates.length
        : 0

    // Aggregate pain points and feature requests
    const allPainPoints = pilotUsers.flatMap((u) => u.pain_points || [])
    const allFeatureRequests = pilotUsers.flatMap((u) => u.feature_requests || [])

    const painPointCounts = allPainPoints.reduce(
      (acc, point) => {
        acc[point] = (acc[point] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const featureRequestCounts = allFeatureRequests.reduce(
      (acc, request) => {
        acc[request] = (acc[request] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const commonPainPoints = Object.entries(painPointCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([point]) => point)

    const topFeatureRequests = Object.entries(featureRequestCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([request]) => request)

    return {
      totalUsers,
      activeUsers,
      completedUsers,
      averageCompletionRate,
      commonPainPoints,
      topFeatureRequests,
    }
  }
}

// Global instance
export const userTestingService = new UserTestingService(true)
export const createServerUserTestingService = () => new UserTestingService(false)

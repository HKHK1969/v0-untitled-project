import { createClient } from "@/lib/supabase/client"
import { createClient as createServerClient } from "@/lib/supabase/server"

export interface OnboardingStep {
  id: number
  name: string
  title: string
  description: string
  component: string
  isOptional?: boolean
  estimatedTime?: string
}

export interface UserOnboarding {
  id: string
  user_id: string
  current_step: number
  completed_steps: number[]
  skipped_steps: number[]
  onboarding_data: any
  is_completed: boolean
  started_at: string
  completed_at?: string
  updated_at: string
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 0,
    name: "welcome",
    title: "Welcome to Sourcing Ninja",
    description: "Let's get you set up with your supply chain tracking system",
    component: "WelcomeStep",
    estimatedTime: "1 min",
  },
  {
    id: 1,
    name: "profile_setup",
    title: "Set Up Your Profile",
    description: "Tell us about your business and role",
    component: "ProfileSetupStep",
    estimatedTime: "2 min",
  },
  {
    id: 2,
    name: "first_supplier",
    title: "Add Your First Supplier",
    description: "Start building your supplier database",
    component: "FirstSupplierStep",
    estimatedTime: "3 min",
  },
  {
    id: 3,
    name: "first_product",
    title: "Create Your First Product",
    description: "Add a product or style to track",
    component: "FirstProductStep",
    estimatedTime: "3 min",
  },
  {
    id: 4,
    name: "sample_order",
    title: "Create a Sample Order",
    description: "Learn how to track sample orders",
    component: "SampleOrderStep",
    estimatedTime: "4 min",
    isOptional: true,
  },
  {
    id: 5,
    name: "dashboard_tour",
    title: "Explore Your Dashboard",
    description: "Get familiar with key features and navigation",
    component: "DashboardTourStep",
    estimatedTime: "3 min",
  },
  {
    id: 6,
    name: "completion",
    title: "You're All Set!",
    description: "Congratulations! You're ready to manage your supply chain",
    component: "CompletionStep",
    estimatedTime: "1 min",
  },
]

export class OnboardingService {
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

  async getUserOnboarding(userId: string): Promise<UserOnboarding | null> {
    const { data, error } = await this.supabase.from("user_onboarding").select("*").eq("user_id", userId).single()

    if (error) {
      console.error("Error fetching user onboarding:", error)
      return null
    }
    return data
  }

  async initializeOnboarding(userId: string): Promise<UserOnboarding | null> {
    const { data, error } = await this.supabase
      .from("user_onboarding")
      .upsert(
        {
          user_id: userId,
          current_step: 0,
          completed_steps: [],
          skipped_steps: [],
          onboarding_data: {},
          is_completed: false,
        },
        { onConflict: "user_id" },
      )
      .select()
      .single()

    if (error) {
      console.error("Error initializing onboarding:", error)
      return null
    }
    return data
  }

  async updateOnboardingStep(userId: string, stepNumber: number, data?: any, wasSkipped = false): Promise<boolean> {
    const currentOnboarding = await this.getUserOnboarding(userId)
    if (!currentOnboarding) return false

    const completedSteps = wasSkipped
      ? currentOnboarding.completed_steps
      : [...currentOnboarding.completed_steps, stepNumber]

    const skippedSteps = wasSkipped ? [...currentOnboarding.skipped_steps, stepNumber] : currentOnboarding.skipped_steps

    const nextStep = stepNumber + 1
    const isCompleted = nextStep >= ONBOARDING_STEPS.length

    const updateData: any = {
      current_step: isCompleted ? stepNumber : nextStep,
      completed_steps: completedSteps,
      skipped_steps: skippedSteps,
      is_completed: isCompleted,
      onboarding_data: {
        ...currentOnboarding.onboarding_data,
        ...data,
      },
    }

    if (isCompleted) {
      updateData.completed_at = new Date().toISOString()
    }

    const { error } = await this.supabase.from("user_onboarding").update(updateData).eq("user_id", userId)

    if (error) {
      console.error("Error updating onboarding step:", error)
      return false
    }

    // Track step completion for analytics
    await this.trackStepCompletion(userId, stepNumber, ONBOARDING_STEPS[stepNumber]?.name, wasSkipped)

    return true
  }

  async trackStepCompletion(
    userId: string,
    stepNumber: number,
    stepName: string,
    wasSkipped = false,
    timeSpent?: number,
  ): Promise<void> {
    const { error } = await this.supabase.from("onboarding_step_completions").insert({
      user_id: userId,
      step_number: stepNumber,
      step_name: stepName,
      was_skipped: wasSkipped,
      time_spent_seconds: timeSpent,
    })

    if (error) {
      console.error("Error tracking step completion:", error)
    }
  }

  async resetOnboarding(userId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from("user_onboarding")
      .update({
        current_step: 0,
        completed_steps: [],
        skipped_steps: [],
        is_completed: false,
        completed_at: null,
      })
      .eq("user_id", userId)

    if (error) {
      console.error("Error resetting onboarding:", error)
      return false
    }
    return true
  }

  async shouldShowOnboarding(userId: string): Promise<boolean> {
    const onboarding = await this.getUserOnboarding(userId)
    return !onboarding?.is_completed
  }

  getStepByNumber(stepNumber: number): OnboardingStep | undefined {
    return ONBOARDING_STEPS.find((step) => step.id === stepNumber)
  }

  getTotalSteps(): number {
    return ONBOARDING_STEPS.length
  }

  getRequiredSteps(): OnboardingStep[] {
    return ONBOARDING_STEPS.filter((step) => !step.isOptional)
  }
}

// Global instance
export const onboardingService = new OnboardingService(true)
export const createServerOnboardingService = () => new OnboardingService(false)

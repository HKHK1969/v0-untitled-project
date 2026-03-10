"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { X, ArrowLeft, Clock, SkipForward } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { onboardingService, ONBOARDING_STEPS, type UserOnboarding, type OnboardingStep } from "@/lib/onboarding"
import { WelcomeStep } from "./onboarding-steps/welcome-step"
import { ProfileSetupStep } from "./onboarding-steps/profile-setup-step"
import { FirstSupplierStep } from "./onboarding-steps/first-supplier-step"
import { FirstProductStep } from "./onboarding-steps/first-product-step"
import { SampleOrderStep } from "./onboarding-steps/sample-order-step"
import { DashboardTourStep } from "./onboarding-steps/dashboard-tour-step"
import { CompletionStep } from "./onboarding-steps/completion-step"

interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

export function OnboardingModal({ isOpen, onClose, onComplete }: OnboardingModalProps) {
  const [user, setUser] = useState<any>(null)
  const [onboarding, setOnboarding] = useState<UserOnboarding | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [stepStartTime, setStepStartTime] = useState<number>(Date.now())
  const supabase = createClient()

  useEffect(() => {
    const initializeOnboarding = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      setUser(user)
      let userOnboarding = await onboardingService.getUserOnboarding(user.id)

      if (!userOnboarding) {
        userOnboarding = await onboardingService.initializeOnboarding(user.id)
      }

      if (userOnboarding) {
        setOnboarding(userOnboarding)
        setCurrentStep(userOnboarding.current_step)
      }
      setIsLoading(false)
    }

    if (isOpen) {
      initializeOnboarding()
      setStepStartTime(Date.now())
    }
  }, [isOpen, supabase])

  const handleNextStep = async (stepData?: any) => {
    if (!user || !onboarding) return

    const timeSpent = Math.floor((Date.now() - stepStartTime) / 1000)
    const success = await onboardingService.updateOnboardingStep(user.id, currentStep, stepData)

    if (success) {
      await onboardingService.trackStepCompletion(user.id, currentStep, getCurrentStepInfo().name, false, timeSpent)

      if (currentStep >= ONBOARDING_STEPS.length - 1) {
        onComplete()
        onClose()
      } else {
        setCurrentStep(currentStep + 1)
        setStepStartTime(Date.now())
      }
    }
  }

  const handleSkipStep = async () => {
    if (!user || !getCurrentStepInfo().isOptional) return

    const timeSpent = Math.floor((Date.now() - stepStartTime) / 1000)
    const success = await onboardingService.updateOnboardingStep(user.id, currentStep, {}, true)

    if (success) {
      await onboardingService.trackStepCompletion(user.id, currentStep, getCurrentStepInfo().name, true, timeSpent)

      if (currentStep >= ONBOARDING_STEPS.length - 1) {
        onComplete()
        onClose()
      } else {
        setCurrentStep(currentStep + 1)
        setStepStartTime(Date.now())
      }
    }
  }

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setStepStartTime(Date.now())
    }
  }

  const getCurrentStepInfo = (): OnboardingStep => {
    return ONBOARDING_STEPS[currentStep] || ONBOARDING_STEPS[0]
  }

  const getProgressPercentage = (): number => {
    return ((currentStep + 1) / ONBOARDING_STEPS.length) * 100
  }

  const renderStepComponent = () => {
    const stepInfo = getCurrentStepInfo()
    const commonProps = {
      onNext: handleNextStep,
      onSkip: handleSkipStep,
      stepData: onboarding?.onboarding_data || {},
      user,
    }

    switch (stepInfo.component) {
      case "WelcomeStep":
        return <WelcomeStep {...commonProps} />
      case "ProfileSetupStep":
        return <ProfileSetupStep {...commonProps} />
      case "FirstSupplierStep":
        return <FirstSupplierStep {...commonProps} />
      case "FirstProductStep":
        return <FirstProductStep {...commonProps} />
      case "SampleOrderStep":
        return <SampleOrderStep {...commonProps} />
      case "DashboardTourStep":
        return <DashboardTourStep {...commonProps} />
      case "CompletionStep":
        return <CompletionStep {...commonProps} onComplete={onComplete} onClose={onClose} />
      default:
        return <div>Step not found</div>
    }
  }

  if (!isOpen || isLoading) return null

  const stepInfo = getCurrentStepInfo()

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  Step {currentStep + 1} of {ONBOARDING_STEPS.length}
                </span>
                {stepInfo.isOptional && <Badge variant="secondary">Optional</Badge>}
              </div>
              {stepInfo.estimatedTime && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {stepInfo.estimatedTime}
                </div>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Progress value={getProgressPercentage()} className="w-full" />
          <div>
            <CardTitle className="text-xl">{stepInfo.title}</CardTitle>
            <CardDescription className="text-base">{stepInfo.description}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="overflow-y-auto max-h-[60vh]">{renderStepComponent()}</CardContent>
        <div className="p-6 pt-0 border-t bg-muted/20">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePreviousStep}
              disabled={currentStep === 0}
              className="flex items-center gap-2 bg-transparent"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center gap-2">
              {stepInfo.isOptional && (
                <Button variant="ghost" onClick={handleSkipStep} className="flex items-center gap-2">
                  <SkipForward className="h-4 w-4" />
                  Skip
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

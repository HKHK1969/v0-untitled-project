"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle, ArrowRight, BookOpen, MessageCircle, BarChart3 } from "lucide-react"

interface CompletionStepProps {
  onNext: (data?: any) => void
  onComplete: () => void
  onClose: () => void
  stepData: any
  user: any
}

export function CompletionStep({ onComplete, onClose }: CompletionStepProps) {
  const nextSteps = [
    {
      icon: <BarChart3 className="h-5 w-5 text-blue-600" />,
      title: "Explore Your Dashboard",
      description: "View analytics and track your supply chain performance",
    },
    {
      icon: <BookOpen className="h-5 w-5 text-green-600" />,
      title: "Check Out Help Resources",
      description: "Learn advanced features and best practices",
    },
    {
      icon: <MessageCircle className="h-5 w-5 text-purple-600" />,
      title: "Share Feedback",
      description: "Help us improve by sharing your thoughts",
    },
  ]

  const handleComplete = () => {
    onComplete()
    onClose()
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Congratulations! 🎉</h2>
        <p className="text-muted-foreground text-lg">
          You've successfully set up your supply chain tracking system. You're now ready to streamline your operations
          and gain valuable insights.
        </p>
      </div>

      <div className="bg-muted/50 rounded-lg p-6">
        <h3 className="font-semibold mb-4">What you've accomplished:</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>Set up your business profile</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>Added your first supplier</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>Created your first product</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>Learned the key features</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-4">Recommended next steps:</h3>
        <div className="space-y-3">
          {nextSteps.map((step, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <div className="flex-shrink-0">{step.icon}</div>
              <div>
                <h4 className="font-medium text-sm">{step.title}</h4>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center pt-4">
        <Button onClick={handleComplete} size="lg" className="flex items-center gap-2">
          Start Using Sourcing Ninja
          <ArrowRight className="h-4 w-4" />
        </Button>
        <p className="text-xs text-muted-foreground mt-2">You can always restart this onboarding from your settings</p>
      </div>
    </div>
  )
}

"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Zap, Shield, BarChart3 } from "lucide-react"

interface WelcomeStepProps {
  onNext: (data?: any) => void
  onSkip?: () => void
  stepData: any
  user: any
}

export function WelcomeStep({ onNext, user }: WelcomeStepProps) {
  const features = [
    {
      icon: <Zap className="h-5 w-5 text-blue-600" />,
      title: "Streamlined Tracking",
      description: "Manage suppliers, products, and orders in one place",
    },
    {
      icon: <Shield className="h-5 w-5 text-green-600" />,
      title: "Secure & Reliable",
      description: "Your data is protected with enterprise-grade security",
    },
    {
      icon: <BarChart3 className="h-5 w-5 text-purple-600" />,
      title: "Powerful Analytics",
      description: "Get insights into your supply chain performance",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Zap className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Welcome to Sourcing Ninja!</h2>
        <p className="text-muted-foreground text-lg">
          Hi {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "there"}! 👋
        </p>
        <p className="text-muted-foreground mt-2">
          We're excited to help you streamline your apparel supply chain management. Let's get you set up in just a few
          minutes.
        </p>
      </div>

      <div className="grid gap-4">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
            <div className="flex-shrink-0">{feature.icon}</div>
            <div>
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center pt-4">
        <Button onClick={() => onNext()} size="lg" className="flex items-center gap-2">
          Let's Get Started
          <ArrowRight className="h-4 w-4" />
        </Button>
        <p className="text-xs text-muted-foreground mt-2">This will take about 10-15 minutes to complete</p>
      </div>
    </div>
  )
}

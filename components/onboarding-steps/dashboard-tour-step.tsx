"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Package, Users, ShoppingCart, TrendingUp, Bell, Settings, Eye, ArrowRight } from "lucide-react"

interface DashboardTourStepProps {
  onNext: (data: any) => void
  onSkip: () => void
  stepData: any
  user: any
}

export function DashboardTourStep({ onNext, onSkip, stepData }: DashboardTourStepProps) {
  const [currentFeature, setCurrentFeature] = useState(0)

  const features = [
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Track key metrics like order completion rates, supplier performance, and delivery times.",
      highlight: "Real-time insights",
    },
    {
      icon: Package,
      title: "Product Management",
      description: "Manage your product catalog, specifications, and track each item through the supply chain.",
      highlight: "Complete visibility",
    },
    {
      icon: Users,
      title: "Supplier Network",
      description: "Maintain relationships with suppliers, track performance, and manage communications.",
      highlight: "Centralized contacts",
    },
    {
      icon: ShoppingCart,
      title: "Order Tracking",
      description: "Monitor orders from placement to delivery with automated status updates and notifications.",
      highlight: "End-to-end tracking",
    },
    {
      icon: TrendingUp,
      title: "Performance Reports",
      description: "Generate detailed reports on supplier performance, cost analysis, and delivery metrics.",
      highlight: "Data-driven decisions",
    },
    {
      icon: Bell,
      title: "Smart Notifications",
      description: "Get alerts for delays, quality issues, and important milestones in your supply chain.",
      highlight: "Stay informed",
    },
  ]

  const handleNext = () => {
    onNext({ dashboardTour: { completed: true, featuresViewed: features.length } })
  }

  const nextFeature = () => {
    if (currentFeature < features.length - 1) {
      setCurrentFeature(currentFeature + 1)
    }
  }

  const prevFeature = () => {
    if (currentFeature > 0) {
      setCurrentFeature(currentFeature - 1)
    }
  }

  const currentFeatureData = features[currentFeature]
  const FeatureIcon = currentFeatureData.icon

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Explore Your Dashboard
          </CardTitle>
          <CardDescription>
            Let's take a quick tour of the key features that will help you manage your supply chain effectively.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <div className="text-sm text-muted-foreground mb-2">
              Feature {currentFeature + 1} of {features.length}
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentFeature + 1) / features.length) * 100}%` }}
              />
            </div>
          </div>

          <Card className="border-2 border-primary/20">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <FeatureIcon className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{currentFeatureData.title}</h3>
                  <Badge variant="secondary" className="mb-3">
                    {currentFeatureData.highlight}
                  </Badge>
                  <p className="text-muted-foreground leading-relaxed">{currentFeatureData.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between items-center mt-6">
            <Button variant="outline" onClick={prevFeature} disabled={currentFeature === 0}>
              Previous
            </Button>

            <div className="flex gap-2">
              {features.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentFeature ? "bg-primary" : "bg-muted"
                  }`}
                  onClick={() => setCurrentFeature(index)}
                />
              ))}
            </div>

            {currentFeature < features.length - 1 ? (
              <Button onClick={nextFeature} className="flex items-center gap-2">
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleNext} className="flex items-center gap-2">
                Start Using Dashboard
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          You can access all these features from your main dashboard once onboarding is complete.
        </p>
      </div>
    </div>
  )
}

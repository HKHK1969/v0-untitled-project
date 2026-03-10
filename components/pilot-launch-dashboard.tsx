"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Target,
  BarChart3,
  Settings,
  Rocket,
} from "lucide-react"
import { getDeploymentConfig } from "@/lib/deployment-config"

interface PilotMetrics {
  totalUsers: number
  activeUsers: number
  feedbackCount: number
  npsScore: number
  completionRate: number
  criticalIssues: number
  featureUsage: Record<string, number>
}

export function PilotLaunchDashboard() {
  const [metrics, setMetrics] = useState<PilotMetrics>({
    totalUsers: 0,
    activeUsers: 0,
    feedbackCount: 0,
    npsScore: 0,
    completionRate: 0,
    criticalIssues: 0,
    featureUsage: {},
  })
  const [deploymentStage, setDeploymentStage] = useState<string>("pilot")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Initialize deployment configuration
    const config = getDeploymentConfig()
    setDeploymentStage(config.stage)

    // Simulate loading pilot metrics
    const timer = setTimeout(() => {
      setMetrics({
        totalUsers: 12,
        activeUsers: 8,
        feedbackCount: 23,
        npsScore: 8.2,
        completionRate: 75,
        criticalIssues: 2,
        featureUsage: {
          "Data Manager": 85,
          "Import/Export": 60,
          Tables: 95,
          Analytics: 40,
        },
      })
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const launchChecklist = [
    { item: "Database Schema Created", completed: true },
    { item: "User Authentication Setup", completed: true },
    { item: "Feedback System Active", completed: true },
    { item: "Analytics Tracking", completed: true },
    { item: "Onboarding Flow", completed: true },
    { item: "Pilot Users Invited", completed: false },
    { item: "Monitoring Dashboard", completed: true },
    { item: "Support Documentation", completed: true },
  ]

  const completedItems = launchChecklist.filter((item) => item.completed).length
  const completionPercentage = (completedItems / launchChecklist.length) * 100

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p>Loading pilot dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Rocket className="h-8 w-8 text-blue-600" />
            Pilot Launch Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Monitor your pilot deployment and user feedback</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          Stage: {deploymentStage.toUpperCase()}
        </Badge>
      </div>

      {/* Launch Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Launch Readiness
          </CardTitle>
          <CardDescription>Complete all items to be fully ready for pilot launch</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">
                {completedItems}/{launchChecklist.length} completed
              </span>
            </div>
            <Progress value={completionPercentage} className="h-2" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
              {launchChecklist.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  {item.completed ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Clock className="h-4 w-4 text-yellow-600" />
                  )}
                  <span className={`text-sm ${item.completed ? "text-green-700" : "text-yellow-700"}`}>
                    {item.item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalUsers}</div>
            <p className="text-xs text-muted-foreground">{metrics.activeUsers} active today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Feedback Items</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.feedbackCount}</div>
            <p className="text-xs text-muted-foreground">Across all categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">NPS Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.npsScore}/10</div>
            <p className="text-xs text-muted-foreground">Net Promoter Score</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.criticalIssues}</div>
            <p className="text-xs text-muted-foreground">Require immediate attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="usage" className="space-y-4">
        <TabsList>
          <TabsTrigger value="usage">Feature Usage</TabsTrigger>
          <TabsTrigger value="feedback">User Feedback</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Feature Adoption
              </CardTitle>
              <CardDescription>How users are engaging with different features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(metrics.featureUsage).map(([feature, usage]) => (
                  <div key={feature} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{feature}</span>
                      <span>{usage}%</span>
                    </div>
                    <Progress value={usage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Feedback</CardTitle>
              <CardDescription>Latest user feedback and suggestions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-l-4 border-green-500 pl-4">
                  <p className="text-sm font-medium">Feature Request</p>
                  <p className="text-sm text-muted-foreground">
                    "Would love to see bulk import functionality for suppliers"
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">2 hours ago</p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <p className="text-sm font-medium">General Feedback</p>
                  <p className="text-sm text-muted-foreground">"The interface is intuitive and easy to navigate"</p>
                  <p className="text-xs text-muted-foreground mt-1">5 hours ago</p>
                </div>
                <div className="border-l-4 border-red-500 pl-4">
                  <p className="text-sm font-medium">Bug Report</p>
                  <p className="text-sm text-muted-foreground">"Export function sometimes fails with large datasets"</p>
                  <p className="text-xs text-muted-foreground mt-1">1 day ago</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Performance</CardTitle>
              <CardDescription>Application performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">98.5%</div>
                  <p className="text-sm text-muted-foreground">Uptime</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">1.2s</div>
                  <p className="text-sm text-muted-foreground">Avg Load Time</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">0.1%</div>
                  <p className="text-sm text-muted-foreground">Error Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Next Steps
          </CardTitle>
          <CardDescription>Recommended actions to improve your pilot</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Address Critical Issues</p>
                <p className="text-sm text-muted-foreground">Review and fix the 2 critical issues reported by users</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Invite More Pilot Users</p>
                <p className="text-sm text-muted-foreground">Expand your pilot program to get more diverse feedback</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Improve Analytics Feature</p>
                <p className="text-sm text-muted-foreground">Only 40% usage - consider improving discoverability</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

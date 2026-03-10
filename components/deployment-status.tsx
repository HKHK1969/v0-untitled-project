"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, AlertCircle, Clock, RefreshCw, ExternalLink } from "lucide-react"
import { DEPLOYMENT_CONFIG } from "@/lib/deployment-config"

interface SystemStatus {
  service: string
  status: "operational" | "degraded" | "down" | "maintenance"
  lastChecked: string
  responseTime?: number
}

export function DeploymentStatus() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus[]>([
    { service: "Web Application", status: "operational", lastChecked: new Date().toISOString() },
    { service: "Database", status: "operational", lastChecked: new Date().toISOString() },
    { service: "Authentication", status: "operational", lastChecked: new Date().toISOString() },
    { service: "File Storage", status: "operational", lastChecked: new Date().toISOString() },
    { service: "Analytics", status: "operational", lastChecked: new Date().toISOString() },
  ])
  const [isRefreshing, setIsRefreshing] = useState(false)

  const getStatusIcon = (status: SystemStatus["status"]) => {
    switch (status) {
      case "operational":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "degraded":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case "down":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case "maintenance":
        return <Clock className="h-4 w-4 text-blue-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: SystemStatus["status"]) => {
    switch (status) {
      case "operational":
        return "bg-green-100 text-green-800"
      case "degraded":
        return "bg-yellow-100 text-yellow-800"
      case "down":
        return "bg-red-100 text-red-800"
      case "maintenance":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const refreshStatus = async () => {
    setIsRefreshing(true)
    // Simulate API call to check system status
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setSystemStatus((prev) =>
      prev.map((service) => ({
        ...service,
        lastChecked: new Date().toISOString(),
      })),
    )

    setIsRefreshing(false)
  }

  const overallStatus = systemStatus.every((s) => s.status === "operational")
    ? "All Systems Operational"
    : systemStatus.some((s) => s.status === "down")
      ? "System Issues Detected"
      : "Partial Service Degradation"

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              System Status
              <Badge variant="outline" className="text-xs">
                v{DEPLOYMENT_CONFIG.version.app}
              </Badge>
            </CardTitle>
            <CardDescription>Real-time status of all system components</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshStatus}
            disabled={isRefreshing}
            className="flex items-center gap-2 bg-transparent"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="font-medium">{overallStatus}</span>
          <Badge variant="secondary" className="ml-auto">
            {DEPLOYMENT_CONFIG.isPilot ? "Pilot" : "Production"}
          </Badge>
        </div>

        <div className="space-y-2">
          {systemStatus.map((service) => (
            <div key={service.service} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                {getStatusIcon(service.status)}
                <span className="font-medium">{service.service}</span>
              </div>
              <div className="flex items-center gap-3">
                {service.responseTime && (
                  <span className="text-sm text-muted-foreground">{service.responseTime}ms</span>
                )}
                <Badge className={getStatusColor(service.status)}>{service.status}</Badge>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Deployment:</span>
              <span className="ml-2 font-medium">{DEPLOYMENT_CONFIG.isPilot ? "Pilot Environment" : "Production"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Last Updated:</span>
              <span className="ml-2 font-medium">
                {new Date(DEPLOYMENT_CONFIG.version.lastUpdated).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Region:</span>
              <span className="ml-2 font-medium">US East</span>
            </div>
            <div>
              <span className="text-muted-foreground">Uptime:</span>
              <span className="ml-2 font-medium">99.9%</span>
            </div>
          </div>
        </div>

        {DEPLOYMENT_CONFIG.isPilot && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Pilot Program Status</h4>
                <p className="text-sm text-muted-foreground">Limited to {DEPLOYMENT_CONFIG.pilot.maxUsers} users</p>
              </div>
              <Button size="sm" variant="outline" asChild>
                <a href={DEPLOYMENT_CONFIG.urls.support} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Report Issues
                </a>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

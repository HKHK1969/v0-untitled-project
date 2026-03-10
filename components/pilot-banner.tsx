"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, Beaker, MessageCircle, ExternalLink } from "lucide-react"
import { DEPLOYMENT_CONFIG } from "@/lib/deployment-config"

export function PilotBanner() {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const isDismissed = localStorage.getItem("pilot_banner_dismissed")
    setDismissed(!!isDismissed)
  }, [])

  const handleDismiss = () => {
    localStorage.setItem("pilot_banner_dismissed", "true")
    setDismissed(true)
  }

  if (!DEPLOYMENT_CONFIG.isPilot || dismissed) {
    return null
  }

  return (
    <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Beaker className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Welcome to the Pilot Program!</CardTitle>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Beta v{DEPLOYMENT_CONFIG.version.app}
              </Badge>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleDismiss} className="h-6 w-6 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="text-base">
          You're using an early version of Sourcing Ninja. Help us improve by sharing your feedback and reporting any
          issues you encounter.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-sm">Full Access</h4>
              <p className="text-xs text-muted-foreground">All core features are available for testing</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-sm">Your Data is Safe</h4>
              <p className="text-xs text-muted-foreground">All data is securely stored and backed up</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-sm">Direct Support</h4>
              <p className="text-xs text-muted-foreground">Get priority support during the pilot</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-blue-200">
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            <MessageCircle className="h-4 w-4 mr-2" />
            Share Feedback
          </Button>

          <Button size="sm" variant="outline" asChild>
            <a href={DEPLOYMENT_CONFIG.urls.support} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Get Support
            </a>
          </Button>

          <div className="ml-auto text-xs text-muted-foreground">Pilot ends: March 2025</div>
        </div>
      </CardContent>
    </Card>
  )
}

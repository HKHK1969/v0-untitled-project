"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Rocket, X, ExternalLink } from "lucide-react"
import Link from "next/link"

export function PilotLaunchBanner() {
  const [isVisible, setIsVisible] = useState(true)
  const [isLaunched, setIsLaunched] = useState(false)

  useEffect(() => {
    // Check if pilot has been launched
    const launchStatus = localStorage.getItem("pilot_launched")
    if (launchStatus === "true") {
      setIsLaunched(true)
    }
  }, [])

  const handleLaunch = () => {
    setIsLaunched(true)
    localStorage.setItem("pilot_launched", "true")

    // Track launch event
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "pilot_launched", {
        event_category: "pilot",
        event_label: "manual_launch",
      })
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem("pilot_banner_dismissed", "true")
  }

  if (!isVisible) return null

  return (
    <Alert className="border-blue-200 bg-blue-50 mb-4">
      <Rocket className="h-4 w-4 text-blue-600" />
      <AlertDescription className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <div>
            <span className="font-medium text-blue-900">
              {isLaunched ? "🎉 Pilot Successfully Launched!" : "Ready to Launch Pilot"}
            </span>
            <p className="text-sm text-blue-700 mt-1">
              {isLaunched
                ? "Your pilot is now live and collecting user feedback. Monitor progress in the dashboard."
                : "All systems are ready. Launch your pilot to start collecting user feedback and testing with real users."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-white">
              {isLaunched ? "LIVE" : "READY"}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          {!isLaunched && (
            <Button onClick={handleLaunch} size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Rocket className="h-4 w-4 mr-1" />
              Launch Pilot
            </Button>
          )}
          <Button asChild variant="outline" size="sm">
            <Link href="/pilot-dashboard">
              <ExternalLink className="h-4 w-4 mr-1" />
              Dashboard
            </Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}

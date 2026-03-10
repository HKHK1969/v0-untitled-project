"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface DashboardLayoutProps {
  title: string
  description?: string
  children: React.ReactNode | ((activeTab: string, timeRange: string) => React.ReactNode)
  tabs?: { id: string; label: string }[]
  defaultTab?: string
  timeRanges?: boolean
  backLink?: string
  backLabel?: string
  onTimeRangeChange?: (timeRange: string) => void
}

export function DashboardLayout({
  title,
  description,
  children,
  tabs,
  defaultTab,
  timeRanges = false,
  backLink = "/analytics",
  backLabel = "Analytics",
  onTimeRangeChange,
}: DashboardLayoutProps) {
  const [timeRange, setTimeRange] = useState("quarter")
  const [activeTab, setActiveTab] = useState(defaultTab || (tabs && tabs.length > 0 ? tabs[0].id : ""))

  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value)
    if (onTimeRangeChange) {
      onTimeRangeChange(value)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-background border-b">
        <div className="container flex h-16 items-center px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard" className="flex items-center gap-2">
                <span className="text-lg">🥷</span>
                <span className="sr-only">Home</span>
              </Link>
            </Button>
            <Link href="/" className="text-lg font-semibold">
              Apparel Supply Chain Tracker
            </Link>
          </div>
          <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
            <Link href="/dashboard" className="text-sm font-medium hover:underline underline-offset-4">
              Dashboard
            </Link>
            <Link href="/tables" className="text-sm font-medium hover:underline underline-offset-4">
              Tables
            </Link>
            <Link href="/analytics" className="text-sm font-medium hover:underline underline-offset-4">
              Analytics
            </Link>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button variant="ghost" size="icon" asChild className="mr-2">
                <Link href={backLink}>
                  <ArrowLeft className="h-4 w-4" />
                  <span className="sr-only">Back to {backLabel}</span>
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                {description && <p className="text-muted-foreground">{description}</p>}
              </div>
            </div>

            {timeRanges && (
              <div className="flex items-center gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="time-range">Time Range</Label>
                  <Select value={timeRange} onValueChange={handleTimeRangeChange}>
                    <SelectTrigger id="time-range" className="w-[180px]">
                      <SelectValue placeholder="Select time range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Month</SelectItem>
                      <SelectItem value="quarter">Quarter</SelectItem>
                      <SelectItem value="year">Year</SelectItem>
                      <SelectItem value="ytd">Year to Date</SelectItem>
                      <SelectItem value="all">All Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {tabs && tabs.length > 0 ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList>
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {tabs.map((tab) => (
                <TabsContent key={tab.id} value={tab.id} className="space-y-4">
                  {typeof children === "function" ? children(tab.id, timeRange) : children}
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <div className="space-y-4">{typeof children === "function" ? children(null, timeRange) : children}</div>
          )}
        </div>
      </main>
    </div>
  )
}

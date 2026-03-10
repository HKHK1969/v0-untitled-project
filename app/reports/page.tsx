"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, FileText, Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { tables } from "@/lib/data-structure"
import { loadData } from "@/lib/data-persistence"
import { generateText } from "ai"
import { xai } from "@ai-sdk/xai"

// Report types
const REPORT_TYPES = [
  { id: "order-status", name: "Order Status Report" },
  { id: "supplier-performance", name: "Supplier Performance" },
  { id: "delivery-timeline", name: "Delivery Timeline" },
  { id: "production-status", name: "Production Status" },
  { id: "quality-issues", name: "Quality Issues Report" },
  { id: "custom", name: "Custom Report" },
]

export default function ReportsPage() {
  const [reportType, setReportType] = useState("order-status")
  const [customPrompt, setCustomPrompt] = useState("")
  const [reportTitle, setReportTitle] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedReport, setGeneratedReport] = useState("")
  const [error, setError] = useState("")

  // Get predefined prompt based on report type
  const getPredefinedPrompt = (type: string) => {
    switch (type) {
      case "order-status":
        return "Generate a comprehensive report of all current orders, their status, and expected delivery dates."
      case "supplier-performance":
        return "Analyze supplier performance based on delivery times, quality issues, and communication responsiveness."
      case "delivery-timeline":
        return "Create a timeline of upcoming deliveries for the next 30 days, organized by customer."
      case "production-status":
        return "Provide a detailed status report on all styles currently in production, including timeline adherence and quality issues."
      case "quality-issues":
        return "Summarize recent quality control issues, their root causes, and corrective actions taken."
      default:
        return ""
    }
  }

  // Generate report using AI
  const handleGenerateReport = async () => {
    setIsGenerating(true)
    setError("")

    try {
      // Get data snapshot
      const dataSnapshot: Record<string, any[]> = {}
      tables.forEach((table) => {
        dataSnapshot[table.id] = loadData(table.id)
      })

      // Create prompt
      const prompt = reportType === "custom" ? customPrompt : getPredefinedPrompt(reportType)

      // Create system prompt
      const systemPrompt = `
        You are an AI assistant for an Apparel Supply Chain Tracker application.
        
        The application tracks the following data:
        ${tables.map((table) => `- ${table.name}: ${table.description}`).join("\n")}
        
        Current data snapshot:
        ${JSON.stringify(dataSnapshot, null, 2)}
        
        Generate a detailed report based on the user's request. Format the report with markdown headings, 
        bullet points, and tables where appropriate. Include relevant statistics and insights.
        The report should be comprehensive yet concise, focusing on the most important information.
        
        Note: This application does NOT track inventory. If the report request mentions inventory,
        focus on related aspects like production status, supplier capacity, or order fulfillment instead.
      `

      // Generate report using Grok (XAI)
      const { text } = await generateText({
        model: xai("grok-1"),
        prompt,
        system: systemPrompt,
        maxTokens: 4000,
      })

      setGeneratedReport(text)
      setReportTitle(
        reportType === "custom"
          ? "Custom Report"
          : REPORT_TYPES.find((r) => r.id === reportType)?.name || "Generated Report",
      )
    } catch (error) {
      console.error("Error generating report:", error)
      setError("Failed to generate report. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  // Download report as text file
  const handleDownloadReport = () => {
    if (!generatedReport) return

    const reportText = `# ${reportTitle}\n\n${generatedReport}`
    const blob = new Blob([reportText], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${reportTitle.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-background border-b">
        <div className="container flex h-16 items-center px-4 md:px-6">
          <Link href="/" className="text-lg font-semibold">
            Apparel Supply Chain Tracker
          </Link>
          <nav className="ml-auto flex gap-4 sm:gap-6">
            <Link href="/dashboard" className="text-sm font-medium hover:underline underline-offset-4">
              Dashboard
            </Link>
            <Link href="/tables" className="text-sm font-medium hover:underline underline-offset-4">
              Tables
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6">
        <div className="mx-auto max-w-6xl grid gap-6">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" asChild className="mr-2">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">AI-Generated Reports</h1>
          </div>

          <Tabs defaultValue="generate" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="generate">Generate Report</TabsTrigger>
              <TabsTrigger value="view" disabled={!generatedReport}>
                View Report
              </TabsTrigger>
            </TabsList>

            <TabsContent value="generate">
              <Card>
                <CardHeader>
                  <CardTitle>Generate New Report</CardTitle>
                  <CardDescription>Select a report type or create a custom report with your own prompt</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="report-type">Report Type</Label>
                    <Select value={reportType} onValueChange={setReportType}>
                      <SelectTrigger id="report-type">
                        <SelectValue placeholder="Select report type" />
                      </SelectTrigger>
                      <SelectContent>
                        {REPORT_TYPES.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {reportType === "custom" ? (
                    <div className="space-y-2">
                      <Label htmlFor="custom-prompt">Custom Prompt</Label>
                      <Textarea
                        id="custom-prompt"
                        placeholder="Describe the report you want to generate..."
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        className="min-h-[120px]"
                      />
                    </div>
                  ) : (
                    <div className="rounded-md bg-muted p-4">
                      <p className="text-sm font-medium">Prompt Preview:</p>
                      <p className="text-sm text-muted-foreground mt-1">{getPredefinedPrompt(reportType)}</p>
                    </div>
                  )}

                  {error && <div className="rounded-md bg-destructive/10 p-4 text-destructive">{error}</div>}
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={handleGenerateReport}
                    disabled={isGenerating || (reportType === "custom" && !customPrompt.trim())}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Report...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        Generate Report
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="view">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{reportTitle}</CardTitle>
                    <CardDescription>Generated on {new Date().toLocaleDateString()}</CardDescription>
                  </div>
                  <Button variant="outline" onClick={handleDownloadReport}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    {generatedReport.split("\n").map((line, i) => (
                      <p key={i}>{line || <br />}</p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

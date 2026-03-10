"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Send, Download, BarChart3, ChevronDown, ChevronUp, Truck, Package, Calendar } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

// Define preset query categories and their queries
const presetQueries = {
  orders: [
    { label: "Delayed orders", query: "Show me all delayed orders" },
    { label: "Orders due this week", query: "Which orders are due for delivery this week?" },
    { label: "Recent orders", query: "List the most recent orders placed" },
    { label: "Order status", query: "What's the status of our open orders?" },
  ],
  suppliers: [
    { label: "Supplier performance", query: "Rank our suppliers by performance" },
    { label: "Late deliveries", query: "Which suppliers have the most late deliveries?" },
    { label: "Lead times", query: "Compare lead times across our top suppliers" },
    { label: "New suppliers", query: "List suppliers added in the last 3 months" },
  ],
  production: [
    { label: "Production delays", query: "Which styles are behind production schedule?" },
    { label: "Quality issues", query: "Summarize recent quality issues by supplier" },
    { label: "Sample status", query: "What's the status of our sample requests?" },
    { label: "Timeline risks", query: "Identify production timeline risks" },
  ],
  reports: [
    { label: "Monthly summary", query: "Generate a monthly supply chain performance report" },
    { label: "Cost analysis", query: "Analyze production costs across different product lines" },
    { label: "Delivery performance", query: "Report on delivery performance by supplier" },
    { label: "Customer insights", query: "Summarize order patterns by customer" },
  ],
}

export default function AIAssistant() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [activeTab, setActiveTab] = useState("orders")
  const [showPresets, setShowPresets] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // State for managing messages, input, and loading state
  const [messages, setMessages] = useState<Array<{ id: string; role: string; content: string }>>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I'm your supply chain assistant. Ask me about order status, suppliers, production, or request a custom report.",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    // Add user message to chat
    const userMessage = { id: Date.now().toString(), role: "user", content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setError(null)

    try {
      // Send request to API
      const response = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: data.role,
          content: data.content,
        },
      ])
    } catch (err) {
      console.error("Error fetching from AI assistant:", err)
      setError("Failed to get a response. Please try again later.")
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again later or contact support if the issue persists.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  // Generate a sample report
  const handleGenerateReport = async () => {
    setIsGeneratingReport(true)
    try {
      const reportPrompt = "Generate a monthly supply chain performance report"

      // Add user message to chat
      const userMessage = { id: Date.now().toString(), role: "user", content: reportPrompt }
      setMessages((prev) => [...prev, userMessage])
      setIsLoading(true)

      // Send request to API
      const response = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: data.role,
          content: data.content,
        },
      ])
    } catch (err) {
      console.error("Error generating report:", err)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "Sorry, I encountered an error generating the report. Please try again later.",
        },
      ])
    } finally {
      setIsGeneratingReport(false)
      setIsLoading(false)
    }
  }

  // Download conversation as text
  const handleDownloadConversation = () => {
    const conversationText = messages
      .map((m) => `${m.role === "user" ? "You" : "Assistant"}: ${m.content}`)
      .join("\n\n")

    const blob = new Blob([conversationText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "supply-chain-conversation.txt"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Handle preset query selection
  const handlePresetQuery = (query: string) => {
    setInput(query)

    // Auto-submit if the assistant is not currently processing
    if (!isLoading) {
      const formEvent = new Event("submit", { cancelable: true }) as unknown as React.FormEvent
      setTimeout(() => handleSubmit(formEvent), 100)
    }
  }

  // Get icon for category
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "orders":
        return <Package className="h-4 w-4" />
      case "suppliers":
        return <Truck className="h-4 w-4" />
      case "production":
        return <Calendar className="h-4 w-4" />
      case "reports":
        return <BarChart3 className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ease-in-out ${isExpanded ? "w-96 h-[600px]" : "w-16 h-16"}`}
    >
      {!isExpanded ? (
        <Button
          onClick={() => setIsExpanded(true)}
          className="w-16 h-16 rounded-full shadow-lg"
          aria-label="Open AI Assistant"
        >
          <Avatar className="h-12 w-12">
            <AvatarImage src="/ai-assistant.png" alt="AI" />
            <AvatarFallback>AI</AvatarFallback>
          </Avatar>
        </Button>
      ) : (
        <Card className="w-full h-full flex flex-col">
          <CardHeader className="pb-2 pt-4 px-4 flex flex-row justify-between items-center">
            <CardTitle className="text-lg">Supply Chain Assistant</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleGenerateReport}
                disabled={isGeneratingReport || isLoading}
                aria-label="Generate report"
              >
                {isGeneratingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleDownloadConversation}
                aria-label="Download conversation"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setIsExpanded(false)} aria-label="Minimize">
                <span>×</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 flex-grow overflow-hidden flex flex-col">
            {/* Preset queries section */}
            <Collapsible open={showPresets} onOpenChange={setShowPresets} className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Quick Questions</h3>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-0 h-7 w-7">
                    {showPresets ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
              </div>

              <CollapsibleContent>
                <Tabs defaultValue="orders" value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid grid-cols-4 mb-2">
                    <TabsTrigger value="orders" className="text-xs p-1" title="Order Queries">
                      <Package className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">Orders</span>
                    </TabsTrigger>
                    <TabsTrigger value="suppliers" className="text-xs p-1" title="Supplier Queries">
                      <Truck className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">Suppliers</span>
                    </TabsTrigger>
                    <TabsTrigger value="production" className="text-xs p-1" title="Production Queries">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">Production</span>
                    </TabsTrigger>
                    <TabsTrigger value="reports" className="text-xs p-1" title="Report Queries">
                      <BarChart3 className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">Reports</span>
                    </TabsTrigger>
                  </TabsList>

                  {Object.entries(presetQueries).map(([category, queries]) => (
                    <TabsContent key={category} value={category} className="mt-0">
                      <div className="flex flex-wrap gap-2">
                        {queries.map((query, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                            onClick={() => handlePresetQuery(query.query)}
                          >
                            {query.label}
                          </Badge>
                        ))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CollapsibleContent>
            </Collapsible>

            {/* Chat messages */}
            <ScrollArea className="flex-grow pr-4">
              <div className="flex flex-col gap-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`rounded-lg px-4 py-2 max-w-[80%] ${
                        message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="rounded-lg px-4 py-2 max-w-[80%] bg-muted">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
                {error && (
                  <div className="flex justify-center">
                    <div className="rounded-lg px-4 py-2 max-w-[80%] bg-destructive text-destructive-foreground">
                      Error: {error}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="p-4 pt-2">
            <form onSubmit={handleSubmit} className="flex w-full gap-2">
              <Input
                placeholder="Ask about orders, suppliers, or production..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                className="flex-grow"
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}

"use client"

import { useState, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GanttChart } from "@/components/gantt-chart"

// Generate sample data
const generateSamplesData = () => {
  const customers = [
    { id: "c1", name: "Zara" },
    { id: "c2", name: "H&M" },
    { id: "c3", name: "Nike" },
    { id: "c4", name: "Adidas" },
    { id: "c5", name: "Gap" },
    { id: "c6", name: "Uniqlo" },
  ]

  const sampleTypes = ["Proto", "Fit", "PP", "Size Set", "Color", "Marketing"]
  const statuses = ["Requested", "In Progress", "Shipped", "Delivered", "Cancelled"]
  const assignees = ["John Smith", "Maria Garcia", "David Kim", "Sarah Johnson", "Alex Wong"]

  return customers.map((customer) => {
    const totalSamples = Math.floor(Math.random() * 8) + 2 // 2-10 samples per customer

    const samples = Array.from({ length: totalSamples }, (_, i) => {
      const today = new Date()

      // Create start date between 1-14 days ago
      const startDaysAgo = Math.floor(Math.random() * 14) + 1
      const startDate = new Date(today)
      startDate.setDate(today.getDate() - startDaysAgo)

      // Create end date between 1-28 days in the future from start date
      const durationDays = Math.floor(Math.random() * 28) + 1
      const endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + durationDays)

      return {
        id: `${customer.id}-s${i + 1}`,
        styleCode: `ST${Math.floor(Math.random() * 10000)}`,
        type: sampleTypes[Math.floor(Math.random() * sampleTypes.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        assignee: assignees[Math.floor(Math.random() * assignees.length)],
        startDate,
        endDate,
        progress: Math.floor(Math.random() * 101), // 0-100%
      }
    })

    return {
      ...customer,
      totalSamples,
      samples,
    }
  })
}

export default function SamplesTimelinePage() {
  const [sortField, setSortField] = useState("totalSamples")
  const [activeTab, setActiveTab] = useState("gantt")

  // Generate sample data
  const samplesData = useMemo(() => generateSamplesData(), [])

  // Sort data based on selected field
  const sortedData = [...samplesData].sort((a, b) => {
    if (sortField === "name") {
      return a.name.localeCompare(b.name)
    }
    return b[sortField] - a[sortField]
  })

  // Prepare data for Gantt chart
  const ganttTasks = useMemo(() => {
    return sortedData.flatMap((customer) =>
      customer.samples.map((sample) => ({
        id: sample.id,
        name: `${sample.styleCode} (${sample.type})`,
        startDate: sample.startDate,
        endDate: sample.endDate,
        progress: sample.progress,
        type: sample.type,
        status: sample.status,
        assignee: sample.assignee,
        customer: customer.name,
      })),
    )
  }, [sortedData])

  return (
    <DashboardLayout title="Samples Timeline by Customer" description="Track samples in progress with weekly deadlines">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="gantt">Gantt Chart</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <div></div>
            <Select value={sortField} onValueChange={setSortField}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="totalSamples">Total Samples</SelectItem>
                <SelectItem value="name">Customer Name</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <TabsContent value="gantt" className="mt-0">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Sample Orders Gantt Chart</CardTitle>
                <CardDescription>Visualize all sample timelines in a Gantt chart</CardDescription>
              </CardHeader>
              <CardContent>
                <GanttChart tasks={ganttTasks} title="Sample Orders Timeline" groupBy="customer" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="mt-0">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Samples in Progress</CardTitle>
                <CardDescription>Gantt chart showing sample deadlines by customer</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {sortedData.map((customer) => (
                    <div key={customer.id} className="space-y-2">
                      <h3 className="font-medium text-lg">
                        {customer.name} ({customer.totalSamples} samples)
                      </h3>
                      <GanttChart samples={customer.samples} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Samples Detail</CardTitle>
                <CardDescription>Detailed view of all samples in progress</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Style Code</TableHead>
                      <TableHead>Sample Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assignee</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead>Progress</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedData.flatMap((customer) =>
                      customer.samples.map((sample) => (
                        <TableRow key={sample.id}>
                          <TableCell className="font-medium">{customer.name}</TableCell>
                          <TableCell>{sample.styleCode}</TableCell>
                          <TableCell>{sample.type}</TableCell>
                          <TableCell>{sample.status}</TableCell>
                          <TableCell>{sample.assignee}</TableCell>
                          <TableCell>{sample.startDate.toLocaleDateString()}</TableCell>
                          <TableCell>{sample.endDate.toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={sample.progress} className="h-2 w-[100px]" />
                              <span className="text-sm">{sample.progress}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      )),
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </DashboardLayout>
  )
}

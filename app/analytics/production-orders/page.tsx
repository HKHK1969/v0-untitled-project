"use client"

import { useState, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { GanttChart } from "@/components/gantt-chart"
import { generateProductionMilestones } from "@/lib/gantt-utils"

// Generate sample data
const generateProductionOrdersData = () => {
  const customers = [
    { id: "c1", name: "Zara" },
    { id: "c2", name: "H&M" },
    { id: "c3", name: "Nike" },
    { id: "c4", name: "Adidas" },
  ]

  const suppliers = [
    { id: "s1", name: "Supplier A" },
    { id: "s2", name: "Supplier B" },
    { id: "s3", name: "Supplier C" },
  ]

  const statuses = ["Draft", "Confirmed", "In Production", "Shipped", "Delivered", "Cancelled"]
  const assignees = ["John Smith", "Maria Garcia", "David Kim", "Sarah Johnson", "Alex Wong"]

  return customers.map((customer) => {
    const totalOrders = Math.floor(Math.random() * 5) + 1 // 1-5 orders per customer

    const orders = Array.from({ length: totalOrders }, (_, i) => {
      const today = new Date()

      // Create start date between 1-30 days ago
      const startDaysAgo = Math.floor(Math.random() * 30) + 1
      const startDate = new Date(today)
      startDate.setDate(today.getDate() - startDaysAgo)

      // Create end date between 30-90 days in the future from start date
      const durationDays = Math.floor(Math.random() * 60) + 30
      const endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + durationDays)

      return {
        id: `${customer.id}-po${i + 1}`,
        poNumber: `PO${Math.floor(Math.random() * 10000)}`,
        supplier: suppliers[Math.floor(Math.random() * suppliers.length)].name,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        assignee: assignees[Math.floor(Math.random() * assignees.length)],
        startDate,
        endDate,
        quantity: Math.floor(Math.random() * 10000) + 1000,
        progress: Math.floor(Math.random() * 101), // 0-100%
      }
    })

    return {
      ...customer,
      totalOrders,
      orders,
    }
  })
}

export default function ProductionOrdersPage() {
  const [sortField, setSortField] = useState("totalOrders")
  const [activeTab, setActiveTab] = useState("gantt")
  const [selectedOrder, setSelectedOrder] = useState(null)

  // Generate sample data
  const ordersData = useMemo(() => generateProductionOrdersData(), [])

  // Sort data based on selected field
  const sortedData = [...ordersData].sort((a, b) => {
    if (sortField === "name") {
      return a.name.localeCompare(b.name)
    }
    return b[sortField] - a[sortField]
  })

  // Prepare data for Gantt chart
  const ganttTasks = useMemo(() => {
    const tasks = sortedData.flatMap((customer) =>
      customer.orders.map((order) => ({
        id: order.id,
        name: `${order.poNumber} (${order.supplier})`,
        startDate: order.startDate,
        endDate: order.endDate,
        progress: order.progress,
        type: "Production",
        status: order.status,
        assignee: order.assignee,
        customer: customer.name,
        quantity: order.quantity,
      })),
    )

    // Add milestones for each order
    const allOrders = sortedData.flatMap((customer) => customer.orders)
    const milestones = allOrders.flatMap((order) => generateProductionMilestones(order))

    return [...tasks, ...milestones]
  }, [sortedData])

  // Handle task click in Gantt chart
  const handleTaskClick = (task) => {
    const allOrders = sortedData.flatMap((customer) => customer.orders)
    const order = allOrders.find((o) => o.id === task.id.split("-")[0] + "-" + task.id.split("-")[1])
    setSelectedOrder(order)
  }

  return (
    <DashboardLayout title="Production Orders Timeline" description="Track production orders and milestones">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="gantt">Gantt Chart</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
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
                <SelectItem value="totalOrders">Total Orders</SelectItem>
                <SelectItem value="name">Customer Name</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <TabsContent value="gantt" className="mt-0">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Production Orders Gantt Chart</CardTitle>
                <CardDescription>Visualize all production order timelines in a Gantt chart</CardDescription>
              </CardHeader>
              <CardContent>
                <GanttChart
                  tasks={ganttTasks}
                  title="Production Orders Timeline"
                  groupBy="customer"
                  onTaskClick={handleTaskClick}
                />

                {selectedOrder && (
                  <div className="mt-4 p-4 border rounded-md">
                    <h3 className="font-medium text-lg mb-2">Order Details: {selectedOrder.poNumber}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Supplier</p>
                        <p className="font-medium">{selectedOrder.supplier}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge>{selectedOrder.status}</Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Quantity</p>
                        <p className="font-medium">{selectedOrder.quantity.toLocaleString()} units</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Progress</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={selectedOrder.progress} className="h-2 w-[100px]" />
                          <span className="text-sm">{selectedOrder.progress}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="milestones" className="mt-0">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Production Milestones</CardTitle>
                <CardDescription>Track key milestones for each production order</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {sortedData.map((customer) => (
                    <div key={customer.id} className="space-y-4">
                      <h3 className="font-medium text-lg">
                        {customer.name} ({customer.totalOrders} orders)
                      </h3>

                      {customer.orders.map((order) => (
                        <div key={order.id} className="border rounded-md p-4">
                          <div className="flex justify-between items-center mb-4">
                            <div>
                              <h4 className="font-medium">{order.poNumber}</h4>
                              <p className="text-sm text-muted-foreground">
                                {order.supplier} • {order.quantity.toLocaleString()} units
                              </p>
                            </div>
                            <Badge>{order.status}</Badge>
                          </div>

                          <div className="space-y-3">
                            {generateProductionMilestones(order).map((milestone) => (
                              <div key={milestone.id} className="flex items-center gap-4">
                                <div className="w-32 text-sm font-medium">{milestone.name}</div>
                                <div className="flex-grow">
                                  <Progress value={milestone.progress} className="h-2" />
                                </div>
                                <div className="text-sm">{milestone.progress}%</div>
                                <div className="text-sm text-muted-foreground w-24">
                                  {milestone.startDate.toLocaleDateString()}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Production Orders Detail</CardTitle>
                <CardDescription>Detailed view of all production orders</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>PO Number</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assignee</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Delivery Date</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Progress</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedData.flatMap((customer) =>
                      customer.orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{customer.name}</TableCell>
                          <TableCell>{order.poNumber}</TableCell>
                          <TableCell>{order.supplier}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{order.status}</Badge>
                          </TableCell>
                          <TableCell>{order.assignee}</TableCell>
                          <TableCell>{order.startDate.toLocaleDateString()}</TableCell>
                          <TableCell>{order.endDate.toLocaleDateString()}</TableCell>
                          <TableCell>{order.quantity.toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={order.progress} className="h-2 w-[100px]" />
                              <span className="text-sm">{order.progress}%</span>
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

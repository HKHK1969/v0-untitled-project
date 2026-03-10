"use client"

import { useState, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { generateProfitabilityData, formatCurrency, formatPercent, chartColors } from "@/lib/chart-utils"

export default function ProfitabilityPage() {
  const [sortField, setSortField] = useState("totalProfit")
  const [viewMode, setViewMode] = useState("profit") // profit, revenue, profitMargin
  const [timeRange, setTimeRange] = useState("quarter")

  const tabs = [
    { id: "table", label: "Table View" },
    { id: "bar", label: "Bar Chart" },
    { id: "line", label: "Line Chart" },
    { id: "pie", label: "Pie Chart" },
  ]

  const profitabilityData = useMemo(() => generateProfitabilityData(timeRange), [timeRange])

  return (
    <DashboardLayout
      title="Profitability by Customer"
      description="Analyze profitability metrics across customers and time periods"
      tabs={tabs}
      defaultTab="table"
      timeRanges={true}
      onTimeRangeChange={setTimeRange}
    >
      {(activeTab) => {
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>Profitability Analysis</CardTitle>
                  <div className="flex gap-4">
                    <Select value={viewMode} onValueChange={setViewMode}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="View metric" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="profit">Profit ($)</SelectItem>
                        <SelectItem value="revenue">Revenue ($)</SelectItem>
                        <SelectItem value="profitMargin">Profit Margin (%)</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={sortField} onValueChange={setSortField}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="totalProfit">Total Profit</SelectItem>
                        <SelectItem value="totalRevenue">Total Revenue</SelectItem>
                        <SelectItem value="avgMargin">Profit Margin</SelectItem>
                        <SelectItem value="name">Customer Name</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <CardDescription>
                  {viewMode === "profit"
                    ? "Profit in USD by customer"
                    : viewMode === "revenue"
                      ? "Revenue in USD by customer"
                      : "Profit margin percentage by customer"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeTab === "table" && (
                  <TableView data={profitabilityData} sortField={sortField} viewMode={viewMode} />
                )}

                {activeTab === "bar" && (
                  <BarChartView
                    data={profitabilityData}
                    sortField={sortField}
                    viewMode={viewMode}
                    timeRange={timeRange}
                  />
                )}

                {activeTab === "line" && (
                  <LineChartView
                    data={profitabilityData}
                    sortField={sortField}
                    viewMode={viewMode}
                    timeRange={timeRange}
                  />
                )}

                {activeTab === "pie" && (
                  <PieChartView data={profitabilityData} sortField={sortField} viewMode={viewMode} />
                )}
              </CardContent>
            </Card>
          </div>
        )
      }}
    </DashboardLayout>
  )
}

// Table view component
function TableView({ data, sortField, viewMode }) {
  // Check if data is available
  if (!data || data.length === 0) {
    return <div className="text-center py-8">No data available</div>
  }

  // Sort data based on selected field
  const sortedData = [...data].sort((a, b) => {
    if (sortField === "name") {
      return a.name.localeCompare(b.name)
    }
    return b[sortField] - a[sortField]
  })

  // Check if the first item has periodData
  if (!sortedData[0]?.periodData || !Array.isArray(sortedData[0]?.periodData)) {
    return <div className="text-center py-8">Invalid data format</div>
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Customer</TableHead>
            {sortedData[0].periodData.map((period, index) => (
              <TableHead key={index} className="text-right">
                {period.period}
              </TableHead>
            ))}
            <TableHead className="text-right font-bold">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell className="font-medium">{customer.name}</TableCell>
              {customer.periodData.map((period, index) => (
                <TableCell key={index} className="text-right">
                  {viewMode === "profit"
                    ? formatCurrency(period.profit)
                    : viewMode === "revenue"
                      ? formatCurrency(period.value)
                      : formatPercent(period.margin)}
                </TableCell>
              ))}
              <TableCell className="text-right font-bold">
                {viewMode === "profit"
                  ? formatCurrency(customer.totalProfit)
                  : viewMode === "revenue"
                    ? formatCurrency(customer.totalRevenue)
                    : formatPercent(customer.avgMargin)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// Bar chart view component
function BarChartView({ data, sortField, viewMode, timeRange }) {
  // Check if data is available
  if (!data || data.length === 0) {
    return <div className="text-center py-8">No data available</div>
  }

  // Sort data based on selected field
  const sortedData = [...data].sort((a, b) => {
    if (sortField === "name") {
      return a.name.localeCompare(b.name)
    }
    return b[sortField] - a[sortField]
  })

  // Check if the first item has periodData
  if (!sortedData[0]?.periodData || !Array.isArray(sortedData[0]?.periodData)) {
    return <div className="text-center py-8">Invalid data format</div>
  }

  // Prepare data for the chart
  const chartData = sortedData.map((customer) => {
    const result = { name: customer.name }

    customer.periodData.forEach((period) => {
      result[period.period] =
        viewMode === "profit" ? period.profit : viewMode === "revenue" ? period.value : period.margin
    })

    return result
  })

  // Get period names for the chart
  const periods = sortedData[0].periodData.map((p) => p.period) || []

  return (
    <div className="w-full h-[500px]">
      <ChartContainer
        config={periods.reduce((acc, period, index) => {
          acc[period] = {
            label: period,
            color: chartColors[index % chartColors.length],
          }
          return acc
        }, {})}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
            <YAxis
              tickFormatter={(value) =>
                viewMode === "profit" || viewMode === "revenue" ? formatCurrency(value) : formatPercent(value)
              }
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
            {periods.map((period, index) => (
              <Bar key={period} dataKey={period} stackId="a" fill={`var(--color-${period})`} name={period} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  )
}

// Line chart view component
function LineChartView({ data, sortField, viewMode, timeRange }) {
  // Check if data is available
  if (!data || data.length === 0) {
    return <div className="text-center py-8">No data available</div>
  }

  // Sort data based on selected field
  const sortedData = [...data]
    .sort((a, b) => {
      if (sortField === "name") {
        return a.name.localeCompare(b.name)
      }
      return b[sortField] - a[sortField]
    })
    .slice(0, 5) // Only show top 5 for line chart clarity

  // Check if the first item has periodData
  if (!sortedData[0]?.periodData || !Array.isArray(sortedData[0]?.periodData)) {
    return <div className="text-center py-8">Invalid data format</div>
  }

  // Get period names
  const periods = sortedData[0].periodData.map((p) => p.period) || []

  // Transform data for line chart
  const transformedData = periods.map((period) => {
    const periodData = { period }

    sortedData.forEach((customer) => {
      const customerPeriod = customer.periodData.find((p) => p.period === period)
      if (customerPeriod) {
        periodData[customer.name] =
          viewMode === "profit"
            ? customerPeriod.profit
            : viewMode === "revenue"
              ? customerPeriod.value
              : customerPeriod.margin
      }
    })

    return periodData
  })

  return (
    <div className="w-full h-[500px]">
      <ChartContainer
        config={sortedData.reduce((acc, customer, index) => {
          acc[customer.name] = {
            label: customer.name,
            color: chartColors[index % chartColors.length],
          }
          return acc
        }, {})}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={transformedData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis
              tickFormatter={(value) =>
                viewMode === "profit" || viewMode === "revenue" ? formatCurrency(value) : formatPercent(value)
              }
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
            {sortedData.map((customer) => (
              <Line
                key={customer.id}
                type="monotone"
                dataKey={customer.name}
                stroke={`var(--color-${customer.name})`}
                activeDot={{ r: 8 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  )
}

// Pie chart view component
function PieChartView({ data, sortField, viewMode }) {
  // Check if data is available
  if (!data || data.length === 0) {
    return <div className="text-center py-8">No data available</div>
  }

  // Sort data based on selected field
  const sortedData = [...data].sort((a, b) => {
    if (sortField === "name") {
      return a.name.localeCompare(b.name)
    }
    return b[sortField] - a[sortField]
  })

  // Prepare data for the pie chart
  const pieData = sortedData.map((customer) => ({
    name: customer.name,
    value:
      viewMode === "profit"
        ? customer.totalProfit
        : viewMode === "revenue"
          ? customer.totalRevenue
          : customer.avgMargin,
  }))

  return (
    <div className="w-full h-[500px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={true}
            outerRadius={200}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) =>
              viewMode === "profit" || viewMode === "revenue" ? formatCurrency(value) : formatPercent(value)
            }
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

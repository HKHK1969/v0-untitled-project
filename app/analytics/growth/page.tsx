"use client"

import { useState, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
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
import { generateGrowthData, formatCurrency, formatPercent, chartColors } from "@/lib/chart-utils"

export default function GrowthRatePage() {
  const [sortField, setSortField] = useState("cagr")
  const [viewMode, setViewMode] = useState("growthRate") // growthRate, value

  const tabs = [
    { id: "table", label: "Table View" },
    { id: "bar", label: "Bar Chart" },
    { id: "line", label: "Line Chart" },
    { id: "pie", label: "Pie Chart" },
  ]

  // Generate data
  const growthData = useMemo(() => generateGrowthData(), [])

  return (
    <DashboardLayout
      title="Customer Growth Rate"
      description="Analyze customer growth over time"
      tabs={tabs}
      defaultTab="table"
    >
      {(activeTab) => {
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>Growth Rate Analysis</CardTitle>
                  <div className="flex gap-4">
                    <Select value={viewMode} onValueChange={setViewMode}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="View metric" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="growthRate">Growth Rate (%)</SelectItem>
                        <SelectItem value="value">Value ($)</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={sortField} onValueChange={setSortField}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cagr">CAGR</SelectItem>
                        <SelectItem value="avgGrowthRate">Avg Growth Rate</SelectItem>
                        <SelectItem value="currentValue">Current Value</SelectItem>
                        <SelectItem value="name">Customer Name</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <CardDescription>
                  {viewMode === "growthRate" ? "Growth rate percentage by customer" : "Value in USD by customer"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeTab === "table" && <TableView data={growthData} sortField={sortField} viewMode={viewMode} />}

                {activeTab === "bar" && <BarChartView data={growthData} sortField={sortField} viewMode={viewMode} />}

                {activeTab === "line" && <LineChartView data={growthData} sortField={sortField} viewMode={viewMode} />}

                {activeTab === "pie" && <PieChartView data={growthData} sortField={sortField} viewMode={viewMode} />}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>CAGR vs Average Growth Rate</CardTitle>
                <CardDescription>
                  Comparison of Compound Annual Growth Rate (CAGR) and Average Annual Growth Rate
                </CardDescription>
              </CardHeader>
              <CardContent>
                {growthData && growthData.length > 0 ? (
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={growthData.sort((a, b) => b.cagr - a.cagr)}
                        margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                        <YAxis tickFormatter={(value) => formatPercent(value)} />
                        <Tooltip formatter={(value) => formatPercent(value)} />
                        <Legend />
                        <Bar dataKey="cagr" name="CAGR" fill={chartColors[0]} />
                        <Bar dataKey="avgGrowthRate" name="Avg Growth Rate" fill={chartColors[1]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>No data available for comparison chart.</AlertDescription>
                  </Alert>
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
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>No data available for table view.</AlertDescription>
      </Alert>
    )
  }

  // Check if the first item has years property
  if (!data[0].years || !Array.isArray(data[0].years)) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Invalid data structure: missing years property.</AlertDescription>
      </Alert>
    )
  }

  // Sort data based on selected field
  const sortedData = [...data].sort((a, b) => {
    if (sortField === "name") {
      return a.name.localeCompare(b.name)
    }
    return b[sortField] - a[sortField]
  })

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Customer</TableHead>
            {sortedData[0]?.years.map((year, index) => (
              <TableHead key={index} className="text-right">
                {year.year}
              </TableHead>
            ))}
            <TableHead className="text-right">CAGR</TableHead>
            <TableHead className="text-right">Avg Growth</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell className="font-medium">{customer.name}</TableCell>
              {customer.years.map((year, index) => (
                <TableCell key={index} className="text-right">
                  {viewMode === "growthRate"
                    ? index === 0
                      ? "-"
                      : formatPercent(year.growthRate)
                    : formatCurrency(year.value)}
                </TableCell>
              ))}
              <TableCell className="text-right font-bold">{formatPercent(customer.cagr)}</TableCell>
              <TableCell className="text-right">{formatPercent(customer.avgGrowthRate)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// Bar chart view component
function BarChartView({ data, sortField, viewMode }) {
  // Check if data is available
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>No data available for bar chart view.</AlertDescription>
      </Alert>
    )
  }

  // Check if the first item has years property
  if (!data[0].years || !Array.isArray(data[0].years)) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Invalid data structure: missing years property.</AlertDescription>
      </Alert>
    )
  }

  // Sort data based on selected field
  const sortedData = [...data].sort((a, b) => {
    if (sortField === "name") {
      return a.name.localeCompare(b.name)
    }
    return b[sortField] - a[sortField]
  })

  // Prepare data for the chart
  const chartData = sortedData.map((customer) => {
    const result = { name: customer.name }

    if (viewMode === "growthRate") {
      // Skip first year which has no growth rate
      customer.years.slice(1).forEach((year) => {
        result[year.year] = year.growthRate
      })
    } else {
      customer.years.forEach((year) => {
        result[year.year] = year.value
      })
    }

    return result
  })

  // Get year names for the chart
  const years =
    viewMode === "growthRate"
      ? sortedData[0]?.years.slice(1).map((y) => y.year) || []
      : sortedData[0]?.years.map((y) => y.year) || []

  return (
    <div className="w-full h-[500px]">
      <ChartContainer
        config={years.reduce((acc, year, index) => {
          acc[year] = {
            label: year.toString(),
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
              tickFormatter={(value) => (viewMode === "growthRate" ? formatPercent(value) : formatCurrency(value))}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
            {years.map((year) => (
              <Bar key={year} dataKey={year} fill={`var(--color-${year})`} name={year.toString()} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  )
}

// Line chart view component
function LineChartView({ data, sortField, viewMode }) {
  // Check if data is available
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>No data available for line chart view.</AlertDescription>
      </Alert>
    )
  }

  // Check if the first item has years property
  if (!data[0].years || !Array.isArray(data[0].years)) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Invalid data structure: missing years property.</AlertDescription>
      </Alert>
    )
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

  // Transform data for line chart
  const transformedData = []

  if (viewMode === "growthRate") {
    // Skip first year which has no growth rate
    sortedData[0]?.years.slice(1).forEach((yearData, yearIndex) => {
      const dataPoint = { year: yearData.year }

      sortedData.forEach((customer) => {
        dataPoint[customer.name] = customer.years[yearIndex + 1].growthRate
      })

      transformedData.push(dataPoint)
    })
  } else {
    sortedData[0]?.years.forEach((yearData, yearIndex) => {
      const dataPoint = { year: yearData.year }

      sortedData.forEach((customer) => {
        dataPoint[customer.name] = customer.years[yearIndex].value
      })

      transformedData.push(dataPoint)
    })
  }

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
            <XAxis dataKey="year" />
            <YAxis
              tickFormatter={(value) => (viewMode === "growthRate" ? formatPercent(value) : formatCurrency(value))}
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
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>No data available for pie chart view.</AlertDescription>
      </Alert>
    )
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
    value: viewMode === "growthRate" ? customer.cagr : customer.currentValue,
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
            label={({ name, value }) =>
              `${name} (${viewMode === "growthRate" ? formatPercent(value) : formatCurrency(value)})`
            }
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => (viewMode === "growthRate" ? formatPercent(value) : formatCurrency(value))} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

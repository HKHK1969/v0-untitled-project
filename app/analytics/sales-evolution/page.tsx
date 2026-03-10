"use client"

import { useState, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { generateSalesData, formatCurrency, formatNumber, chartColors } from "@/lib/chart-utils"

export default function SalesEvolutionPage() {
  const [sortField, setSortField] = useState("totalValue")
  const [viewMode, setViewMode] = useState("value") // value, units, avgPrice
  const [timeRange, setTimeRange] = useState("quarter")

  const tabs = [
    { id: "table", label: "Table View" },
    { id: "bar", label: "Bar Chart" },
    { id: "line", label: "Line Chart" },
    { id: "pie", label: "Pie Chart" },
  ]

  // Generate data based on the selected time range
  const salesData = useMemo(() => generateSalesData(timeRange), [timeRange])

  return (
    <DashboardLayout
      title="Sales Evolution by Customer"
      description="Track sales trends across customers and time periods"
      tabs={tabs}
      defaultTab="table"
      timeRanges={true}
    >
      {(activeTab) => (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Sales Evolution</CardTitle>
                <div className="flex gap-4">
                  <Select value={viewMode} onValueChange={setViewMode}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="View metric" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="value">Sales Value ($)</SelectItem>
                      <SelectItem value="units">Units Sold</SelectItem>
                      <SelectItem value="avgPrice">Average Price</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortField} onValueChange={setSortField}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="totalValue">Total Value</SelectItem>
                      <SelectItem value="totalUnits">Total Units</SelectItem>
                      <SelectItem value="avgPrice">Average Price</SelectItem>
                      <SelectItem value="name">Customer Name</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <CardDescription>
                {viewMode === "value"
                  ? "Sales value in USD by customer"
                  : viewMode === "units"
                    ? "Units sold by customer"
                    : "Average price per unit by customer"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeTab === "table" && <TableView data={salesData} sortField={sortField} viewMode={viewMode} />}

              {activeTab === "bar" && (
                <BarChartView data={salesData} sortField={sortField} viewMode={viewMode} timeRange={timeRange} />
              )}

              {activeTab === "line" && (
                <LineChartView data={salesData} sortField={sortField} viewMode={viewMode} timeRange={timeRange} />
              )}

              {activeTab === "pie" && <PieChartView data={salesData} sortField={sortField} viewMode={viewMode} />}
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  )
}

// Table view component
function TableView({ data, sortField, viewMode }) {
  // Safety check - if data is undefined or empty, return a message
  if (!data || data.length === 0) {
    return <div className="p-4 text-center">No data available</div>
  }

  // Sort data based on selected field
  const sortedData = [...data].sort((a, b) => {
    if (sortField === "name") {
      return a.name.localeCompare(b.name)
    }
    return b[sortField] - a[sortField]
  })

  // Get periods from the first customer's data
  const periods = sortedData[0]?.periodData?.map((period) => period.period) || []

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Customer</TableHead>
            {periods.map((period, index) => (
              <TableHead key={index} className="text-right">
                {period}
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
                  {viewMode === "value"
                    ? formatCurrency(period.value)
                    : viewMode === "units"
                      ? formatNumber(period.units)
                      : formatCurrency(period.avgPrice)}
                </TableCell>
              ))}
              <TableCell className="text-right font-bold">
                {viewMode === "value"
                  ? formatCurrency(customer.totalValue)
                  : viewMode === "units"
                    ? formatNumber(customer.totalUnits)
                    : formatCurrency(customer.avgPrice)}
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
  // Safety check - if data is undefined or empty, return a message
  if (!data || data.length === 0) {
    return <div className="p-4 text-center">No data available</div>
  }

  // Sort data based on selected field
  const sortedData = [...data].sort((a, b) => {
    if (sortField === "name") {
      return a.name.localeCompare(b.name)
    }
    return b[sortField] - a[sortField]
  })

  // Get periods from the first customer's data
  const periods = sortedData[0]?.periodData?.map((period) => period.period) || []

  // Prepare data for the chart
  const chartData = sortedData.map((customer) => {
    const result = { name: customer.name }

    customer.periodData.forEach((period) => {
      result[period.period] =
        viewMode === "value" ? period.value : viewMode === "units" ? period.units : period.avgPrice
    })

    return result
  })

  return (
    <div className="w-full h-[500px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
          <YAxis
            tickFormatter={(value) =>
              viewMode === "value"
                ? formatCurrency(value)
                : viewMode === "units"
                  ? formatNumber(value)
                  : formatCurrency(value)
            }
          />
          <Tooltip
            formatter={(value) =>
              viewMode === "value"
                ? formatCurrency(value)
                : viewMode === "units"
                  ? formatNumber(value)
                  : formatCurrency(value)
            }
          />
          <Legend />
          {periods.map((period, index) => (
            <Bar
              key={period}
              dataKey={period}
              stackId="a"
              fill={chartColors[index % chartColors.length]}
              name={period}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// Line chart view component
function LineChartView({ data, sortField, viewMode, timeRange }) {
  // Safety check - if data is undefined or empty, return a message
  if (!data || data.length === 0) {
    return <div className="p-4 text-center">No data available</div>
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

  // Get periods from the first customer's data
  const periods = sortedData[0]?.periodData?.map((period) => period.period) || []

  // Transform data for line chart
  const transformedData = periods.map((periodName) => {
    const periodData = { period: periodName }

    sortedData.forEach((customer) => {
      const customerPeriod = customer.periodData.find((p) => p.period === periodName)
      if (customerPeriod) {
        periodData[customer.name] =
          viewMode === "value"
            ? customerPeriod.value
            : viewMode === "units"
              ? customerPeriod.units
              : customerPeriod.avgPrice
      } else {
        periodData[customer.name] = 0
      }
    })

    return periodData
  })

  return (
    <div className="w-full h-[500px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={transformedData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period" />
          <YAxis
            tickFormatter={(value) =>
              viewMode === "value"
                ? formatCurrency(value)
                : viewMode === "units"
                  ? formatNumber(value)
                  : formatCurrency(value)
            }
          />
          <Tooltip
            formatter={(value) =>
              viewMode === "value"
                ? formatCurrency(value)
                : viewMode === "units"
                  ? formatNumber(value)
                  : formatCurrency(value)
            }
          />
          <Legend />
          {sortedData.map((customer, index) => (
            <Line
              key={customer.id}
              type="monotone"
              dataKey={customer.name}
              stroke={chartColors[index % chartColors.length]}
              activeDot={{ r: 8 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// Pie chart view component
function PieChartView({ data, sortField, viewMode }) {
  // Safety check - if data is undefined or empty, return a message
  if (!data || data.length === 0) {
    return <div className="p-4 text-center">No data available</div>
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
    value: viewMode === "value" ? customer.totalValue : viewMode === "units" ? customer.totalUnits : customer.avgPrice,
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
              viewMode === "value"
                ? formatCurrency(value)
                : viewMode === "units"
                  ? formatNumber(value)
                  : formatCurrency(value)
            }
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

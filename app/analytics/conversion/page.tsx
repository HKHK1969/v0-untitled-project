"use client"

import { useState, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import {
  BarChart,
  Bar,
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
import { generateConversionData, formatPercent, formatNumber, chartColors } from "@/lib/chart-utils"

export default function ConversionRatePage() {
  const [sortField, setSortField] = useState("overallConversionRate")

  const tabs = [
    { id: "table", label: "Table View" },
    { id: "bar", label: "Bar Chart" },
    { id: "pie", label: "Pie Chart" },
  ]

  // Generate data
  const conversionData = useMemo(() => generateConversionData(), [])

  return (
    <DashboardLayout
      title="Sample to Production Conversion Rate"
      description="Analyze how effectively samples convert to production orders"
      tabs={tabs}
      defaultTab="table"
    >
      {(activeTab) => {
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>Sample Conversion Analysis</CardTitle>
                  <Select value={sortField} onValueChange={setSortField}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="overallConversionRate">Conversion Rate</SelectItem>
                      <SelectItem value="totalSamples">Total Samples</SelectItem>
                      <SelectItem value="totalConverted">Total Converted</SelectItem>
                      <SelectItem value="name">Customer Name</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <CardDescription>Sample to production conversion rates by customer</CardDescription>
              </CardHeader>
              <CardContent>
                {activeTab === "table" && <TableView data={conversionData} sortField={sortField} />}

                {activeTab === "bar" && <BarChartView data={conversionData} sortField={sortField} />}

                {activeTab === "pie" && <PieChartView data={conversionData} sortField={sortField} />}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conversion Rate by Sample Type</CardTitle>
                <CardDescription>Breakdown of conversion rates by sample type for each customer</CardDescription>
              </CardHeader>
              <CardContent>
                <SampleTypeBreakdown data={conversionData} sortField={sortField} />
              </CardContent>
            </Card>
          </div>
        )
      }}
    </DashboardLayout>
  )
}

// Table view component
function TableView({ data, sortField }) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No data available</AlertDescription>
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
            <TableHead className="text-right">Total Samples</TableHead>
            <TableHead className="text-right">Converted to Production</TableHead>
            <TableHead className="text-right">Conversion Rate</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell className="font-medium">{customer.name}</TableCell>
              <TableCell className="text-right">{customer.totalSamples}</TableCell>
              <TableCell className="text-right">{customer.totalConverted}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Progress value={customer.overallConversionRate} className="h-2 w-[100px]" />
                  <span>{formatPercent(customer.overallConversionRate)}</span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// Bar chart view component
function BarChartView({ data, sortField }) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No data available</AlertDescription>
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
  const chartData = sortedData.map((customer) => ({
    name: customer.name,
    conversionRate: customer.overallConversionRate,
    totalSamples: customer.totalSamples,
    totalConverted: customer.totalConverted,
  }))

  return (
    <div className="w-full h-[500px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
          <YAxis yAxisId="left" orientation="left" tickFormatter={(value) => formatPercent(value)} />
          <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => formatNumber(value)} />
          <Tooltip
            formatter={(value, name) => {
              if (name === "conversionRate") return formatPercent(value)
              return formatNumber(value)
            }}
          />
          <Legend />
          <Bar yAxisId="left" dataKey="conversionRate" fill={chartColors[0]} name="Conversion Rate" />
          <Bar yAxisId="right" dataKey="totalSamples" fill={chartColors[1]} name="Total Samples" />
          <Bar yAxisId="right" dataKey="totalConverted" fill={chartColors[2]} name="Converted to Production" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// Pie chart view component
function PieChartView({ data, sortField }) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No data available</AlertDescription>
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
    value: customer.overallConversionRate,
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
            label={({ name, value }) => `${name} (${formatPercent(value)})`}
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatPercent(value)} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

// Sample type breakdown component
function SampleTypeBreakdown({ data, sortField }) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No data available</AlertDescription>
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
    <div className="space-y-8">
      {sortedData.map((customer) => {
        // Check if customer has typeData
        if (!customer.typeData || !Array.isArray(customer.typeData) || customer.typeData.length === 0) {
          return (
            <div key={customer.id} className="space-y-4">
              <h3 className="font-medium text-lg">{customer.name}</h3>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>No sample type data available for this customer</AlertDescription>
              </Alert>
            </div>
          )
        }

        return (
          <div key={customer.id} className="space-y-4">
            <h3 className="font-medium text-lg">{customer.name}</h3>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sample Type</TableHead>
                    <TableHead className="text-right">Total Samples</TableHead>
                    <TableHead className="text-right">Converted</TableHead>
                    <TableHead className="text-right">Conversion Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customer.typeData.map((type, index) => (
                    <TableRow key={index}>
                      <TableCell>{type.type}</TableCell>
                      <TableCell className="text-right">{type.totalSamples}</TableCell>
                      <TableCell className="text-right">{type.convertedSamples}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Progress value={type.conversionRate} className="h-2 w-[100px]" />
                          <span>{formatPercent(type.conversionRate)}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={customer.typeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis tickFormatter={(value) => formatPercent(value)} />
                  <Tooltip formatter={(value) => formatPercent(value)} />
                  <Legend />
                  <Bar dataKey="conversionRate" name="Conversion Rate" fill={chartColors[0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )
      })}
    </div>
  )
}

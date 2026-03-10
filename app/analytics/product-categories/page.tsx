"use client"

import { useState, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
  Sector,
} from "recharts"
import {
  generateProductCategoryData,
  formatCurrency,
  formatNumber,
  formatPercent,
  chartColors,
} from "@/lib/chart-utils"

export default function ProductCategoriesPage() {
  const [view, setView] = useState<"chart" | "table">("chart")
  const [activeIndex, setActiveIndex] = useState(0)
  const [viewMode, setViewMode] = useState("units") // units, value
  const [selectedCustomer, setSelectedCustomer] = useState("all")

  // Generate data
  const categoryData = useMemo(() => generateProductCategoryData(), [])

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "customer", label: "By Customer" },
    { id: "comparison", label: "Category Comparison" },
  ]

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index)
  }

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props

    return (
      <g>
        <text x={cx} y={cy} dy={-20} textAnchor="middle" fill="#888">
          {payload.name}
        </text>
        <text x={cx} y={cy} textAnchor="middle" fill="#333" className="text-xl font-bold">
          {`${(percent * 100).toFixed(1)}%`}
        </text>
        <text x={cx} y={cy} dy={20} textAnchor="middle" fill="#888">
          {`${payload.units.toLocaleString()} units`}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    )
  }

  return (
    <DashboardLayout
      title="Product Categories"
      description="Analyze production distribution by product category"
      tabs={tabs}
      defaultTab="overview"
    >
      {(activeTab) => (
        <div className="space-y-6">
          {activeTab === "overview" && (
            <OverviewTab data={categoryData} viewMode={viewMode} setViewMode={setViewMode} />
          )}

          {activeTab === "customer" && (
            <CustomerTab
              data={categoryData}
              viewMode={viewMode}
              setViewMode={setViewMode}
              selectedCustomer={selectedCustomer}
              setSelectedCustomer={setSelectedCustomer}
            />
          )}

          {activeTab === "comparison" && (
            <ComparisonTab data={categoryData} viewMode={viewMode} setViewMode={setViewMode} />
          )}
        </div>
      )}
    </DashboardLayout>
  )
}

function OverviewTab({ data, viewMode, setViewMode }) {
  if (!data) {
    return <div className="py-8 text-center text-muted-foreground">No data available</div>
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Select value={viewMode} onValueChange={setViewMode}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="View metric" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="units">Units</SelectItem>
            <SelectItem value="value">Value ($)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Product Category Distribution</CardTitle>
            <CardDescription>
              {viewMode === "units" ? "Production volume" : "Production value"} by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey={viewMode === "units" ? "units" : "value"}
                    nameKey="name"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                  >
                    {data.categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => (viewMode === "units" ? formatNumber(value) : formatCurrency(value))}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Ranking</CardTitle>
            <CardDescription>
              {viewMode === "units" ? "Production volume" : "Production value"} by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[...data.categoryData].sort((a, b) =>
                    viewMode === "units" ? b.units - a.units : b.value - a.value,
                  )}
                  margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    tickFormatter={
                      viewMode === "units" ? (value) => formatNumber(value) : (value) => formatCurrency(value)
                    }
                  />
                  <YAxis type="category" dataKey="name" width={120} />
                  <Tooltip
                    formatter={viewMode === "units" ? (value) => formatNumber(value) : (value) => formatCurrency(value)}
                  />
                  <Legend />
                  <Bar
                    dataKey={viewMode === "units" ? "units" : "value"}
                    name={viewMode === "units" ? "Units" : "Value"}
                    fill={chartColors[0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Category Details</CardTitle>
          <CardDescription>Detailed metrics for each product category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Units</TableHead>
                  <TableHead className="text-right">% of Total Units</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">% of Total Value</TableHead>
                  <TableHead className="text-right">Avg. Unit Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.categoryData.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="text-right">{formatNumber(category.units)}</TableCell>
                    <TableCell className="text-right">{formatPercent(category.unitsPercentage)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(category.value)}</TableCell>
                    <TableCell className="text-right">{formatPercent(category.valuePercentage)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(category.value / category.units)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50">
                  <TableCell className="font-bold">Total</TableCell>
                  <TableCell className="text-right font-bold">{formatNumber(data.totalUnits)}</TableCell>
                  <TableCell className="text-right font-bold">100%</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(data.totalValue)}</TableCell>
                  <TableCell className="text-right font-bold">100%</TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(data.totalValue / data.totalUnits)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

function CustomerTab({ data, viewMode, setViewMode, selectedCustomer, setSelectedCustomer }) {
  if (!data) {
    return <div className="py-8 text-center text-muted-foreground">No data available</div>
  }

  const selectedCustomerData =
    selectedCustomer === "all" ? null : data.customerCategoryData.find((c) => c.id === selectedCustomer)

  const categoryData = selectedCustomer === "all" ? data.categoryData : selectedCustomerData?.categories || []

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
        <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select customer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Customers</SelectItem>
            {data.customerCategoryData.map((customer) => (
              <SelectItem key={customer.id} value={customer.id}>
                {customer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={viewMode} onValueChange={setViewMode}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="View metric" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="units">Units</SelectItem>
            <SelectItem value="value">Value ($)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Product Category Distribution for{" "}
            {selectedCustomer === "all" ? "All Customers" : selectedCustomerData?.name}
          </CardTitle>
          <CardDescription>
            {viewMode === "units" ? "Production volume" : "Production value"} by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={150}
                  fill="#8884d8"
                  dataKey={viewMode === "units" ? "units" : "value"}
                  nameKey="name"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => (viewMode === "units" ? formatNumber(value) : formatCurrency(value))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Category Details for {selectedCustomer === "all" ? "All Customers" : selectedCustomerData?.name}
          </CardTitle>
          <CardDescription>Detailed metrics for each product category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Units</TableHead>
                  <TableHead className="text-right">% of Total Units</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">% of Total Value</TableHead>
                  <TableHead className="text-right">Avg. Unit Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryData.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="text-right">{formatNumber(category.units)}</TableCell>
                    <TableCell className="text-right">{formatPercent(category.unitsPercentage)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(category.value)}</TableCell>
                    <TableCell className="text-right">{formatPercent(category.valuePercentage)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(category.value / category.units)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50">
                  <TableCell className="font-bold">Total</TableCell>
                  <TableCell className="text-right font-bold">
                    {formatNumber(selectedCustomer === "all" ? data.totalUnits : selectedCustomerData?.totalUnits)}
                  </TableCell>
                  <TableCell className="text-right font-bold">100%</TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(selectedCustomer === "all" ? data.totalValue : selectedCustomerData?.totalValue)}
                  </TableCell>
                  <TableCell className="text-right font-bold">100%</TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(
                      selectedCustomer === "all"
                        ? data.totalValue / data.totalUnits
                        : selectedCustomerData?.totalValue / selectedCustomerData?.totalUnits,
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

function ComparisonTab({ data, viewMode, setViewMode }) {
  if (!data) {
    return <div className="py-8 text-center text-muted-foreground">No data available</div>
  }

  // Get all categories
  const categories = data.categoryData.map((c) => c.name)

  // Transform data for comparison chart
  const comparisonData = categories.map((categoryName) => {
    const result = { name: categoryName }

    data.customerCategoryData.forEach((customer) => {
      const category = customer.categories.find((c) => c.name === categoryName)
      if (category) {
        result[customer.name] = viewMode === "units" ? category.units : category.value
      } else {
        result[customer.name] = 0
      }
    })

    return result
  })

  return (
    <>
      <div className="flex justify-end mb-4">
        <Select value={viewMode} onValueChange={setViewMode}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="View metric" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="units">Units</SelectItem>
            <SelectItem value="value">Value ($)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Category Comparison Across Customers</CardTitle>
          <CardDescription>
            Compare {viewMode === "units" ? "production volume" : "production value"} by category and customer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[600px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis
                  tickFormatter={
                    viewMode === "units" ? (value) => formatNumber(value) : (value) => formatCurrency(value)
                  }
                />
                <Tooltip
                  formatter={viewMode === "units" ? (value) => formatNumber(value) : (value) => formatCurrency(value)}
                />
                <Legend />
                {data.customerCategoryData.map((customer, index) => (
                  <Bar
                    key={customer.id}
                    dataKey={customer.name}
                    stackId="a"
                    fill={chartColors[index % chartColors.length]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Customer Category Mix</CardTitle>
          <CardDescription>Product category distribution by customer</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  {categories.map((category) => (
                    <TableHead key={category} className="text-right">
                      {category}
                    </TableHead>
                  ))}
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.customerCategoryData.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    {categories.map((categoryName) => {
                      const category = customer.categories.find((c) => c.name === categoryName)
                      const value = category ? (viewMode === "units" ? category.units : category.value) : 0
                      return (
                        <TableCell key={`${customer.id}-${categoryName}`} className="text-right">
                          {viewMode === "units" ? formatNumber(value) : formatCurrency(value)}
                        </TableCell>
                      )
                    })}
                    <TableCell className="text-right font-bold">
                      {viewMode === "units" ? formatNumber(customer.totalUnits) : formatCurrency(customer.totalValue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

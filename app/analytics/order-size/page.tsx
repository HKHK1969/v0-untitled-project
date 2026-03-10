"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { generateOrderSizeData } from "@/lib/chart-utils"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function OrderSizePage() {
  const [view, setView] = useState<"chart" | "table">("chart")
  const data = generateOrderSizeData()

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Order Size Analysis</h1>
          <p className="text-muted-foreground">Track average order sizes by customer and over time</p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex justify-between">
            <Tabs defaultValue="units-by-customer" className="w-full">
              <TabsList>
                <TabsTrigger value="units-by-customer">Units by Customer</TabsTrigger>
                <TabsTrigger value="value-by-customer">Value by Customer</TabsTrigger>
                <TabsTrigger value="units-evolution">Units Evolution</TabsTrigger>
                <TabsTrigger value="value-evolution">Value Evolution</TabsTrigger>
              </TabsList>

              <div className="mt-4 flex justify-end">
                <Select value={view} onValueChange={(value) => setView(value as "chart" | "table")}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select view" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chart">Chart View</SelectItem>
                    <SelectItem value="table">Table View</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <TabsContent value="units-by-customer" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Average Order Size by Customer (Units)</CardTitle>
                    <CardDescription>Average number of units per order by customer</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {view === "chart" ? (
                      <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data.byCustomerUnits} layout="vertical" margin={{ left: 50 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" unit=" units" />
                            <YAxis dataKey="customer" type="category" width={150} />
                            <Tooltip formatter={(value) => [`${value.toLocaleString()} units`, "Avg. Order Size"]} />
                            <Legend />
                            <Bar dataKey="averageSize" name="Avg. Order Size" fill="#8884d8" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead className="text-right">Avg. Order Size (Units)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.byCustomerUnits.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>{item.customer}</TableCell>
                              <TableCell className="text-right">{item.averageSize.toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="value-by-customer" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Average Order Value by Customer</CardTitle>
                    <CardDescription>Average order value in dollars by customer</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {view === "chart" ? (
                      <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data.byCustomerValue} layout="vertical" margin={{ left: 50 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="customer" type="category" width={150} />
                            <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, "Avg. Order Value"]} />
                            <Legend />
                            <Bar dataKey="averageValue" name="Avg. Order Value" fill="#82ca9d" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead className="text-right">Avg. Order Value ($)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.byCustomerValue.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>{item.customer}</TableCell>
                              <TableCell className="text-right">${item.averageValue.toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="units-evolution" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Order Size Evolution (Units)</CardTitle>
                    <CardDescription>How average order size in units has changed over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {view === "chart" ? (
                      <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={data.evolutionUnits}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="monthYear" />
                            <YAxis unit=" units" />
                            <Tooltip formatter={(value) => [`${value.toLocaleString()} units`, "Avg. Order Size"]} />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="averageSize"
                              name="Avg. Order Size"
                              stroke="#8884d8"
                              activeDot={{ r: 8 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Month/Year</TableHead>
                            <TableHead className="text-right">Avg. Order Size (Units)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.evolutionUnits.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>{item.monthYear}</TableCell>
                              <TableCell className="text-right">{item.averageSize.toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="value-evolution" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Order Value Evolution</CardTitle>
                    <CardDescription>How average order value has changed over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {view === "chart" ? (
                      <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={data.evolutionValue}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="monthYear" />
                            <YAxis />
                            <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, "Avg. Order Value"]} />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="averageValue"
                              name="Avg. Order Value"
                              stroke="#82ca9d"
                              activeDot={{ r: 8 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Month/Year</TableHead>
                            <TableHead className="text-right">Avg. Order Value ($)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.evolutionValue.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>{item.monthYear}</TableCell>
                              <TableCell className="text-right">${item.averageValue.toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

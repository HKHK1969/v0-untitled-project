"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { generateSampleLeadTimeData } from "@/lib/chart-utils"
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

export default function SampleLeadTimePage() {
  const [view, setView] = useState<"chart" | "table">("chart")
  const data = generateSampleLeadTimeData()

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Sample Lead Time Analysis</h1>
          <p className="text-muted-foreground">Track and analyze sample development timelines and lead times</p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex justify-between">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="by-customer">By Customer</TabsTrigger>
                <TabsTrigger value="by-supplier">By Supplier</TabsTrigger>
                <TabsTrigger value="evolution">Time Evolution</TabsTrigger>
                <TabsTrigger value="delays">Delays</TabsTrigger>
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

              <TabsContent value="overview" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Overall Sample Lead Time</CardTitle>
                    <CardDescription>Average time from sample request to delivery across all samples</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex h-[300px] items-center justify-center">
                      <div className="text-center">
                        <div className="text-5xl font-bold">{data.overall.toFixed(1)}</div>
                        <div className="mt-2 text-muted-foreground">Average Days</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="by-customer" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Sample Lead Time by Customer</CardTitle>
                    <CardDescription>Average sample lead time broken down by customer</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {view === "chart" ? (
                      <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data.byCustomer} layout="vertical" margin={{ left: 50 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" unit=" days" />
                            <YAxis dataKey="customer" type="category" width={150} />
                            <Tooltip formatter={(value) => [`${value.toFixed(1)} days`, "Lead Time"]} />
                            <Legend />
                            <Bar dataKey="averageLeadTime" name="Avg. Lead Time" fill="#8884d8" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead className="text-right">Avg. Lead Time (Days)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.byCustomer.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>{item.customer}</TableCell>
                              <TableCell className="text-right">{item.averageLeadTime.toFixed(1)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="by-supplier" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Sample Lead Time by Supplier</CardTitle>
                    <CardDescription>Average sample lead time broken down by supplier</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {view === "chart" ? (
                      <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data.bySupplier} layout="vertical" margin={{ left: 50 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" unit=" days" />
                            <YAxis dataKey="supplier" type="category" width={150} />
                            <Tooltip formatter={(value) => [`${value.toFixed(1)} days`, "Lead Time"]} />
                            <Legend />
                            <Bar dataKey="averageLeadTime" name="Avg. Lead Time" fill="#82ca9d" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Supplier</TableHead>
                            <TableHead className="text-right">Avg. Lead Time (Days)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.bySupplier.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>{item.supplier}</TableCell>
                              <TableCell className="text-right">{item.averageLeadTime.toFixed(1)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="evolution" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Sample Lead Time Evolution</CardTitle>
                    <CardDescription>How sample lead times have changed over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {view === "chart" ? (
                      <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={data.evolution}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="monthYear" />
                            <YAxis unit=" days" />
                            <Tooltip formatter={(value) => [`${value.toFixed(1)} days`, "Lead Time"]} />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="averageLeadTime"
                              name="Avg. Lead Time"
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
                            <TableHead className="text-right">Avg. Lead Time (Days)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.evolution.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>{item.monthYear}</TableCell>
                              <TableCell className="text-right">{item.averageLeadTime.toFixed(1)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="delays" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Sample Delays by Supplier</CardTitle>
                    <CardDescription>Average delay in days between target and actual delivery dates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {view === "chart" ? (
                      <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data.delays} layout="vertical" margin={{ left: 50 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" unit=" days" />
                            <YAxis dataKey="supplier" type="category" width={150} />
                            <Tooltip formatter={(value) => [`${value.toFixed(1)} days`, "Avg. Delay"]} />
                            <Legend />
                            <Bar dataKey="averageDelay" name="Avg. Delay" fill="#ff8042" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Supplier</TableHead>
                            <TableHead className="text-right">Avg. Delay (Days)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.delays.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>{item.supplier}</TableCell>
                              <TableCell className="text-right">{item.averageDelay.toFixed(1)}</TableCell>
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

"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/dashboard-layout"
import {
  LineChart,
  PieChart,
  ArrowUpRight,
  TrendingUp,
  ShoppingCart,
  Package,
  Clock,
  Truck,
  BarChart,
  GanttChart,
} from "lucide-react"

export default function AnalyticsPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Explore and analyze your apparel supply chain data</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/analytics/sales-evolution">
            <Card className="hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">Sales Evolution</CardTitle>
                <LineChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <CardDescription>Track sales trends over time by customer and product</CardDescription>
                <div className="mt-2 flex items-center text-sm text-muted-foreground">
                  <ArrowUpRight className="mr-1 h-4 w-4" />
                  <span>View analysis</span>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/analytics/profitability">
            <Card className="hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">Profitability</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <CardDescription>Analyze profit margins by customer and product category</CardDescription>
                <div className="mt-2 flex items-center text-sm text-muted-foreground">
                  <ArrowUpRight className="mr-1 h-4 w-4" />
                  <span>View analysis</span>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/analytics/product-categories">
            <Card className="hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">Product Categories</CardTitle>
                <PieChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <CardDescription>Explore product category distribution and performance</CardDescription>
                <div className="mt-2 flex items-center text-sm text-muted-foreground">
                  <ArrowUpRight className="mr-1 h-4 w-4" />
                  <span>View analysis</span>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/analytics/purchase-orders">
            <Card className="hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">Purchase Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <CardDescription>Track purchase order lead times and performance</CardDescription>
                <div className="mt-2 flex items-center text-sm text-muted-foreground">
                  <ArrowUpRight className="mr-1 h-4 w-4" />
                  <span>View analysis</span>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/analytics/order-size">
            <Card className="hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">Order Size</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <CardDescription>Analyze order sizes and values by customer</CardDescription>
                <div className="mt-2 flex items-center text-sm text-muted-foreground">
                  <ArrowUpRight className="mr-1 h-4 w-4" />
                  <span>View analysis</span>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/analytics/sample-lead-time">
            <Card className="hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">Sample Lead Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <CardDescription>Track sample development lead times by type</CardDescription>
                <div className="mt-2 flex items-center text-sm text-muted-foreground">
                  <ArrowUpRight className="mr-1 h-4 w-4" />
                  <span>View analysis</span>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/analytics/shipments">
            <Card className="hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">Shipments</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <CardDescription>Analyze shipment volumes and performance</CardDescription>
                <div className="mt-2 flex items-center text-sm text-muted-foreground">
                  <ArrowUpRight className="mr-1 h-4 w-4" />
                  <span>View analysis</span>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/analytics/conversion">
            <Card className="hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">Sample Conversion</CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <CardDescription>Track sample to order conversion rates</CardDescription>
                <div className="mt-2 flex items-center text-sm text-muted-foreground">
                  <ArrowUpRight className="mr-1 h-4 w-4" />
                  <span>View analysis</span>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/analytics/samples">
            <Card className="hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">Samples Timeline</CardTitle>
                <GanttChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <CardDescription>Visualize sample timelines with Gantt charts</CardDescription>
                <div className="mt-2 flex items-center text-sm text-muted-foreground">
                  <ArrowUpRight className="mr-1 h-4 w-4" />
                  <span>View timeline</span>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/analytics/production-orders">
            <Card className="hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">Production Timeline</CardTitle>
                <GanttChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <CardDescription>Track production orders with Gantt charts and milestones</CardDescription>
                <div className="mt-2 flex items-center text-sm text-muted-foreground">
                  <ArrowUpRight className="mr-1 h-4 w-4" />
                  <span>View timeline</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  )
}

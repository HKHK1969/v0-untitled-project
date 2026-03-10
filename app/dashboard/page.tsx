"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import {
  BarChart3,
  Database,
  FileText,
  Package,
  ShoppingBag,
  Truck,
  Users,
  Upload,
  Shield,
  LineChart,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import AIAssistant from "@/components/ai-assistant"

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-background border-b">
        <div className="container flex h-16 items-center px-4 md:px-6">
          <Link href="/" className="text-lg font-semibold">
            Apparel Supply Chain Tracker
          </Link>
          <nav className="ml-auto flex gap-4 sm:gap-6">
            <Link href="/dashboard" className="text-sm font-medium hover:underline underline-offset-4">
              Dashboard
            </Link>
            <Link href="/tables" className="text-sm font-medium hover:underline underline-offset-4">
              Tables
            </Link>
            <Link href="/analytics" className="text-sm font-medium hover:underline underline-offset-4">
              Analytics
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6">
        <motion.div initial="hidden" animate="visible" variants={fadeIn} className="grid gap-4 md:gap-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href="/analytics">View Analytics</Link>
              </Button>
              <Button asChild>
                <Link href="/tables">View All Tables</Link>
              </Button>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Total Customers", value: 120, icon: Users, change: "+5 this month" },
              { title: "Total Suppliers", value: 45, icon: Truck, change: "+2 this month" },
              { title: "Active Styles", value: 78, icon: ShoppingBag, change: "+12 this month" },
              { title: "Open Orders", value: 32, icon: Package, change: "-4 this month" },
            ].map((item, index) => (
              <motion.div key={index} variants={fadeIn}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                    <item.icon className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{item.value}</div>
                    <p className="text-xs text-muted-foreground">{item.change}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <motion.div variants={fadeIn} className="lg:col-span-4">
              <Card>
                <CardHeader>
                  <CardTitle>Database Tables</CardTitle>
                  <CardDescription>Manage your data tables and records</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {[
                      { title: "Customers", icon: Users, link: "/tables/customers" },
                      { title: "Suppliers", icon: Truck, link: "/tables/suppliers" },
                      { title: "Styles", icon: ShoppingBag, link: "/tables/styles" },
                      { title: "Fabrics", icon: FileText, link: "/tables/fabrics" },
                      { title: "Orders", icon: Package, link: "/tables/orders" },
                      { title: "Tasks", icon: FileText, link: "/tables/tasks" },
                    ].map((item, index) => (
                      <Link
                        key={index}
                        href={item.link}
                        className="flex items-center p-4 border rounded-lg hover:bg-muted transition-all"
                      >
                        <item.icon className="w-5 h-5 mr-3 text-primary" />
                        <div>
                          <h3 className="font-medium">{item.title}</h3>
                          <p className="text-sm text-muted-foreground">Manage {item.title.toLowerCase()} data</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={fadeIn} className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common tasks and operations</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  {[
                    {
                      title: "Analytics Dashboards",
                      icon: BarChart3,
                      link: "/analytics",
                      description: "View interactive analytics dashboards",
                      extraClass: "bg-blue-50 dark:bg-blue-950/30", // Highlight new feature
                    },
                    {
                      title: "Create New Table",
                      icon: Database,
                      link: "/tables/create",
                      description: "Define a new data table",
                    },
                    {
                      title: "Generate Reports",
                      icon: LineChart,
                      link: "/reports",
                      description: "Create AI-powered custom reports",
                    },
                    {
                      title: "Import Data",
                      icon: Upload,
                      link: "/import",
                      description: "Import data from CSV or Excel",
                    },
                    {
                      title: "Data Backup & Recovery",
                      icon: Shield,
                      link: "/data-backup",
                      description: "Protect and restore your data",
                    },
                  ].map((item, index) => (
                    <Link
                      key={index}
                      href={item.link}
                      className={`flex items-center p-4 border rounded-lg hover:bg-muted transition-all ${item.extraClass || ""}`}
                    >
                      <item.icon className="w-5 h-5 mr-3 text-primary" />
                      <div>
                        <h3 className="font-medium">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </main>

      {/* AI Assistant */}
      <AIAssistant />
    </div>
  )
}

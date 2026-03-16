import Link from "next/link"
import { ArrowLeft, Package, Truck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

const ORDER_TYPES = [
  {
    title: "Sample Orders",
    description: "Track all sample requests",
    content: "Manage sample requests from customers including proto samples, fit samples, PP samples, and TOP samples.",
    link: "/tables/sampleOrders",
    linkText: "View Sample Orders",
    icon: Package,
    iconColor: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  {
    title: "Production Orders",
    description: "Track bulk purchase orders",
    content: "Manage production orders, bulk quantities, delivery schedules, and shipment tracking.",
    link: "/tables/productionOrders",
    linkText: "View Production Orders",
    icon: Truck,
    iconColor: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
]

export default function OrdersPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-background border-b">
        <div className="container flex h-16 items-center px-4 md:px-6">
          <Link href="/" className="text-lg font-semibold">
            Sourcing Ninja
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
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" asChild className="mr-2">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to Home</span>
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
              <p className="text-muted-foreground">Manage your sample requests and production orders</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {ORDER_TYPES.map((orderType) => {
              const IconComponent = orderType.icon
              return (
                <Card key={orderType.title} className={`${orderType.borderColor} ${orderType.bgColor}`}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-white ${orderType.borderColor} border`}>
                        <IconComponent className={`h-6 w-6 ${orderType.iconColor}`} />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{orderType.title}</CardTitle>
                        <CardDescription>{orderType.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{orderType.content}</p>
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full">
                      <Link href={orderType.link}>
                        {orderType.linkText}
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        </div>
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Sourcing Ninja. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

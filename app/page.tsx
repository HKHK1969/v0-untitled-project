import Link from "next/link"
import { ArrowRight, AlertTriangle, Clock, Calendar, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Feature card data for maintainability
const FEATURE_CARDS = [
  {
    title: "Customers",
    description: "Manage your customer database",
    content: "Track customer information and orders",
    link: "/tables/customers",
    linkText: "View Customers",
  },
  {
    title: "Suppliers",
    description: "Manage your supplier database",
    content: "Track supplier information and orders",
    link: "/tables/suppliers",
    linkText: "View Suppliers",
  },
  {
    title: "Styles",
    description: "Manage your style database",
    content: "Track style information and inventory",
    link: "/tables/styles",
    linkText: "View Styles",
  },
  {
    title: "Orders",
    description: "Manage all your orders",
    content: "Track sample requests and production orders",
    link: "/orders",
    linkText: "View Orders",
  },
]

// Mock urgent data - in real app this would come from your data source
const URGENT_ITEMS = {
  criticalTasks: [
    { id: 1, title: "Review PO #12345 specifications", customer: "Nike", daysOverdue: 2, urgency: "Critical" },
    { id: 2, title: "Approve sample for Style ABC123", customer: "Adidas", daysOverdue: 1, urgency: "High" },
    { id: 3, title: "Update delivery schedule", customer: "Puma", daysOverdue: 0, urgency: "High" },
  ],
  nearingDeadlines: [
    { id: 1, title: "Sample delivery for Style XYZ789", customer: "Under Armour", daysLeft: 1 },
    { id: 2, title: "PO #67890 ex-factory date", customer: "Reebok", daysLeft: 2 },
    { id: 3, title: "Price quote validation", customer: "New Balance", daysLeft: 3 },
  ],
  delayedOrders: [
    { id: 1, orderNumber: "SO-2024-001", customer: "Nike", daysDelayed: 5, type: "Sample Order" },
    { id: 2, orderNumber: "PO-2024-045", customer: "Adidas", daysDelayed: 3, type: "Customer PO" },
  ],
  urgentRequests: [
    { id: 1, title: "Rush sample request", customer: "Puma", requestedBy: "John Smith", priority: "Critical" },
    { id: 2, title: "Expedite shipping", customer: "Under Armour", requestedBy: "Sarah Johnson", priority: "High" },
  ],
}

export default function Home() {
  // App name could be fetched from an API or context in the future
  const appName = "Sourcing Ninja"

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-background border-b">
        <div className="container flex h-16 items-center px-4 md:px-6">
          <span className="text-lg font-semibold">{appName}</span>
          <nav className="ml-auto flex gap-4 sm:gap-6">
            <Link href="/dashboard" className="text-sm font-medium hover:underline underline-offset-4">
              Dashboard
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-8 bg-red-50 border-b">
          <div className="container px-4 md:px-6">
            <div className="flex items-center gap-2 mb-6">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <h2 className="text-2xl font-bold text-red-900">Critical & Urgent Items</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {/* Critical Tasks */}
              <Card className="border-red-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    Overdue Tasks
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {URGENT_ITEMS.criticalTasks.map((task) => (
                    <div key={task.id} className="p-3 bg-red-100 rounded-lg">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-red-900">{task.title}</p>
                          <p className="text-xs text-red-700">{task.customer}</p>
                        </div>
                        <Badge variant={task.urgency === "Critical" ? "destructive" : "secondary"} className="text-xs">
                          {task.daysOverdue}d overdue
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
                <CardFooter>
                  <Link href="/tables/tasks" className="text-sm text-red-700 hover:underline">
                    View all tasks →
                  </Link>
                </CardFooter>
              </Card>

              {/* Nearing Deadlines */}
              <Card className="border-orange-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                    Nearing Deadlines
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {URGENT_ITEMS.nearingDeadlines.map((item) => (
                    <div key={item.id} className="p-3 bg-orange-100 rounded-lg">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-orange-900">{item.title}</p>
                          <p className="text-xs text-orange-700">{item.customer}</p>
                        </div>
                        <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                          {item.daysLeft}d left
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
                <CardFooter>
                  <Link href="/tables/sampleOrders" className="text-sm text-orange-700 hover:underline">
                    View all orders →
                  </Link>
                </CardFooter>
              </Card>

              {/* Delayed Orders */}
              <Card className="border-yellow-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-yellow-600" />
                    Delayed Orders
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {URGENT_ITEMS.delayedOrders.map((order) => (
                    <div key={order.id} className="p-3 bg-yellow-100 rounded-lg">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-yellow-900">{order.orderNumber}</p>
                          <p className="text-xs text-yellow-700">
                            {order.customer} • {order.type}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs border-yellow-300 text-yellow-700">
                          {order.daysDelayed}d delayed
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
                <CardFooter>
                  <Link href="/tables/customerPOs" className="text-sm text-yellow-700 hover:underline">
                    View all POs →
                  </Link>
                </CardFooter>
              </Card>

              {/* Urgent Requests */}
              <Card className="border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Urgent Requests
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {URGENT_ITEMS.urgentRequests.map((request) => (
                    <div key={request.id} className="p-3 bg-blue-100 rounded-lg">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-900">{request.title}</p>
                          <p className="text-xs text-blue-700">
                            {request.customer} • {request.requestedBy}
                          </p>
                        </div>
                        <Badge
                          variant={request.priority === "Critical" ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {request.priority}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
                <CardFooter>
                  <Link href="/tables/customers" className="text-sm text-blue-700 hover:underline">
                    View all customers →
                  </Link>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">{appName}</h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Manage your apparel business with our comprehensive supply chain tracking system.
                </p>
              </div>
              <div className="space-x-4">
                <Button asChild>
                  <Link href="/dashboard">
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="mx-auto grid max-w-5xl items-center gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Manage Your Data</h2>
                <p className="text-muted-foreground md:text-xl">
                  Create custom tables, define fields, and manage your entire supply chain in one place.
                </p>
              </div>
              <div className="grid gap-6">
                <div className="grid grid-cols-2 gap-4">
                  {FEATURE_CARDS.map((card) => (
                    <Card key={card.title}>
                      <CardHeader className="pb-2">
                        <CardTitle>{card.title}</CardTitle>
                        <CardDescription>{card.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="text-sm text-muted-foreground">{card.content}</p>
                      </CardContent>
                      <CardFooter>
                        <Link href={card.link} className="text-sm underline-offset-4 hover:underline">
                          {card.linkText}
                        </Link>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} {appName}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

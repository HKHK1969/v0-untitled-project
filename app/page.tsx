import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

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
    title: "Sample Orders",
    description: "Manage your sample order database",
    content: "Track sample order information and status",
    link: "/tables/sampleOrders",
    linkText: "View Sample Orders",
  },
]

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

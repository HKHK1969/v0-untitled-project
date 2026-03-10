"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, Search, Table, Users, Package, ShoppingCart, Factory, Beaker, Truck } from "lucide-react"
import { predefinedTables, type TableSchema } from "@/lib/data-structure"
import { loadData } from "@/lib/data-persistence"

const tableIcons = {
  customers: Users,
  suppliers: Factory,
  products: Package,
  orders: ShoppingCart,
  "production-orders": Factory,
  samples: Beaker,
  shipments: Truck,
}

export default function TablesPage() {
  const [tables, setTables] = useState<TableSchema[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [recordCounts, setRecordCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    loadTables()
    loadRecordCounts()
  }, [])

  const loadTables = async () => {
    try {
      const savedTables = await loadData("tables")
      if (savedTables && savedTables.length > 0) {
        setTables(savedTables)
      } else {
        setTables(predefinedTables)
      }
    } catch (error) {
      console.error("Error loading tables:", error)
      setTables(predefinedTables)
    }
  }

  const loadRecordCounts = async () => {
    const counts: Record<string, number> = {}

    for (const table of predefinedTables) {
      try {
        const records = await loadData(`table_${table.id}`)
        counts[table.id] = records ? records.length : 0
      } catch (error) {
        counts[table.id] = 0
      }
    }

    setRecordCounts(counts)
  }

  const filteredTables = tables.filter(
    (table) =>
      table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      table.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Tables</h1>
          <p className="text-muted-foreground">Manage your data tables and records</p>
        </div>
        <div className="flex space-x-2">
          <Link href="/tables/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Table
            </Button>
          </Link>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search tables..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTables.map((table) => {
          const IconComponent = tableIcons[table.id as keyof typeof tableIcons] || Table
          const recordCount = recordCounts[table.id] || 0

          return (
            <Link key={table.id} href={`/tables/${table.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{table.name}</CardTitle>
                        <CardDescription className="text-sm">{table.description || "No description"}</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-2">
                      <Badge variant="secondary">{table.fields.length} fields</Badge>
                      <Badge variant="outline">{recordCount} records</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Updated {new Date(table.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {filteredTables.length === 0 && (
        <div className="text-center py-12">
          <Table className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tables found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm ? "No tables match your search criteria." : "Get started by creating your first table."}
          </p>
          {!searchTerm && (
            <Link href="/tables/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Table
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

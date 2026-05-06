"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import Link from "next/link"
import { Database, Plus, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { tables as staticTables, type TableDefinition } from "@/lib/data-structure"
import { toast } from "@/components/ui/use-toast"

// Native debounce implementation
function debounce<T extends (...args: any[]) => any>(func: T, delay: number): T {
  let timeoutId: NodeJS.Timeout
  return ((...args: any[]) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(null, args), delay)
  }) as T
}

// Interfaces
type TablesPageProps = {}

// Constants
const DEBOUNCE_DELAY = 300 // ms

export default function TablesPage(_props: TablesPageProps) {
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [allTables, setAllTables] = useState<TableDefinition[]>(staticTables)

  useEffect(() => {
    const loadAllTables = () => {
      console.log("[v0] Loading all tables from static data and localStorage")

      // Start with static tables
      const combinedTables = [...staticTables]

      // Load dynamically created tables from localStorage
      try {
        const savedTables = localStorage.getItem("tables")
        if (savedTables) {
          const dynamicTables = JSON.parse(savedTables)
          console.log("[v0] Found dynamic tables in localStorage:", dynamicTables.length)

          // Add dynamic tables that don't already exist in static tables
          dynamicTables.forEach((dynamicTable: TableDefinition) => {
            if (!combinedTables.some((staticTable) => staticTable.id === dynamicTable.id)) {
              combinedTables.push(dynamicTable)
            }
          })
        }
      } catch (error) {
        console.error("[v0] Error loading dynamic tables:", error)
      }

      console.log("[v0] Total tables loaded:", combinedTables.length)
      setAllTables(combinedTables)
    }

    loadAllTables()

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "tables") {
        console.log("[v0] Tables storage changed, reloading...")
        loadAllTables()
      }
    }

    window.addEventListener("storage", handleStorageChange)

    // Also listen for custom events from the same tab
    const handleTableCreated = () => {
      console.log("[v0] Table created event received, reloading...")
      loadAllTables()
    }

    window.addEventListener("tableCreated", handleTableCreated)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("tableCreated", handleTableCreated)
    }
  }, [])

  // Debounced search handler
  const debouncedSetSearchTerm = useMemo(() => debounce((value: string) => setSearchTerm(value), DEBOUNCE_DELAY), [])

  const filteredTables = useMemo(() => {
    if (!searchTerm.trim()) return allTables

    const term = searchTerm.toLowerCase()
    return allTables.filter(
      (table) => table.name.toLowerCase().includes(term) || table.description.toLowerCase().includes(term),
    )
  }, [searchTerm, allTables])

  // Handle empty state
  const renderEmptyState = useCallback(
    () => (
      <div className="text-center py-8">
        <Database className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold">No Tables Found</h2>
        <p className="text-muted-foreground mb-4">
          {searchTerm ? "No tables match your search." : "Create your first table to get started."}
        </p>
        <Button asChild>
          <Link href="/tables/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Table
          </Link>
        </Button>
      </div>
    ),
    [searchTerm],
  )

  // Placeholder for import functionality
  const handleImportClick = useCallback(() => {
    toast({
      title: "Import Data",
      description: "Import functionality not yet implemented.",
      variant: "default",
    })
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 p-4 md:p-6">
        <div className="grid gap-4 md:gap-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Database Tables</h1>
              <p className="text-muted-foreground">
                Manage your data tables and records ({filteredTables.length} tables)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search tables..."
                className="w-[200px]"
                value={searchTerm}
                onChange={(e) => debouncedSetSearchTerm(e.target.value)}
              />
              <Button variant="outline" onClick={handleImportClick}>
                <Upload className="mr-2 h-4 w-4" />
                Import Data
              </Button>
              <Button asChild>
                <Link href="/tables/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Table
                </Link>
              </Button>
            </div>
          </div>

          {filteredTables.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTables.map((table: TableDefinition) => (
                <Card key={table.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center">
                      <Database className="mr-2 h-4 w-4" />
                      {table.name}
                    </CardTitle>
                    <CardDescription>{table.description || "No description available"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{table.fields.length} fields defined</p>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/tables/${table.id}`}>View Table</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/tables/${table.id}/settings`}>Settings</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            renderEmptyState()
          )}
        </div>
      </main>
    </div>
  )
}

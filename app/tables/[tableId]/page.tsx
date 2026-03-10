"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, Settings, MoreHorizontal, Edit, Trash2, Eye, EyeOff, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useData } from "@/app/ClientLayout"
import { getFieldDisplayValue } from "@/lib/data-structure"
import { KanbanBoard } from "@/components/kanban-board"
import { getKanbanConfig } from "@/lib/kanban-utils"
import { GanttChart } from "@/components/gantt-chart"
import { getGanttConfig } from "@/lib/gantt-utils"
import { toast } from "@/components/ui/use-toast"

export default function TablePage() {
  const params = useParams()
  const router = useRouter()
  const tableId = params.tableId as string
  const { tables, records, deleteRecord, updateRecord } = useData()

  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState("table")

  const table = tables.find((t) => t.id === tableId)
  const tableRecords = records[tableId] || []

  const kanbanConfig = useMemo(() => {
    return getKanbanConfig(tableId, tableRecords)
  }, [tableId, tableRecords])

  const ganttConfig = useMemo(() => {
    return getGanttConfig(tableId)
  }, [tableId])

  useEffect(() => {
    if (!table) {
      router.push("/tables")
    }
  }, [table, router])

  if (!table) {
    return <div>Loading...</div>
  }

  const visibleFields = table.fields.filter((field) => !hiddenColumns.has(field.id))

  const handleDeleteRecord = async (recordId: string) => {
    if (confirm("Are you sure you want to delete this record?")) {
      deleteRecord(tableId, recordId)
      toast({
        title: "Record deleted",
        description: "The record has been successfully deleted.",
      })
    }
  }

  const toggleColumnVisibility = (fieldId: string) => {
    setHiddenColumns((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(fieldId)) {
        newSet.delete(fieldId)
      } else {
        newSet.add(fieldId)
      }
      return newSet
    })
  }

  const handleKanbanMove = (recordId: string, newStatus: string) => {
    const config = kanbanConfig
    if (!config) return

    updateRecord(tableId, recordId, { [config.statusField]: newStatus })
    toast({
      title: "Status updated",
      description: `Record moved to ${newStatus}`,
    })
  }

  const getItemUrl = (recordId: string) => {
    return `/tables/${tableId}/edit/${recordId}`
  }

  const availableTabs = [
    { id: "table", label: "Table View" },
    ...(kanbanConfig ? [{ id: "kanban", label: "Kanban View" }] : []),
    ...(ganttConfig ? [{ id: "gantt", label: "Gantt View" }] : []),
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-background border-b">
        <div className="container flex h-16 items-center px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard" className="flex items-center gap-2">
                <span className="text-lg">🥷</span>
                <span className="sr-only">Home</span>
              </Link>
            </Button>
            <Link href="/" className="text-lg font-semibold">
              Apparel Supply Chain Tracker
            </Link>
          </div>
          <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
            <Link href="/dashboard" className="text-sm font-medium hover:underline underline-offset-4">
              Dashboard
            </Link>
            <Link href="/tables" className="text-sm font-medium hover:underline underline-offset-4">
              Tables
            </Link>
            <Link href="/analytics" className="text-sm font-medium hover:underline underline-offset-4">
              Analytics
            </Link>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{table.name}</h1>
              {table.description && <p className="text-muted-foreground">{table.description}</p>}
            </div>
            <div className="flex items-center gap-2">
              <Button asChild>
                <Link href={`/tables/${tableId}/add`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Record
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/tables/${tableId}/settings`}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              {availableTabs.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="table" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Records</CardTitle>
                      <CardDescription>
                        {tableRecords.length} record{tableRecords.length !== 1 ? "s" : ""}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="mr-2 h-4 w-4" />
                          Columns
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {table.fields.map((field) => (
                          <DropdownMenuItem
                            key={field.id}
                            onClick={() => toggleColumnVisibility(field.id)}
                            className="flex items-center justify-between"
                          >
                            <span>{field.name}</span>
                            {hiddenColumns.has(field.id) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  {tableRecords.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">No records found</p>
                      <Button asChild>
                        <Link href={`/tables/${tableId}/add`}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add First Record
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {visibleFields.map((field) => (
                              <TableHead key={field.id}>{field.name}</TableHead>
                            ))}
                            <TableHead className="w-[100px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tableRecords.map((record) => (
                            <TableRow key={record.id}>
                              {visibleFields.map((field) => (
                                <TableCell key={field.id}>
                                  {field.type === "multiselect" && Array.isArray(record[field.id]) ? (
                                    <div className="flex flex-wrap gap-1">
                                      {record[field.id].map((value: string, index: number) => (
                                        <Badge key={index} variant="secondary" className="text-xs">
                                          {value}
                                        </Badge>
                                      ))}
                                    </div>
                                  ) : (
                                    getFieldDisplayValue(field, record[field.id], records)
                                  )}
                                </TableCell>
                              ))}
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <span className="sr-only">Open menu</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                      <Link href={`/tables/${tableId}/edit/${record.id}`}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteRecord(record.id)}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {kanbanConfig && (
              <TabsContent value="kanban" className="space-y-4">
                <KanbanBoard
                  records={tableRecords}
                  statusField={kanbanConfig.statusField}
                  statusConfig={kanbanConfig.columns}
                  onItemMove={handleKanbanMove}
                  getItemTitle={kanbanConfig.getCardTitle}
                  getItemDescription={kanbanConfig.getCardDescription}
                  getItemTags={kanbanConfig.getCardTags}
                  getItemUrl={getItemUrl}
                />
              </TabsContent>
            )}

            {ganttConfig && (
              <TabsContent value="gantt" className="space-y-4">
                <GanttChart records={tableRecords} config={ganttConfig} />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>
    </div>
  )
}

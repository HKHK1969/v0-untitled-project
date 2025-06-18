"use client"

import { cn } from "@/lib/utils"

import { useEffect, useState, useMemo, useCallback } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Download,
  Filter,
  Plus,
  Settings,
  X,
  ArrowUpDown,
  Edit,
  Calendar,
  LayoutGrid,
  List,
  GanttChartSquare,
} from "lucide-react"
import Image from "next/image"
import debounce from "lodash/debounce" // Add as dependency

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from "@/components/ui/table"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { DraggableTableHeader } from "@/components/draggable-table-header"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { getTableById, type TableDefinition } from "@/lib/data-structure"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { format } from "date-fns"
import { toast } from "@/components/ui/use-toast"
import { KanbanBoard } from "@/components/kanban-board"
import { loadData } from "@/lib/data-persistence"

// Interfaces
interface Column {
  id: string
  label: string
  type: string
  required: boolean
  width: number
}

interface RowData {
  id?: string
  [key: string]: any
}

interface TablePageProps {
  params: {
    tableId: string
  }
}

// Constants
const DEBOUNCE_DELAY = 300 // ms
const DEFAULT_COLUMN_WIDTH = 150
const IMAGE_COLUMN_WIDTH = 100
const MIN_COLUMN_WIDTH = 50

// Gantt view configurations for different table types
const GANTT_CONFIGS = {
  sampleOrders: {
    startDateField: "requestDate",
    endDateField: "exFactoryRequested",
    titleField: "styleCode",
    descriptionField: "styleDescription",
    milestones: [
      { field: "approvalDate", label: "Approval" },
      { field: "productionDate", label: "Production" },
      { field: "shippingDate", label: "Shipping" },
    ],
  },
  customerPOs: {
    startDateField: "orderDate",
    endDateField: "exFactoryDate",
    titleField: "poNumber",
    descriptionField: "style",
    milestones: [
      { field: "fabricDate", label: "Fabric Ready" },
      { field: "productionStartDate", label: "Production Start" },
      { field: "qcDate", label: "QC" },
      { field: "shippingDate", label: "Shipping" },
    ],
  },
  // Default configuration for other tables
  default: {
    startDateField: "startDate",
    endDateField: "endDate",
    titleField: "id",
    descriptionField: "description",
    milestones: [],
  },
}

// Kanban view configurations for different table types
const KANBAN_CONFIGS = {
  customers: {
    statusField: "status",
    statusConfig: {
      lead: { title: "Lead", color: "bg-blue-400" },
      active: { title: "Active", color: "bg-green-400" },
      inactive: { title: "Inactive", color: "bg-gray-400" },
      prospect: { title: "Prospect", color: "bg-purple-400" },
    },
    titleField: "companyName",
    descriptionField: "address",
    tagsField: "brands",
  },
  suppliers: {
    statusField: "status",
    statusConfig: {
      active: { title: "Active", color: "bg-green-400" },
      inactive: { title: "Inactive", color: "bg-gray-400" },
      new: { title: "New", color: "bg-blue-400" },
      blacklisted: { title: "Blacklisted", color: "bg-red-400" },
    },
    titleField: "companyName",
    descriptionField: "address",
    tagsField: "productCategories",
  },
  sampleOrders: {
    statusField: "status",
    statusConfig: {
      requested: { title: "Requested", color: "bg-blue-400" },
      in_progress: { title: "In Progress", color: "bg-yellow-400" },
      shipped: { title: "Shipped", color: "bg-purple-400" },
      delivered: { title: "Delivered", color: "bg-green-400" },
      cancelled: { title: "Cancelled", color: "bg-red-400" },
    },
    titleField: "styleCode",
    descriptionField: "styleDescription",
    dueDateField: "exFactoryRequested",
    priorityField: "priority",
  },
  customerPOs: {
    statusField: "status",
    statusConfig: {
      draft: { title: "Draft", color: "bg-gray-400" },
      submitted: { title: "Submitted", color: "bg-blue-400" },
      confirmed: { title: "Confirmed", color: "bg-green-400" },
      in_production: { title: "In Production", color: "bg-yellow-400" },
      shipped: { title: "Shipped", color: "bg-purple-400" },
      delivered: { title: "Delivered", color: "bg-teal-400" },
      cancelled: { title: "Cancelled", color: "bg-red-400" },
    },
    titleField: "poNumber",
    descriptionField: "style",
    dueDateField: "exFactoryDate",
  },
  tasks: {
    statusField: "status",
    statusConfig: {
      todo: { title: "To Do", color: "bg-gray-400", limit: 20 },
      in_progress: { title: "In Progress", color: "bg-blue-400", limit: 10 },
      review: { title: "Review", color: "bg-yellow-400" },
      done: { title: "Done", color: "bg-green-400" },
    },
    titleField: "title",
    descriptionField: "notes",
    dueDateField: "dueDate",
    priorityField: "urgency",
    assigneeField: "assignedTo",
  },
  // Default configuration for other tables
  default: {
    statusField: "status",
    statusConfig: {
      new: { title: "New", color: "bg-blue-400" },
      in_progress: { title: "In Progress", color: "bg-yellow-400" },
      completed: { title: "Completed", color: "bg-green-400" },
      cancelled: { title: "Cancelled", color: "bg-red-400" },
    },
    titleField: "id",
  },
}

export default function TablePage({ params }: TablePageProps) {
  const { tableId } = params
  const tableDefinition: TableDefinition | undefined = getTableById(tableId)

  const [tableData, setTableData] = useState<RowData[]>([])
  const [columns, setColumns] = useState<Column[]>([])
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [filters, setFilters] = useState<Record<string, string[]>>({})
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [filterMenuOpen, setFilterMenuOpen] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [viewMode, setViewMode] = useState<"table" | "kanban" | "gantt">("table")

  // Get the appropriate Kanban configuration for this table
  const kanbanConfig = useMemo(() => {
    return KANBAN_CONFIGS[tableId as keyof typeof KANBAN_CONFIGS] || KANBAN_CONFIGS.default
  }, [tableId])

  // Get the appropriate Gantt configuration for this table
  const ganttConfig = useMemo(() => {
    return GANTT_CONFIGS[tableId as keyof typeof GANTT_CONFIGS] || GANTT_CONFIGS.default
  }, [tableId])

  // Check if Gantt view is applicable for this table
  const isGanttApplicable = useMemo(() => {
    return tableId === "sampleOrders" || tableId === "customerPOs"
  }, [tableId])

  // Check if the table has a status field for Kanban view
  const hasStatusField = useMemo(() => {
    if (!tableDefinition) return false

    // Check if the table already has a status field
    const hasExistingStatus = tableDefinition.fields.some((field) => field.id === kanbanConfig.statusField)

    if (hasExistingStatus) return true

    // If no status field exists, we'll need to add a default status to each item
    return false
  }, [tableDefinition, kanbanConfig])

  const saveTableData = useCallback(
    (data: RowData[]) => {
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(`table_${tableId}_data`, JSON.stringify(data))
        } catch (e) {
          console.error("Error saving table data:", e)
          toast({
            title: "Error",
            description: "Failed to save table data",
            variant: "destructive",
          })
        }
      }
    },
    [tableId],
  )

  // Load initial table configuration
  const initializeTable = useCallback(() => {
    if (!tableDefinition) return

    setIsLoading(true)
    try {
      const tableColumns: Column[] = tableDefinition.fields.map((field) => ({
        id: field.id,
        label: field.label,
        type: field.type,
        required: field.required,
        width: field.type === "image" ? IMAGE_COLUMN_WIDTH : DEFAULT_COLUMN_WIDTH,
      }))

      if (!tableColumns.find((col) => col.id === "dateCreated")) {
        tableColumns.push({
          id: "dateCreated",
          label: "Date Created",
          type: "date",
          required: false,
          width: DEFAULT_COLUMN_WIDTH,
        })
      }

      // Add status column if it doesn't exist (for Kanban view)
      if (!tableColumns.find((col) => col.id === kanbanConfig.statusField)) {
        tableColumns.push({
          id: kanbanConfig.statusField,
          label: "Status",
          type: "dropdown",
          required: false,
          width: DEFAULT_COLUMN_WIDTH,
        })
      }

      setColumns(tableColumns)
      setColumnWidths(
        tableColumns.reduce(
          (acc, col) => ({
            ...acc,
            [col.id]: col.width,
          }),
          {},
        ),
      )
      setFilters({})
      setSortColumn(null)
      setSortDirection("asc")
      setSearchTerm("")
    } catch (e) {
      console.error("Error initializing table:", e)
      toast({
        title: "Error",
        description: "Failed to initialize table",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [tableDefinition, kanbanConfig])

  // Load and sync data from localStorage
  const loadTableData = useCallback(() => {
    if (typeof window === "undefined") return

    try {
      // Use the loadData function from DataPersistence
      const parsedData = loadData(tableId)

      // Add default status for Kanban view if needed
      if (!hasStatusField) {
        const updatedData = parsedData.map((item: RowData) => {
          if (!item[kanbanConfig.statusField]) {
            // Assign a default status (first one from the config)
            const defaultStatus = Object.keys(kanbanConfig.statusConfig)[0]
            return { ...item, [kanbanConfig.statusField]: defaultStatus }
          }
          return item
        })

        // Save the updated data
        saveTableData(updatedData)
        setTableData(updatedData)
      } else {
        setTableData(parsedData)
      }
    } catch (e) {
      console.error("Error loading table data:", e)
      toast({
        title: "Error",
        description: "Failed to load table data",
        variant: "destructive",
      })
      setTableData([])
    }
  }, [tableId, hasStatusField, kanbanConfig, saveTableData])

  useEffect(() => {
    initializeTable()
    loadTableData()

    const handleStorageChange = () => loadTableData()
    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [initializeTable, loadTableData, tableId])

  // Get unique values for filtering
  const uniqueValues = useMemo(() => {
    const values: Record<string, string[]> = {}
    columns.forEach((column) => {
      const uniqueSet = new Set<string>()
      tableData.forEach((row) => {
        const value = row[column.id]
        if (Array.isArray(value)) {
          value.forEach((item) => item != null && uniqueSet.add(String(item)))
        } else if (value != null) {
          uniqueSet.add(String(value))
        }
      })
      values[column.id] = Array.from(uniqueSet).sort()
    })
    return values
  }, [tableData, columns])

  const handleSort = useCallback(
    (columnId: string) => {
      setSortColumn((prev) => (prev === columnId && sortDirection === "asc" ? columnId : columnId))
      setSortDirection((prev) => (sortColumn === columnId ? (prev === "asc" ? "desc" : "asc") : "asc"))
    },
    [sortColumn, sortDirection],
  )

  const moveColumn = useCallback((dragIndex: number, hoverIndex: number) => {
    setColumns((prev) => {
      const newColumns = [...prev]
      const [draggedColumn] = newColumns.splice(dragIndex, 1)
      newColumns.splice(hoverIndex, 0, draggedColumn)
      return newColumns
    })
  }, [])

  const handleColumnResize = useCallback((columnId: string, newWidth: number) => {
    setColumnWidths((prev) => ({
      ...prev,
      [columnId]: Math.max(newWidth, MIN_COLUMN_WIDTH),
    }))
  }, [])

  const toggleFilter = useCallback((columnId: string, value: string) => {
    setFilters((prev) => {
      const current = prev[columnId] || []
      return {
        ...prev,
        [columnId]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
      }
    })
  }, [])

  const clearFilters = useCallback((columnId: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev }
      delete newFilters[columnId]
      return newFilters
    })
  }, [])

  const clearAllFilters = useCallback(() => {
    setFilters({})
    setSearchTerm("")
  }, [])

  const getActiveFilterCount = useCallback(() => {
    return (
      Object.values(filters).reduce((count, values) => count + (values.length > 0 ? 1 : 0), 0) + (searchTerm ? 1 : 0)
    )
  }, [filters, searchTerm])

  const debouncedSetSearchTerm = useMemo(() => debounce((value: string) => setSearchTerm(value), DEBOUNCE_DELAY), [])

  // Handle Kanban item move
  const handleKanbanItemMove = useCallback(
    (itemId: string, newStatus: string) => {
      setTableData((prevData) => {
        const newData = prevData.map((item) => {
          if (item.id === itemId) {
            return { ...item, [kanbanConfig.statusField]: newStatus }
          }
          return item
        })

        // Save the updated data
        saveTableData(newData)

        return newData
      })

      toast({
        title: "Item moved",
        description: `Item moved to ${kanbanConfig.statusConfig[newStatus]?.title || newStatus}`,
      })
    },
    [kanbanConfig, saveTableData],
  )

  // Get URL for editing an item
  const getItemUrl = useCallback(
    (itemId: string) => {
      return `/tables/${tableId}/edit/${itemId}`
    },
    [tableId],
  )

  // Prepare Gantt chart data
  const ganttData = useMemo(() => {
    if (!isGanttApplicable) return []

    return tableData
      .filter((item) => item[ganttConfig.startDateField] && item[ganttConfig.endDateField])
      .map((item) => {
        const startDate = new Date(item[ganttConfig.startDateField])
        const endDate = new Date(item[ganttConfig.endDateField])

        // Skip invalid dates
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return null
        }

        // Create milestone data
        const milestones = ganttConfig.milestones
          .filter((milestone) => item[milestone.field])
          .map((milestone) => ({
            date: new Date(item[milestone.field]),
            label: milestone.label,
          }))
          .filter((milestone) => !isNaN(milestone.date.getTime()))

        return {
          id: item.id,
          title: item[ganttConfig.titleField] || `Item ${item.id}`,
          description: item[ganttConfig.descriptionField] || "",
          startDate,
          endDate,
          status: item[kanbanConfig.statusField] || "default",
          milestones,
          assignee: item.assignee || "Unassigned",
          priority: item.priority || "Medium",
        }
      })
      .filter(Boolean) // Remove null entries
  }, [tableData, isGanttApplicable, ganttConfig, kanbanConfig])

  // Optimize table sorting for large datasets
  // Process data (filter and sort) with memoization
  const processedData = useMemo(() => {
    // First apply filters
    let filteredData = [...tableData]

    Object.entries(filters).forEach(([columnId, values]) => {
      if (values.length > 0) {
        filteredData = filteredData.filter((row) => {
          const value = row[columnId]
          return Array.isArray(value)
            ? value.some((item) => values.includes(String(item)))
            : values.includes(String(value))
        })
      }
    })

    // Then apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filteredData = filteredData.filter((row) =>
        columns.some(
          (col) =>
            col.type !== "image" &&
            String(row[col.id] || "")
              .toLowerCase()
              .includes(term),
        ),
      )
    }

    // Finally sort the filtered data
    if (sortColumn) {
      // Create a new array for sorting to avoid mutating the filtered data
      return [...filteredData].sort((a, b) => {
        const aValue = a[sortColumn]
        const bValue = b[sortColumn]
        const isDate = sortColumn === "dateCreated"

        if (isDate) {
          const aDate = aValue ? new Date(aValue).getTime() : 0
          const bDate = bValue ? new Date(bValue).getTime() : 0
          return sortDirection === "asc" ? aDate - bDate : bDate - aDate
        }

        const aStr = Array.isArray(aValue) ? aValue.join(", ") : String(aValue || "")
        const bStr = Array.isArray(bValue) ? bValue.join(", ") : String(bValue || "")
        return sortDirection === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr)
      })
    }

    return filteredData
  }, [tableData, filters, sortColumn, sortDirection, searchTerm, columns])

  const renderCellContent = useCallback(
    (value: any, columnId: string, columnType: string) => {
      if (columnType === "image") {
        return value ? (
          <div className="flex justify-center items-center h-16 w-16 mx-auto">
            <Image
              src={value.toString().startsWith("http") ? value.toString() : `/placeholder.svg?height=64&width=64`}
              alt="Image"
              width={64}
              height={64}
              className="object-cover rounded-md border"
              onError={(e) => {
                // Fallback to placeholder if image fails to load
                const target = e.target as HTMLImageElement
                target.src = `/placeholder.svg?height=64&width=64`
              }}
            />
          </div>
        ) : (
          // Show placeholder even when no value is provided
          <div className="flex justify-center items-center h-16 w-16 mx-auto">
            <div className="w-16 h-16 bg-muted rounded-md border flex items-center justify-center text-muted-foreground">
              <span className="text-xs">No image</span>
            </div>
          </div>
        )
      }

      if (columnId === "dateCreated" && value) {
        try {
          return format(new Date(value), "MMM d, yyyy")
        } catch {
          return String(value)
        }
      }

      if (Array.isArray(value)) {
        if (value.length === 0) return ""
        if (value.length > 2) {
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    {value.slice(0, 2).join(", ")}{" "}
                    <span className="text-muted-foreground">+{value.length - 2} more</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="max-w-xs">{value.join(", ")}</div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        }
        return value.join(", ")
      }

      // Special handling for status field in Kanban view
      if (columnId === kanbanConfig.statusField) {
        const statusConfig = kanbanConfig.statusConfig[value as string]
        if (statusConfig) {
          return (
            <Badge className={cn("px-2 py-0.5", statusConfig.color?.replace("bg-", "bg-opacity-20 text-"))}>
              {statusConfig.title}
            </Badge>
          )
        }
      }

      return String(value || "")
    },
    [kanbanConfig],
  )

  if (isLoading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  if (!tableDefinition) {
    return <div className="p-8 text-center">Table not found</div>
  }

  return (
    <div className="flex min-h-screen flex-col">
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
          </nav>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6">
        <div className="grid gap-4 md:gap-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center">
              <Button variant="ghost" size="icon" asChild className="mr-2">
                <Link href="/tables">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="sr-only">Back</span>
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{tableDefinition.name}</h1>
                <p className="text-muted-foreground">
                  {processedData.length} of {tableData.length} records
                  {getActiveFilterCount() > 0 && " (filtered)"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search..."
                className="w-[200px]"
                value={searchTerm}
                onChange={(e) => debouncedSetSearchTerm(e.target.value)}
              />
              {getActiveFilterCount() > 0 && (
                <Button variant="outline" size="sm" onClick={clearAllFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear Filters
                </Button>
              )}
              <div className="flex border rounded-md overflow-hidden">
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-none px-3"
                  onClick={() => setViewMode("table")}
                >
                  <List className="h-4 w-4 mr-1" />
                  Table
                </Button>
                <Button
                  variant={viewMode === "kanban" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-none px-3"
                  onClick={() => setViewMode("kanban")}
                >
                  <LayoutGrid className="h-4 w-4 mr-1" />
                  Kanban
                </Button>
                {isGanttApplicable && (
                  <Button
                    variant={viewMode === "gantt" ? "default" : "ghost"}
                    size="sm"
                    className="rounded-none px-3"
                    onClick={() => setViewMode("gantt")}
                  >
                    <GanttChartSquare className="h-4 w-4 mr-1" />
                    Gantt
                  </Button>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Download className="h-4 w-4" />
                    <span className="sr-only">Export</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Export as CSV</DropdownMenuItem>
                  <DropdownMenuItem>Export as Excel</DropdownMenuItem>
                  <DropdownMenuItem>Export as JSON</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" size="icon" asChild>
                <Link href={`/tables/${tableId}/settings`}>
                  <Settings className="h-4 w-4" />
                  <span className="sr-only">Settings</span>
                </Link>
              </Button>
              <Button asChild>
                <Link href={`/tables/${tableId}/add`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Record
                </Link>
              </Button>
            </div>
          </div>

          {/* Active filters display */}
          {getActiveFilterCount() > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              {Object.entries(filters).map(
                ([columnId, values]) =>
                  values.length > 0 && (
                    <Badge key={columnId} variant="secondary" className="flex items-center gap-1">
                      {columns.find((col) => col.id === columnId)?.label}:{" "}
                      {values.length === 1 ? values[0] : `${values.length} selected`}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 ml-1"
                        onClick={() => clearFilters(columnId)}
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Clear filter</span>
                      </Button>
                    </Badge>
                  ),
              )}
              {searchTerm && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Search: {searchTerm}
                  <Button variant="ghost" size="icon" className="h-4 w-4 p-0 ml-1" onClick={() => setSearchTerm("")}>
                    <X className="h-3 w-3" />
                    <span className="sr-only">Clear search</span>
                  </Button>
                </Badge>
              )}
            </div>
          )}

          {viewMode === "table" ? (
            <div className="border rounded-lg overflow-hidden">
              <DndProvider backend={HTML5Backend}>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {columns.map((column, index) => (
                          <DraggableTableHeader
                            key={column.id}
                            index={index}
                            id={column.id}
                            moveColumn={moveColumn}
                            width={columnWidths[column.id]}
                            onResize={handleColumnResize}
                            onClick={() => handleSort(column.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center cursor-pointer">
                                {column.id === "dateCreated" && (
                                  <Calendar className="mr-1 h-4 w-4 text-muted-foreground" />
                                )}
                                {column.label}
                                {column.required && <span className="text-destructive ml-1">*</span>}
                                {sortColumn === column.id &&
                                  (sortDirection === "asc" ? (
                                    <ArrowUp className="ml-2 h-4 w-4" />
                                  ) : (
                                    <ArrowDown className="ml-2 h-4 w-4" />
                                  ))}
                              </div>
                              {column.type !== "image" && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className={`h-7 w-7 p-0 ${filters[column.id]?.length ? "text-primary" : ""}`}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Filter className="h-4 w-4" />
                                      <span className="sr-only">Filter {column.label}</span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent className="w-[220px]" align="start">
                                    <div className="p-2 border-b">
                                      <div className="font-medium mb-2">Filter by {column.label}</div>
                                      <Input placeholder="Search values..." className="h-8 mb-2" />
                                    </div>
                                    <div className="p-2 border-b max-h-[200px] overflow-y-auto">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="text-sm text-muted-foreground">
                                          {filters[column.id]?.length || 0} of {uniqueValues[column.id]?.length || 0}{" "}
                                          selected
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 px-2 text-xs"
                                          onClick={() => clearFilters(column.id)}
                                        >
                                          Clear
                                        </Button>
                                      </div>
                                      <div className="space-y-2">
                                        {uniqueValues[column.id]?.map((value) => (
                                          <div key={value} className="flex items-center space-x-2">
                                            <Checkbox
                                              id={`${column.id}-${value}`}
                                              checked={filters[column.id]?.includes(value) || false}
                                              onCheckedChange={() => toggleFilter(column.id, value)}
                                            />
                                            <label
                                              htmlFor={`${column.id}-${value}`}
                                              className="text-sm flex-1 cursor-pointer truncate"
                                            >
                                              {value}
                                            </label>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="p-2 flex justify-between">
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="outline" size="sm" className="h-7">
                                            <ArrowUpDown className="mr-1 h-3 w-3" />
                                            Sort
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                          <DropdownMenuItem
                                            onClick={() => {
                                              setSortColumn(column.id)
                                              setSortDirection("asc")
                                            }}
                                          >
                                            <ArrowUp className="mr-2 h-3.5 w-3.5" />
                                            Sort A to Z
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={() => {
                                              setSortColumn(column.id)
                                              setSortDirection("desc")
                                            }}
                                          >
                                            <ArrowDown className="mr-2 h-3.5 w-3.5" />
                                            Sort Z to A
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                      <Button size="sm" className="h-7">
                                        Apply
                                      </Button>
                                    </div>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </DraggableTableHeader>
                        ))}
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processedData.length > 0 ? (
                        processedData.map((row, index) => (
                          <TableRow key={row.id || index}>
                            {columns.map((column) => (
                              <TableCell
                                key={`${row.id || index}-${column.id}`}
                                style={{
                                  width: `${columnWidths[column.id]}px`,
                                  maxWidth: `${columnWidths[column.id]}px`,
                                }}
                                className={column.type === "image" ? "text-center" : ""}
                              >
                                {renderCellContent(row[column.id], column.id, column.type)}
                              </TableCell>
                            ))}
                            <TableCell className="w-[100px]">
                              <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
                                <Link href={`/tables/${tableId}/edit/${row.id || index}`}>
                                  <Edit className="h-4 w-4" />
                                  <span className="sr-only">Edit</span>
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={columns.length + 1} className="h-24 text-center">
                            No data available. Click "Add Record" to add your first record.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </DndProvider>
            </div>
          ) : viewMode === "kanban" ? (
            <div className="border rounded-lg p-4 overflow-hidden bg-muted/10">
              {processedData.length > 0 ? (
                <KanbanBoard
                  items={processedData}
                  statusField={kanbanConfig.statusField}
                  statusConfig={kanbanConfig.statusConfig}
                  onItemMove={handleKanbanItemMove}
                  getItemUrl={getItemUrl}
                  titleField={kanbanConfig.titleField}
                  descriptionField={kanbanConfig.descriptionField}
                  dueDateField={kanbanConfig.dueDateField}
                  priorityField={kanbanConfig.priorityField}
                  assigneeField={kanbanConfig.assigneeField}
                  tagsField={kanbanConfig.tagsField}
                />
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No data available. Click "Add Record" to add your first record.
                </div>
              )}
            </div>
          ) : (
            <div className="border rounded-lg p-4 overflow-hidden bg-muted/10">
              {ganttData.length > 0 ? (
                <div className="h-[600px] overflow-auto">
                  <div className="min-w-full">
                    <h2 className="text-xl font-semibold mb-4">{tableDefinition.name} Timeline</h2>

                    {/* Simple Gantt Chart Implementation */}
                    <div className="relative">
                      {/* Timeline Header */}
                      <div className="flex border-b mb-2 pb-2">
                        <div className="w-1/4 font-medium">Item</div>
                        <div className="w-3/4 flex">
                          {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="flex-1 text-center text-sm">
                              {new Date(new Date().getFullYear(), i, 1).toLocaleString("default", { month: "short" })}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Gantt Items */}
                      {ganttData.map((item, index) => {
                        const startMonth = item.startDate.getMonth()
                        const endMonth = item.endDate.getMonth()
                        const duration = endMonth - startMonth + 1
                        const startOffset = (startMonth / 12) * 100
                        const widthPercentage = (duration / 12) * 100

                        return (
                          <div key={item.id} className="flex items-center mb-3 hover:bg-muted/20 p-1 rounded">
                            <div className="w-1/4 pr-4">
                              <div className="font-medium">{item.title}</div>
                              <div className="text-sm text-muted-foreground truncate">{item.description}</div>
                            </div>
                            <div className="w-3/4 relative h-8">
                              <div
                                className={`absolute h-6 rounded-md ${
                                  item.status === "completed"
                                    ? "bg-green-500/20 border-green-500"
                                    : item.status === "cancelled"
                                      ? "bg-red-500/20 border-red-500"
                                      : "bg-blue-500/20 border-blue-500"
                                } border flex items-center justify-center text-xs`}
                                style={{
                                  left: `${startOffset}%`,
                                  width: `${widthPercentage}%`,
                                  minWidth: "40px",
                                }}
                              >
                                {duration <= 2 ? item.title : ""}
                              </div>

                              {/* Milestones */}
                              {item.milestones?.map((milestone, i) => {
                                const milestoneMonth = milestone.date.getMonth()
                                const milestoneOffset = (milestoneMonth / 12) * 100

                                return (
                                  <div
                                    key={i}
                                    className="absolute w-4 h-4 bg-yellow-500 rounded-full -mt-1 transform -translate-x-1/2"
                                    style={{ left: `${milestoneOffset}%`, top: "50%" }}
                                    title={`${milestone.label}: ${milestone.date.toLocaleDateString()}`}
                                  />
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="text-center text-sm text-muted-foreground mt-4">
                      Note: This is a simplified Gantt view. Click on items to edit details.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No timeline data available. Add records with date information to see the Gantt chart.
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

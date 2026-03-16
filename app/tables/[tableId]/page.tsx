"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  FileEdit,
  LayoutGrid,
  LayoutList,
  GanttChartIcon,
  ArrowUp,
  ArrowDown,
  Filter,
  X,
  ArrowLeft,
} from "lucide-react"
import { DraggableTableHeader } from "@/components/draggable-table-header"
import { KanbanBoard } from "@/components/kanban-board"
import { GanttChart } from "@/components/gantt-chart"
import { getDynamicKanbanConfig } from "@/lib/kanban-utils"
import { generateSampleOrderGanttData, generateProductionOrderGanttData } from "@/lib/gantt-utils"
import { DataPersistence } from "@/lib/data-persistence"
import {
  useDebounce,
  createMemoizedFilter,
  createMemoizedSort,
  PerformanceMonitor,
  MemoryManager,
} from "@/lib/performance-utils"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"

export default function TablePage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const tableId = params.tableId as string

  const [records, setRecords] = useState([])
  const [columns, setColumns] = useState([])
  const [tableName, setTableName] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [recordsPerPage, setRecordsPerPage] = useState(10)
  const [sortColumn, setSortColumn] = useState("")
  const [sortDirection, setSortDirection] = useState("asc")
  const [viewMode, setViewMode] = useState<"table" | "kanban" | "gantt">("table")
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [filters, setFilters] = useState<Record<string, string[]>>({})
  const [filterMenuOpen, setFilterMenuOpen] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(true)

  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const recordsPerPageOptions = [10, 25, 50, 100, 500]

  // Load table data with caching
  useEffect(() => {
    const loadTableData = async () => {
      PerformanceMonitor.startMeasurement("loadTableData")
      setIsLoading(true)

      try {
        console.log("[v0] Loading table data for:", tableId)

        // Check cache first
        const cacheKey = `table_${tableId}`
        let tableData = MemoryManager.get(cacheKey)

        console.log("[v0] Cache data found:", !!tableData)

        if (!tableData) {
          console.log("[v0] Loading fresh data from DataPersistence")
          tableData = await DataPersistence.getTable(tableId)
          if (tableData) {
            // Cache for 5 minutes
            MemoryManager.set(cacheKey, tableData, 300000)
            console.log("[v0] Data cached successfully")
          }
        } else {
          console.log("[v0] Using cached data")
        }

        if (tableData) {
          console.log("[v0] Records loaded:", tableData.records?.length || 0)
          console.log("[v0] Table data structure:", {
            hasRecords: !!tableData.records,
            recordsLength: tableData.records?.length,
            recordsType: typeof tableData.records,
            firstRecord: tableData.records?.[0],
          })
          setRecords(tableData.records || [])
          setColumns(tableData.columns || [])
          setTableName(tableData.name || "Table")
        }
      } catch (error) {
        console.error("[v0] Error loading table data:", error)
      } finally {
        setIsLoading(false)
        PerformanceMonitor.endMeasurement("loadTableData")
      }
    }

    loadTableData()

    const handleTableDataChange = (event: CustomEvent) => {
      if (event.detail?.tableId === tableId) {
        console.log("[v0] Table data changed for this table, reloading")
        MemoryManager.clear(`table_${tableId}`)
        loadTableData()
      }
    }

    // Listen for custom table data change events only
    window.addEventListener("tableDataChanged", handleTableDataChange as EventListener)

    return () => {
      window.removeEventListener("tableDataChanged", handleTableDataChange as EventListener)
    }
  }, [tableId])

  // Handle column reordering
  const moveColumn = useCallback((dragIndex: number, hoverIndex: number) => {
    setColumns((prevColumns) => {
      const newColumns = [...prevColumns]
      const [draggedColumn] = newColumns.splice(dragIndex, 1)
      newColumns.splice(hoverIndex, 0, draggedColumn)
      return newColumns
    })
  }, [])

  // Handle column resize
  const handleColumnResize = useCallback((columnId: string, newWidth: number) => {
    setColumns((prevColumns) => prevColumns.map((col) => (col.id === columnId ? { ...col, width: newWidth } : col)))
  }, [])

  const uniqueValues = useMemo(() => {
    PerformanceMonitor.startMeasurement("calculateUniqueValues")

    const values: Record<string, string[]> = {}
    columns.forEach((column) => {
      const uniqueSet = new Set<string>()
      records.forEach((row) => {
        const value = row[column.id]
        if (Array.isArray(value)) {
          value.forEach((item) => item != null && uniqueSet.add(String(item)))
        } else if (value != null) {
          uniqueSet.add(String(value))
        }
      })
      values[column.id] = Array.from(uniqueSet).sort()
    })

    PerformanceMonitor.endMeasurement("calculateUniqueValues")
    return values
  }, [records, columns])

  // Filter functions
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
      Object.values(filters).reduce((count, values) => count + (values.length > 0 ? 1 : 0), 0) +
      (debouncedSearchTerm ? 1 : 0)
    )
  }, [filters, debouncedSearchTerm])

  const filteredRecords = createMemoizedFilter(
    records,
    (record) => {
      // Apply search filter
      if (debouncedSearchTerm.trim()) {
        const searchMatch = Object.values(record).some((value) => {
          if (value === null || value === undefined) return false
          return String(value).toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        })
        if (!searchMatch) return false
      }

      // Apply column filters
      for (const [columnId, values] of Object.entries(filters)) {
        if (values.length > 0) {
          const value = record[columnId]
          const matches = Array.isArray(value)
            ? value.some((item) => values.includes(String(item)))
            : values.includes(String(value))
          if (!matches) return false
        }
      }

      return true
    },
    [debouncedSearchTerm, filters],
  )

  const sortedRecords = createMemoizedSort(
    filteredRecords,
    (a, b) => {
      if (!sortColumn) return 0

      const aValue = a[sortColumn]
      const bValue = b[sortColumn]

      if (aValue === bValue) return 0
      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

      const comparison = String(aValue).localeCompare(String(bValue))
      return sortDirection === "asc" ? comparison : -comparison
    },
    [sortColumn, sortDirection],
  )

  const totalPages = Math.ceil(sortedRecords.length / recordsPerPage)

  // Paginate records
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * recordsPerPage
    const endIndex = startIndex + recordsPerPage
    return sortedRecords.slice(startIndex, endIndex)
  }, [sortedRecords, currentPage, recordsPerPage])

  // Handle sort
  const handleSort = useCallback(
    (column) => {
      if (sortColumn === column) {
        setSortDirection(sortDirection === "asc" ? "desc" : "asc")
      } else {
        setSortColumn(column)
        setSortDirection("asc")
      }
    },
    [sortColumn, sortDirection],
  )

  // Handle page change
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page)
  }, [])

  // Handle records per page change
  const handleRecordsPerPageChange = useCallback((value) => {
    setRecordsPerPage(Number(value))
    setCurrentPage(1)
  }, [])

  // Handle record deletion
  const handleDeleteRecord = useCallback(
    async (recordId) => {
      if (confirm("Are you sure you want to delete this record?")) {
        try {
          const updatedRecords = records.filter((record) => record.id !== recordId)
          await DataPersistence.updateTable(tableId, { records: updatedRecords })
          setRecords(updatedRecords)

          // Clear cache
          MemoryManager.clear()
        } catch (error) {
          console.error("Error deleting record:", error)
        }
      }
    },
    [records, tableId],
  )

  // Handle Kanban card update
  const handleKanbanCardUpdate = useCallback(
    async (cardId, columnId) => {
      try {
        const updatedRecords = records.map((record) => {
          if (record.id === cardId) {
            return { ...record, status: columnId }
          }
          return record
        })

        await DataPersistence.updateTable(tableId, { records: updatedRecords })
        setRecords(updatedRecords)

        // Clear cache
        MemoryManager.clear()
      } catch (error) {
        console.error("Error updating card status:", error)
      }
    },
    [records, tableId],
  )

  // Handle Gantt task click
  const handleGanttTaskClick = useCallback(
    (task) => {
      const record = records.find((r) => r.id === task.id)
      if (record) {
        setSelectedRecord(record)
        router.push(`/tables/${tableId}/edit/${record.id}`)
      }
    },
    [records, router, tableId],
  )

  // Check if Gantt view is applicable for this table
  const isGanttApplicable = useMemo(() => {
    return tableId.includes("sample") || tableId.includes("order") || tableId.includes("production")
  }, [tableId])

  // Generate Gantt data based on table type
  const ganttData = useMemo(() => {
    if (tableId.includes("sample")) {
      return generateSampleOrderGanttData(sortedRecords)
    } else if (tableId.includes("order") || tableId.includes("production")) {
      return generateProductionOrderGanttData(sortedRecords)
    }
    return []
  }, [sortedRecords, tableId])

  // Get Kanban configuration for this table
  const kanbanConfig = useMemo(() => {
    return getDynamicKanbanConfig(tableId, sortedRecords)
  }, [tableId, sortedRecords])

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading table data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" asChild className="mr-3">
            <Link href="/tables">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to Tables</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{tableName}</h1>
            <p className="text-muted-foreground">
              Showing {filteredRecords.length} of {records.length} records
              {getActiveFilterCount() > 0 && " (filtered)"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href={`/tables/${tableId}/add`}>
              <Plus className="mr-2 h-4 w-4" /> Add Record
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/tables/${tableId}/settings`}>
              <SlidersHorizontal className="mr-2 h-4 w-4" /> Settings
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-8 w-[250px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {getActiveFilterCount() > 0 && (
            <Button variant="outline" size="sm" onClick={clearAllFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear Filters ({getActiveFilterCount()})
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isGanttApplicable && (
            <Button
              variant={viewMode === "gantt" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("gantt")}
            >
              <GanttChartIcon className="mr-2 h-4 w-4" />
              Gantt
            </Button>
          )}
          <Button
            variant={viewMode === "kanban" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("kanban")}
          >
            <LayoutGrid className="mr-2 h-4 w-4" />
            Kanban
          </Button>
          <Button variant={viewMode === "table" ? "default" : "outline"} size="sm" onClick={() => setViewMode("table")}>
            <LayoutList className="mr-2 h-4 w-4" />
            Table
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
                  {columns.find((col) => col.id === columnId)?.label || columnId}:{" "}
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
          {debouncedSearchTerm && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Search: {debouncedSearchTerm}
              <Button variant="ghost" size="icon" className="h-4 w-4 p-0 ml-1" onClick={() => setSearchTerm("")}>
                <X className="h-3 w-3" />
                <span className="sr-only">Clear search</span>
              </Button>
            </Badge>
          )}
        </div>
      )}

      {viewMode === "table" && (
        <DndProvider backend={HTML5Backend}>
          <Card>
            <CardContent className="p-0">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((column, index) => (
                        <TableHead
                          key={column.id}
                          className="relative"
                          style={{
                            width: `${column.width || 150}px`,
                            minWidth: `${column.width || 150}px`,
                          }}
                        >
                          <DraggableTableHeader
                            id={column.id}
                            index={index}
                            moveColumn={moveColumn}
                            onResize={(newWidth) => handleColumnResize(column.id, newWidth)}
                            width={column.width || 150}
                            column={column}
                            sortColumn={sortColumn}
                            sortDirection={sortDirection}
                            onClick={() => handleSort(column.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <span>{column.label || column.id}</span>
                                {column.required && <span className="text-destructive ml-1">*</span>}
                                {sortColumn === column.id && (
                                  <span className="ml-2">
                                    {sortDirection === "asc" ? (
                                      <ArrowUp className="h-4 w-4" />
                                    ) : (
                                      <ArrowDown className="h-4 w-4" />
                                    )}
                                  </span>
                                )}
                              </div>
                              <DropdownMenu
                                open={filterMenuOpen[column.id]}
                                onOpenChange={(open) => setFilterMenuOpen((prev) => ({ ...prev, [column.id]: open }))}
                              >
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
                                  </div>
                                  <div className="p-2 max-h-[200px] overflow-y-auto">
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
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </DraggableTableHeader>
                        </TableHead>
                      ))}
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRecords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={columns.length + 1} className="h-24 text-center">
                          No records found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedRecords.map((record) => (
                        <TableRow 
                          key={record.id} 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => router.push(`/tables/${tableId}/edit/${record.id}`)}
                        >
                          {columns.map((column) => (
                            <TableCell key={`${record.id}-${column.id}`}>
                              {renderCellValue(record[column.id], column.type)}
                            </TableCell>
                          ))}
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/tables/${tableId}/edit/${record.id}`}>
                                    <FileEdit className="mr-2 h-4 w-4" />
                                    Edit
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteRecord(record.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Showing {paginatedRecords.length} of {filteredRecords.length} records
                </span>
                <Select value={String(recordsPerPage)} onValueChange={handleRecordsPerPageChange}>
                  <SelectTrigger className="w-[70px]">
                    <SelectValue placeholder={recordsPerPage} />
                  </SelectTrigger>
                  <SelectContent>
                    {recordsPerPageOptions.map((option) => (
                      <SelectItem key={option} value={String(option)}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">per page</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {Math.ceil(filteredRecords.length / recordsPerPage) || 1}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={
                    currentPage === Math.ceil(filteredRecords.length / recordsPerPage) || filteredRecords.length === 0
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        </DndProvider>
      )}

      {viewMode === "kanban" && (
        <KanbanBoard
          items={sortedRecords}
          statusField={kanbanConfig.statusField}
          statusConfig={kanbanConfig.statusConfig}
          titleField={kanbanConfig.titleField}
          descriptionField={kanbanConfig.descriptionField}
          dueDateField={kanbanConfig.dueDateField}
          priorityField={kanbanConfig.priorityField}
          assigneeField={kanbanConfig.assigneeField}
          tagsField={kanbanConfig.tagsField}
          onItemMove={handleKanbanCardUpdate}
          getItemUrl={(id: string) => `/tables/${tableId}/edit/${id}`}
        />
      )}

      {viewMode === "gantt" && isGanttApplicable && (
        <GanttChart
          tasks={ganttData}
          title={`${tableName} Timeline`}
          onTaskClick={handleGanttTaskClick}
          groupBy="assignee"
        />
      )}
    </div>
  )
}

// Helper function to render cell values based on type
function renderCellValue(value, type) {
  if (value === null || value === undefined) {
    return "-"
  }

  switch (type) {
    case "date":
      return new Date(value).toLocaleDateString()
    case "boolean":
      return value ? "Yes" : "No"
    case "status":
      return <Badge variant="outline">{value}</Badge>
    case "image":
      if (typeof value === "string" && value.trim()) {
        let images: string[]

        // Check if it's a JSON array of images
        if (value.startsWith("[")) {
          try {
            images = JSON.parse(value)
          } catch {
            images = [value]
          }
        } else if (value.startsWith("data:")) {
          // If it's a data URL, treat it as a single image
          images = [value]
        } else {
          // Otherwise, split by comma for multiple filenames
          images = value
            .split(",")
            .map((img) => img.trim())
            .filter(Boolean)
        }

        // Only show the first image in table list view
        const firstImage = images[0]
        if (!firstImage) return "-"
        
        const isDataUrl = firstImage.startsWith("data:")
        const imgSrc = isDataUrl ? firstImage : `/images/${firstImage}`
        const totalImages = images.length

        return (
          <div className="flex items-center gap-2">
            <div className="relative w-12 h-12 rounded overflow-hidden border bg-muted">
              <img
                src={imgSrc || "/placeholder.svg"}
                alt="Image 1"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none"
                  const parent = e.currentTarget.parentElement
                  if (parent && !parent.querySelector(".no-image-text")) {
                    const noImageDiv = document.createElement("div")
                    noImageDiv.className =
                      "no-image-text flex items-center justify-center w-full h-full text-xs text-muted-foreground"
                    noImageDiv.textContent = "No img"
                    parent.appendChild(noImageDiv)
                  }
                }}
              />
            </div>
            {totalImages > 1 && (
              <span className="text-xs text-muted-foreground">+{totalImages - 1}</span>
            )}
          </div>
        )
      }
      return "-"
    case "file":
      if (typeof value === "string" && value.trim()) {
        const files = value
          .split(",")
          .map((f) => f.trim())
          .filter(Boolean)
        return (
          <div className="flex flex-col gap-1">
            {files.map((file, index) => (
              <a
                key={index}
                href={`/files/${file}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <span className="truncate max-w-[150px]">{file}</span>
              </a>
            ))}
          </div>
        )
      }
      return "-"
    default:
      return String(value)
  }
}

"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ArrowUp, ArrowDown } from "lucide-react"
import { AccessibilityManager, KeyboardNavigation } from "@/lib/accessibility-utils"

interface AccessibleTableProps {
  data: any[]
  columns: Array<{
    id: string
    label: string
    sortable?: boolean
    render?: (value: any, row: any) => React.ReactNode
  }>
  caption?: string
  onSort?: (columnId: string, direction: "asc" | "desc") => void
  onRowSelect?: (row: any) => void
  selectedRows?: string[]
  className?: string
}

export function AccessibleTable({
  data,
  columns,
  caption,
  onSort,
  onRowSelect,
  selectedRows = [],
  className,
}: AccessibleTableProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(-1)
  const tableRef = useRef<HTMLTableElement>(null)
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([])

  const handleSort = useCallback(
    (columnId: string) => {
      const newDirection = sortColumn === columnId && sortDirection === "asc" ? "desc" : "asc"
      setSortColumn(columnId)
      setSortDirection(newDirection)
      onSort?.(columnId, newDirection)

      AccessibilityManager.announce(
        `Table sorted by ${columns.find((col) => col.id === columnId)?.label} in ${newDirection}ending order`,
      )
    },
    [sortColumn, sortDirection, onSort, columns],
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!tableRef.current) return

      const rows = rowRefs.current.filter(Boolean)

      KeyboardNavigation.handleArrowNavigation(e, rows, focusedRowIndex, (newIndex) => {
        setFocusedRowIndex(newIndex)
        if (rows[newIndex]) {
          rows[newIndex].focus()
        }
      })

      // Enter or Space to select row
      if ((e.key === "Enter" || e.key === " ") && focusedRowIndex >= 0) {
        e.preventDefault()
        const row = data[focusedRowIndex]
        if (row && onRowSelect) {
          onRowSelect(row)
          AccessibilityManager.announce(`Row ${focusedRowIndex + 1} selected`)
        }
      }
    },
    [focusedRowIndex, data, onRowSelect],
  )

  useEffect(() => {
    const table = tableRef.current
    if (table) {
      table.addEventListener("keydown", handleKeyDown)
      return () => table.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleKeyDown])

  return (
    <div className={className}>
      <Table
        ref={tableRef}
        role="table"
        aria-label={caption || "Data table"}
        aria-rowcount={data.length + 1}
        aria-colcount={columns.length}
      >
        {caption && <caption className="sr-only">{caption}</caption>}

        <TableHeader>
          <TableRow role="row" aria-rowindex={1}>
            {columns.map((column, index) => (
              <TableHead
                key={column.id}
                role="columnheader"
                aria-colindex={index + 1}
                aria-sort={
                  sortColumn === column.id
                    ? sortDirection === "asc"
                      ? "ascending"
                      : "descending"
                    : column.sortable
                      ? "none"
                      : undefined
                }
              >
                {column.sortable ? (
                  <Button
                    variant="ghost"
                    onClick={() => handleSort(column.id)}
                    className="h-auto p-0 font-medium hover:bg-transparent"
                    aria-label={`Sort by ${column.label}`}
                  >
                    <span>{column.label}</span>
                    {sortColumn === column.id && (
                      <span className="ml-2" aria-hidden="true">
                        {sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                      </span>
                    )}
                  </Button>
                ) : (
                  column.label
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.length === 0 ? (
            <TableRow role="row" aria-rowindex={2}>
              <TableCell colSpan={columns.length} className="h-24 text-center" role="cell" aria-colindex={1}>
                No data available
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, rowIndex) => (
              <TableRow
                key={row.id || rowIndex}
                ref={(el) => (rowRefs.current[rowIndex] = el)}
                role="row"
                aria-rowindex={rowIndex + 2}
                aria-selected={selectedRows.includes(row.id)}
                tabIndex={focusedRowIndex === rowIndex ? 0 : -1}
                className={`
                  ${selectedRows.includes(row.id) ? "bg-muted" : ""}
                  ${onRowSelect ? "cursor-pointer hover:bg-muted/50" : ""}
                  focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                `}
                onClick={() => onRowSelect?.(row)}
                onFocus={() => setFocusedRowIndex(rowIndex)}
              >
                {columns.map((column, colIndex) => (
                  <TableCell key={column.id} role="cell" aria-colindex={colIndex + 1}>
                    {column.render ? column.render(row[column.id], row) : row[column.id] || "-"}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

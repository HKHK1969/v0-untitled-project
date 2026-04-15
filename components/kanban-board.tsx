"use client"

import type React from "react"

import { useMemo } from "react"
import { DndProvider, useDrag, useDrop } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MoreHorizontal, Edit } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

// Types
interface KanbanItem {
  id: string
  title: string
  description?: string
  status: string
  dueDate?: Date | string
  priority?: "low" | "medium" | "high" | "critical"
  assignee?: string
  tags?: string[]
  [key: string]: any
}

interface KanbanColumn {
  id: string
  title: string
  items: KanbanItem[]
  color?: string
  limit?: number
}

interface KanbanBoardProps {
  items: KanbanItem[]
  statusField: string
  statusConfig: {
    [key: string]: {
      title: string
      color?: string
      limit?: number
    }
  }
  onItemMove: (itemId: string, newStatus: string) => void
  getItemUrl: (itemId: string) => string
  titleField: string
  descriptionField?: string
  dueDateField?: string
  priorityField?: string
  assigneeField?: string
  tagsField?: string
  imageField?: string
  extraFields?: string[]
  sortOrder?: "newest-top" | "oldest-bottom"
}

// Drag item type
const ITEM_TYPE = "KANBAN_ITEM"

// KanbanCard component
const KanbanCard = ({
  item,
  getItemUrl,
  onItemMove,
  titleField,
  descriptionField,
  dueDateField,
  priorityField,
  assigneeField,
  tagsField,
  imageField,
  extraFields,
}: {
  item: KanbanItem
  getItemUrl: (itemId: string) => string
  onItemMove: (itemId: string, newStatus: string) => void
  titleField: string
  descriptionField?: string
  dueDateField?: string
  priorityField?: string
  assigneeField?: string
  tagsField?: string
  imageField?: string
  extraFields?: string[]
}) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ITEM_TYPE,
    item: { id: item.id, status: item.status },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }))

  const priorityColors = {
    low: "bg-blue-100 text-blue-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-orange-100 text-orange-800",
    critical: "bg-red-100 text-red-800",
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      window.location.href = getItemUrl(item.id)
    }
  }

  return (
    <div
      ref={drag}
      className={cn("mb-2 cursor-grab", isDragging ? "opacity-50" : "opacity-100")}
      role="button"
      tabIndex={0}
      aria-label={`${item[titleField]} - ${item.status} status`}
      onKeyDown={handleKeyDown}
    >
      <Card className="shadow-sm hover:shadow transition-shadow">
        {/* Image display */}
        {imageField && item[imageField] && (
          <div className="w-full h-24 overflow-hidden rounded-t-lg">
            {(() => {
              const imgValue = item[imageField]
              let imgSrc = ""
              if (typeof imgValue === "string") {
                if (imgValue.startsWith("[")) {
                  try {
                    const parsed = JSON.parse(imgValue)
                    imgSrc = Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : ""
                  } catch {
                    imgSrc = imgValue
                  }
                } else {
                  imgSrc = imgValue
                }
              }
              return imgSrc ? (
                <img src={imgSrc} alt="" className="w-full h-full object-cover" />
              ) : null
            })()}
          </div>
        )}
        <CardHeader className="p-3 pb-0">
          <div className="flex justify-between items-start">
            <CardTitle className="text-sm font-medium line-clamp-2">{item[titleField]}</CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Actions for ${item[titleField]}`}>
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={getItemUrl(item.id)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {descriptionField && item[descriptionField] && (
            <CardDescription className="line-clamp-2 text-xs mt-1">{item[descriptionField]}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="p-3 pt-1">
          {dueDateField && item[dueDateField] && (
            <div className="flex items-center text-xs text-muted-foreground mb-1">
              <Calendar className="mr-1 h-3 w-3" aria-hidden="true" />
              <span
                aria-label={`Due date: ${
                  typeof item[dueDateField] === "string"
                    ? item[dueDateField]
                    : format(new Date(item[dueDateField]), "MMM d, yyyy")
                }`}
              >
                {typeof item[dueDateField] === "string"
                  ? item[dueDateField]
                  : format(new Date(item[dueDateField]), "MMM d, yyyy")}
              </span>
            </div>
          )}
          {assigneeField && item[assigneeField] && (
            <div
              className="text-xs text-muted-foreground mb-1 truncate"
              aria-label={`Assigned to ${item[assigneeField]}`}
            >
              Assigned to: {item[assigneeField]}
            </div>
          )}
          {/* Extra fields display */}
          {extraFields && extraFields.length > 0 && (
            <div className="space-y-1 mt-1">
              {extraFields.map((fieldName) => {
                const value = item[fieldName]
                if (!value) return null
                const displayValue = Array.isArray(value) ? value.join(", ") : String(value)
                return (
                  <div key={fieldName} className="text-xs text-muted-foreground truncate">
                    <span className="capitalize">{fieldName}:</span> {displayValue}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
        <CardFooter className="p-3 pt-0 flex flex-wrap gap-1">
          {priorityField && item[priorityField] && (
            <Badge
              variant="outline"
              className={cn("text-xs", priorityColors[item[priorityField] as keyof typeof priorityColors] || "")}
              aria-label={`Priority: ${item[priorityField]}`}
            >
              {item[priorityField]}
            </Badge>
          )}
          {tagsField &&
            item[tagsField] &&
            Array.isArray(item[tagsField]) &&
            item[tagsField].slice(0, 2).map((tag: string, index: number) => (
              <Badge key={index} variant="secondary" className="text-xs" aria-label={`Tag: ${tag}`}>
                {tag}
              </Badge>
            ))}
          {tagsField && item[tagsField] && Array.isArray(item[tagsField]) && item[tagsField].length > 2 && (
            <Badge variant="secondary" className="text-xs" aria-label={`${item[tagsField].length - 2} more tags`}>
              +{item[tagsField].length - 2}
            </Badge>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

// KanbanColumn component
const KanbanColumn = ({
  column,
  onItemMove,
  getItemUrl,
  titleField,
  descriptionField,
  dueDateField,
  priorityField,
  assigneeField,
  tagsField,
  imageField,
  extraFields,
}: {
  column: KanbanColumn
  onItemMove: (itemId: string, newStatus: string) => void
  getItemUrl: (itemId: string) => string
  titleField: string
  descriptionField?: string
  dueDateField?: string
  priorityField?: string
  assigneeField?: string
  tagsField?: string
  imageField?: string
  extraFields?: string[]
}) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ITEM_TYPE,
    drop: (item: { id: string }) => {
      onItemMove(item.id, column.id)
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }))

  const isOverLimit = column.limit ? column.items.length >= column.limit : false

  return (
    <div
      ref={drop}
      className={cn(
        "flex flex-col h-full min-h-[500px] w-[280px] bg-muted/30 rounded-lg p-2",
        isOver && !isOverLimit ? "ring-2 ring-primary/20" : "",
      )}
      role="region"
      aria-label={`${column.title} column with ${column.items.length} items${column.limit ? ` (limit: ${column.limit})` : ""}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <div className={cn("w-3 h-3 rounded-full mr-2", column.color || "bg-gray-400")} aria-hidden="true" />
          <h3 className="font-medium text-sm" id={`column-${column.id}-title`}>
            {column.title}
          </h3>
        </div>
        <Badge
          variant="outline"
          className="text-xs font-normal"
          aria-label={`${column.items.length} items${column.limit ? ` out of ${column.limit}` : ""}`}
        >
          {column.items.length}
          {column.limit ? `/${column.limit}` : ""}
        </Badge>
      </div>
      <div className="flex-1 overflow-y-auto" role="list" aria-labelledby={`column-${column.id}-title`}>
        {column.items.map((item) => (
          <div key={item.id} role="listitem">
            <KanbanCard
              item={item}
              getItemUrl={getItemUrl}
              onItemMove={onItemMove}
              titleField={titleField}
              descriptionField={descriptionField}
              dueDateField={dueDateField}
              priorityField={priorityField}
              assigneeField={assigneeField}
              tagsField={tagsField}
              imageField={imageField}
              extraFields={extraFields}
            />
          </div>
        ))}
      </div>
      {isOverLimit && (
        <div className="mt-2 text-xs text-muted-foreground text-center" role="alert" aria-live="polite">
          Column limit reached
        </div>
      )}
    </div>
  )
}

// Main KanbanBoard component
export function KanbanBoard({
  items,
  statusField,
  statusConfig,
  onItemMove,
  getItemUrl,
  titleField,
  descriptionField,
  dueDateField,
  priorityField,
  assigneeField,
  tagsField,
  imageField,
  extraFields,
  sortOrder = "newest-top",
}: KanbanBoardProps) {
  // Organize items into columns
  const columns = useMemo(() => {
    const cols: KanbanColumn[] = []

    // Create columns based on statusConfig
    Object.entries(statusConfig).forEach(([statusId, config]) => {
      let columnItems: KanbanItem[]
      
      if (statusId === "__unassigned__") {
        // Unassigned column gets items without a status value
        columnItems = items.filter((item) => {
          const value = item[statusField]
          return value === undefined || value === null || value === "" ||
                 (Array.isArray(value) && value.length === 0)
        })
      } else if (statusId === "__all__") {
        // All Items column gets everything
        columnItems = [...items]
      } else {
        // Normal column matching
        columnItems = items.filter((item) => {
          const value = item[statusField]
          // Handle array values (multi-value fields)
          if (Array.isArray(value)) {
            return value.includes(statusId)
          }
          return String(value) === statusId
        })
      }
      
      // Sort items based on sortOrder (by id which contains timestamp)
      const sortedItems = [...columnItems].sort((a, b) => {
        const aId = String(a.id)
        const bId = String(b.id)
        // Extract timestamp from id (format: timestamp-randomstring)
        const aTime = parseInt(aId.split("-")[0]) || 0
        const bTime = parseInt(bId.split("-")[0]) || 0
        
        if (sortOrder === "oldest-bottom") {
          // Newest first (oldest at bottom)
          return bTime - aTime
        }
        // Default: newest first
        return bTime - aTime
      })
      
      cols.push({
        id: statusId,
        title: config.title,
        color: config.color,
        limit: config.limit,
        items: sortedItems,
      })
    })

    return cols
  }, [items, statusField, statusConfig, sortOrder])

  return (
    <DndProvider backend={HTML5Backend}>
      <div
        className="flex gap-4 overflow-x-auto pb-4 pt-2 px-2 -mx-2"
        role="application"
        aria-label="Kanban board for managing items"
      >
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            onItemMove={onItemMove}
            getItemUrl={getItemUrl}
            titleField={titleField}
            descriptionField={descriptionField}
            dueDateField={dueDateField}
            priorityField={priorityField}
            assigneeField={assigneeField}
            tagsField={tagsField}
            imageField={imageField}
            extraFields={extraFields}
          />
        ))}
      </div>
    </DndProvider>
  )
}

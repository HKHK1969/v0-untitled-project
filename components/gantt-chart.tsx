"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Calendar } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface GanttTask {
  id: string
  name: string
  startDate: Date
  endDate: Date
  progress: number
  dependencies?: string[]
  type: string
  status: string
  assignee?: string
  color?: string
}

interface GanttChartProps {
  tasks: GanttTask[]
  title?: string
  onTaskClick?: (task: GanttTask) => void
  groupBy?: string
  allowEditing?: boolean
}

export function GanttChart({
  tasks,
  title = "Gantt Chart",
  onTaskClick,
  groupBy = "none",
  allowEditing = false,
}: GanttChartProps) {
  const [zoom, setZoom] = useState(1)
  const [scrollPosition, setScrollPosition] = useState(0)
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week")
  const [startDate, setStartDate] = useState<Date>(null)
  const [endDate, setEndDate] = useState<Date>(null)
  const [groupedTasks, setGroupedTasks] = useState<Record<string, GanttTask[]>>({})
  const [groups, setGroups] = useState<string[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  // Calculate the date range for all tasks
  useEffect(() => {
    if (tasks.length === 0) return

    // Find the earliest start date and latest end date
    const earliestStart = new Date(Math.min(...tasks.map((task) => task.startDate.getTime())))
    const latestEnd = new Date(Math.max(...tasks.map((task) => task.endDate.getTime())))

    // Add buffer days
    earliestStart.setDate(earliestStart.getDate() - 3)
    latestEnd.setDate(latestEnd.getDate() + 3)

    setStartDate(earliestStart)
    setEndDate(latestEnd)

    // Group tasks if needed
    if (groupBy !== "none") {
      const grouped: Record<string, GanttTask[]> = {}
      const groupNames: string[] = []

      tasks.forEach((task) => {
        const groupValue = task[groupBy] || "Unassigned"
        if (!grouped[groupValue]) {
          grouped[groupValue] = []
          groupNames.push(groupValue)
        }
        grouped[groupValue].push(task)
      })

      setGroupedTasks(grouped)
      setGroups(groupNames.sort())
    } else {
      setGroupedTasks({ "All Tasks": tasks })
      setGroups(["All Tasks"])
    }
  }, [tasks, groupBy])

  // Generate time units (days, weeks, or months) for the header
  const generateTimeUnits = () => {
    if (!startDate || !endDate) return []

    const units = []
    const currentDate = new Date(startDate)

    while (currentDate <= endDate) {
      let label = ""
      let width = 0

      if (viewMode === "day") {
        label = formatDate(currentDate, "MMM d")
        width = 60 * zoom // 60px per day
        units.push({ date: new Date(currentDate), label, width })
        currentDate.setDate(currentDate.getDate() + 1)
      } else if (viewMode === "week") {
        const weekStart = new Date(currentDate)
        const weekEnd = new Date(currentDate)
        weekEnd.setDate(weekEnd.getDate() + 6)

        if (weekEnd > endDate) {
          weekEnd.setTime(endDate.getTime())
        }

        label = `${formatDate(weekStart, "MMM d")} - ${formatDate(weekEnd, "MMM d")}`
        width = 7 * 60 * zoom // 7 days * 60px per day
        units.push({ date: new Date(currentDate), label, width })

        currentDate.setDate(currentDate.getDate() + 7)
      } else if (viewMode === "month") {
        label = formatDate(currentDate, "MMMM yyyy")

        const month = currentDate.getMonth()
        const year = currentDate.getFullYear()
        const lastDay = new Date(year, month + 1, 0).getDate()

        width = lastDay * 20 * zoom // days in month * 20px per day
        units.push({ date: new Date(currentDate), label, width })

        currentDate.setMonth(currentDate.getMonth() + 1)
      }
    }

    return units
  }

  const timeUnits = generateTimeUnits()
  const totalWidth = timeUnits.reduce((sum, unit) => sum + unit.width, 0)

  // Calculate position and width for a task bar
  const calculateTaskPosition = (task: GanttTask) => {
    if (!startDate || !endDate || timeUnits.length === 0) return { left: 0, width: 0 }

    const taskStart = new Date(task.startDate)
    const taskEnd = new Date(task.endDate)

    // Calculate days from start date
    const daysFromStart = Math.max(0, (taskStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const taskDuration = Math.max(1, (taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24) + 1)

    let left = 0
    if (viewMode === "day") {
      left = daysFromStart * 60 * zoom
    } else if (viewMode === "week") {
      left = daysFromStart * ((60 * zoom) / 7)
    } else if (viewMode === "month") {
      // This is an approximation and would need refinement for accurate month positioning
      left = daysFromStart * (20 * zoom)
    }

    let width = 0
    if (viewMode === "day") {
      width = taskDuration * 60 * zoom
    } else if (viewMode === "week") {
      width = taskDuration * ((60 * zoom) / 7)
    } else if (viewMode === "month") {
      width = taskDuration * (20 * zoom)
    }

    return { left, width }
  }

  // Handle scrolling
  const handleScroll = (direction: "left" | "right") => {
    if (!containerRef.current) return

    const scrollAmount = 300
    const newPosition =
      direction === "left"
        ? Math.max(0, scrollPosition - scrollAmount)
        : Math.min(totalWidth - containerRef.current.clientWidth, scrollPosition + scrollAmount)

    setScrollPosition(newPosition)
    containerRef.current.scrollLeft = newPosition
  }

  // Get color based on task type or status
  const getTaskColor = (task: GanttTask) => {
    if (task.color) return task.color

    // Default colors based on type
    switch (task.type.toLowerCase()) {
      case "proto":
      case "prototype":
        return "bg-blue-500"
      case "fit":
      case "fitting":
        return "bg-green-500"
      case "pp":
      case "pre-production":
        return "bg-purple-500"
      case "size set":
        return "bg-amber-500"
      case "color":
        return "bg-pink-500"
      case "marketing":
        return "bg-cyan-500"
      case "production":
        return "bg-indigo-500"
      case "shipping":
        return "bg-orange-500"
      default:
        return "bg-gray-500"
    }
  }

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "requested":
      case "draft":
        return "bg-gray-200 text-gray-800"
      case "in progress":
      case "confirmed":
        return "bg-blue-100 text-blue-800"
      case "shipped":
        return "bg-amber-100 text-amber-800"
      case "delivered":
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>{title}</CardTitle>
        <div className="flex items-center gap-2">
          <Select value={viewMode} onValueChange={(value) => setViewMode(value as "day" | "week" | "month")}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="View mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setZoom(Math.min(2, zoom + 0.1))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={() => handleScroll("left")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => handleScroll("right")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border-t">
          {/* Time units header */}
          <div className="flex border-b sticky top-0 bg-background z-10">
            <div className="w-[200px] flex-shrink-0 border-r p-2 font-medium">Task</div>
            <div className="flex overflow-hidden" style={{ width: `calc(100% - 200px)` }} ref={containerRef}>
              {timeUnits.map((unit, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 border-r text-center text-xs py-2 font-medium"
                  style={{ width: `${unit.width}px` }}
                >
                  {unit.label}
                </div>
              ))}
            </div>
          </div>

          {/* Gantt chart body */}
          <div className="max-h-[600px] overflow-y-auto">
            {groups.map((group) => (
              <div key={group} className="border-b last:border-b-0">
                {/* Group header if grouping is enabled */}
                {groupBy !== "none" && (
                  <div className="bg-muted/30 px-2 py-1 font-medium text-sm sticky left-0">{group}</div>
                )}

                {/* Tasks in this group */}
                {groupedTasks[group]?.map((task) => {
                  const { left, width } = calculateTaskPosition(task)
                  const taskColor = getTaskColor(task)

                  return (
                    <div key={task.id} className="flex border-b last:border-b-0">
                      <div className="w-[200px] flex-shrink-0 border-r p-2">
                        <div className="font-medium text-sm">{task.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={getStatusColor(task.status)}>
                            {task.status}
                          </Badge>
                          {task.assignee && <span className="text-xs text-muted-foreground">{task.assignee}</span>}
                        </div>
                      </div>
                      <div className="relative flex-grow h-16" style={{ minWidth: `${totalWidth}px` }}>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className={`absolute h-8 rounded-md ${taskColor} flex items-center justify-center text-white text-xs cursor-pointer`}
                                style={{
                                  left: `${left}px`,
                                  width: `${width}px`,
                                  top: "16px",
                                }}
                                onClick={() => onTaskClick && onTaskClick(task)}
                              >
                                <div className="truncate px-2">{task.progress}%</div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="space-y-1">
                                <p className="font-medium">{task.name}</p>
                                <div className="text-xs">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-3 w-3" />
                                    <span>
                                      {formatDate(task.startDate, "MMM d, yyyy")} -{" "}
                                      {formatDate(task.endDate, "MMM d, yyyy")}
                                    </span>
                                  </div>
                                  <div className="mt-1">Progress: {task.progress}%</div>
                                  {task.assignee && <div className="mt-1">Assignee: {task.assignee}</div>}
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

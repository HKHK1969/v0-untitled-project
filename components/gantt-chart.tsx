"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react"

interface Milestone {
  date: Date
  label: string
}

interface GanttTask {
  id: string
  title: string
  description?: string
  startDate: Date
  endDate: Date
  status: string
  milestones?: Milestone[]
  assignee?: string
  priority?: string
}

interface GanttChartProps {
  tasks: GanttTask[]
  title?: string
  onTaskClick?: (task: GanttTask) => void
  groupBy?: "status" | "assignee" | "priority" | null
}

export function GanttChart({ tasks, title = "Gantt Chart", onTaskClick, groupBy = null }: GanttChartProps) {
  const [zoom, setZoom] = useState(1)
  const [scrollPosition, setScrollPosition] = useState(0)
  const [viewStartDate, setViewStartDate] = useState<Date>(() => {
    // Find earliest start date among tasks or default to current month start
    if (tasks.length === 0) return new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    return tasks.reduce((earliest, task) => (task.startDate < earliest ? task.startDate : earliest), tasks[0].startDate)
  })

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Calculate the date range for the view
  const viewEndDate = new Date(viewStartDate)
  viewEndDate.setMonth(viewEndDate.getMonth() + Math.floor(12 / zoom))

  // Group tasks if groupBy is specified
  const groupedTasks = groupBy
    ? tasks.reduce((groups: Record<string, GanttTask[]>, task) => {
        const groupKey = task[groupBy] || "Unassigned"
        if (!groups[groupKey]) groups[groupKey] = []
        groups[groupKey].push(task)
        return groups
      }, {})
    : { "All Tasks": tasks }

  // Generate months for the timeline
  const months = []
  const currentDate = new Date(viewStartDate)
  while (currentDate <= viewEndDate) {
    months.push(new Date(currentDate))
    currentDate.setMonth(currentDate.getMonth() + 1)
  }

  // Handle zoom in/out
  const handleZoomIn = () => setZoom((prev) => Math.min(prev * 1.5, 3))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev / 1.5, 0.5))

  // Handle scroll
  const handleScroll = (direction: "left" | "right") => {
    const months = direction === "left" ? -3 : 3
    const newDate = new Date(viewStartDate)
    newDate.setMonth(newDate.getMonth() + months)
    setViewStartDate(newDate)
  }

  // Calculate position and width for a task bar
  const calculateTaskPosition = (task: GanttTask) => {
    const startDiff = task.startDate.getTime() - viewStartDate.getTime()
    const duration = task.endDate.getTime() - task.startDate.getTime()
    const totalViewDuration = viewEndDate.getTime() - viewStartDate.getTime()

    const left = Math.max(0, (startDiff / totalViewDuration) * 100)
    const width = Math.min(100 - left, (duration / totalViewDuration) * 100)

    return { left: `${left}%`, width: `${width}%` }
  }

  // Calculate position for a milestone
  const calculateMilestonePosition = (date: Date) => {
    const diff = date.getTime() - viewStartDate.getTime()
    const totalViewDuration = viewEndDate.getTime() - viewStartDate.getTime()
    return { left: `${(diff / totalViewDuration) * 100}%` }
  }

  // Get status color
  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      requested: "bg-blue-500/20 border-blue-500",
      in_progress: "bg-yellow-500/20 border-yellow-500",
      shipped: "bg-purple-500/20 border-purple-500",
      delivered: "bg-green-500/20 border-green-500",
      cancelled: "bg-red-500/20 border-red-500",
      completed: "bg-green-500/20 border-green-500",
      draft: "bg-gray-500/20 border-gray-500",
      submitted: "bg-blue-500/20 border-blue-500",
      confirmed: "bg-teal-500/20 border-teal-500",
      in_production: "bg-amber-500/20 border-amber-500",
    }

    return statusColors[status.toLowerCase()] || "bg-gray-500/20 border-gray-500"
  }

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>{title}</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => handleScroll("left")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => handleScroll("right")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto" ref={scrollContainerRef}>
          <div className="min-w-full" style={{ width: `${100 * zoom}%` }}>
            {/* Timeline Header */}
            <div className="flex border-b mb-4 pb-2 sticky top-0 bg-background z-10">
              <div className="w-1/4 font-medium">Task</div>
              <div className="w-3/4 flex">
                {months.map((month, i) => (
                  <div key={i} className="flex-1 text-center text-sm font-medium">
                    {month.toLocaleString("default", { month: "short", year: "numeric" })}
                  </div>
                ))}
              </div>
            </div>

            {/* Gantt Content */}
            {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
              <div key={groupName} className="mb-6">
                {groupBy && (
                  <div className="font-semibold text-sm mb-2 bg-muted/30 p-2 rounded">
                    {groupName} ({groupTasks.length})
                  </div>
                )}

                {groupTasks.map((task) => {
                  const { left, width } = calculateTaskPosition(task)

                  return (
                    <div
                      key={task.id}
                      className="flex items-center mb-3 hover:bg-muted/20 p-1 rounded cursor-pointer"
                      onClick={() => onTaskClick?.(task)}
                    >
                      <div className="w-1/4 pr-4">
                        <div className="font-medium">{task.title}</div>
                        <div className="text-xs text-muted-foreground truncate">{task.description}</div>
                        <div className="flex items-center gap-1 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {formatDate(task.startDate)} - {formatDate(task.endDate)}
                          </Badge>
                          {task.priority && (
                            <Badge variant="secondary" className="text-xs">
                              {task.priority}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="w-3/4 relative h-10">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className={`absolute h-8 rounded-md ${getStatusColor(task.status)} border flex items-center justify-center text-xs`}
                                style={{
                                  left,
                                  width,
                                  minWidth: "40px",
                                }}
                              >
                                {Number.parseFloat(width) > 10 ? task.title : ""}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div>
                                <div className="font-bold">{task.title}</div>
                                <div>{task.description}</div>
                                <div className="text-xs mt-1">
                                  {formatDate(task.startDate)} - {formatDate(task.endDate)}
                                </div>
                                {task.assignee && <div className="text-xs">Assignee: {task.assignee}</div>}
                                {task.status && <div className="text-xs">Status: {task.status}</div>}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        {/* Milestones */}
                        {task.milestones?.map((milestone, i) => {
                          const { left } = calculateMilestonePosition(milestone.date)

                          return (
                            <TooltipProvider key={i}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div
                                    className="absolute w-4 h-4 bg-yellow-500 rounded-full -mt-2 transform -translate-x-1/2 z-10"
                                    style={{ left, top: "50%" }}
                                  />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div>
                                    <div className="font-bold">{milestone.label}</div>
                                    <div className="text-xs">{formatDate(milestone.date)}</div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}

            {tasks.length === 0 && (
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                No timeline data available
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

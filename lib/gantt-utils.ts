export interface GanttTask {
  id: string
  name: string
  start: Date
  end: Date
  progress: number
  dependencies?: string[]
  type: "task" | "milestone" | "project"
  resource?: string
}

export interface GanttConfig {
  nameField: string
  startDateField: string
  endDateField: string
  progressField?: string
  statusField?: string
  resourceField?: string
  dependencyField?: string
}

// Generate sample order Gantt data
export function generateSampleOrderGanttData(records: any[]): GanttTask[] {
  return records.map((record) => ({
    id: record.id,
    name: record.sampleNumber || `Sample ${record.id}`,
    start: new Date(record.requestDate || Date.now()),
    end: new Date(record.dueDate || Date.now() + 7 * 24 * 60 * 60 * 1000),
    progress: getProgressFromStatus(record.status),
    type: "task" as const,
    resource: record.supplier || record.customer,
  }))
}

// Generate production order Gantt data
export function generateProductionOrderGanttData(records: any[]): GanttTask[] {
  return records.map((record) => ({
    id: record.id,
    name: record.productionOrderNumber || `Production ${record.id}`,
    start: new Date(record.startDate || Date.now()),
    end: new Date(record.endDate || record.expectedCompletionDate || Date.now() + 14 * 24 * 60 * 60 * 1000),
    progress: getProgressFromStatus(record.status),
    type: "task" as const,
    resource: record.supplier,
  }))
}

// Generate production milestones
export function generateProductionMilestones(records: any[]): GanttTask[] {
  const milestones: GanttTask[] = []

  records.forEach((record) => {
    if (record.startDate) {
      milestones.push({
        id: `${record.id}-start`,
        name: `Start: ${record.productionOrderNumber}`,
        start: new Date(record.startDate),
        end: new Date(record.startDate),
        progress: 100,
        type: "milestone" as const,
      })
    }

    if (record.expectedCompletionDate) {
      milestones.push({
        id: `${record.id}-end`,
        name: `Complete: ${record.productionOrderNumber}`,
        start: new Date(record.expectedCompletionDate),
        end: new Date(record.expectedCompletionDate),
        progress: record.status === "Completed" ? 100 : 0,
        type: "milestone" as const,
      })
    }
  })

  return milestones
}

// Get Gantt configuration for different table types
export function getGanttConfig(tableId: string): GanttConfig | null {
  switch (tableId) {
    case "samples":
      return {
        nameField: "sampleNumber",
        startDateField: "requestDate",
        endDateField: "dueDate",
        statusField: "status",
        resourceField: "supplier",
      }
    case "production-orders":
      return {
        nameField: "productionOrderNumber",
        startDateField: "startDate",
        endDateField: "expectedCompletionDate",
        progressField: "progress",
        statusField: "status",
        resourceField: "supplier",
      }
    case "orders":
      return {
        nameField: "orderNumber",
        startDateField: "orderDate",
        endDateField: "deliveryDate",
        statusField: "status",
        resourceField: "customer",
      }
    case "shipments":
      return {
        nameField: "shipmentNumber",
        startDateField: "shipDate",
        endDateField: "estimatedDelivery",
        statusField: "status",
        resourceField: "carrier",
      }
    default:
      return null
  }
}

// Helper function to convert status to progress percentage
function getProgressFromStatus(status: string): number {
  const statusMap: Record<string, number> = {
    Draft: 0,
    Requested: 10,
    Planned: 10,
    Confirmed: 20,
    "In Development": 30,
    "In Progress": 50,
    "Quality Check": 80,
    "Sent to Customer": 90,
    Completed: 100,
    Approved: 100,
    Delivered: 100,
    Shipped: 90,
    "In Transit": 70,
    "Out for Delivery": 90,
    Cancelled: 0,
    Rejected: 0,
    "On Hold": 25,
  }

  return statusMap[status] || 0
}

// Format date for Gantt display
export function formatGanttDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

// Calculate duration between two dates
export function calculateDuration(start: Date, end: Date): number {
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

// Get critical path tasks
export function getCriticalPath(tasks: GanttTask[]): string[] {
  // Simple critical path calculation - tasks with no slack time
  return tasks
    .filter((task) => {
      const duration = calculateDuration(task.start, task.end)
      return duration > 0 && task.progress < 100
    })
    .map((task) => task.id)
}

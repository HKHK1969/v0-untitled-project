import { formatDate } from "@/lib/utils"

// Types for Gantt chart
export interface GanttTask {
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

// Generate sample data for sample orders
export function generateSampleOrderGanttData(records: any[]) {
  if (!records || records.length === 0) return []

  return records.map((record) => {
    // Extract dates - handle both string and Date objects
    const startDate =
      record.startDate instanceof Date ? record.startDate : record.startDate ? new Date(record.startDate) : new Date()

    const endDate =
      record.endDate instanceof Date
        ? record.endDate
        : record.endDate
          ? new Date(record.endDate)
          : new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000) // Default to 14 days after start

    // Calculate progress
    const progress = record.progress || 0

    // Determine type and status
    const type = record.sampleType || "Sample"
    const status = record.status || "In Progress"

    // Get assignee if available
    const assignee = record.assignee || record.responsiblePerson || ""

    return {
      id: record.id,
      name: record.name || record.styleCode || `Sample ${record.id}`,
      startDate,
      endDate,
      progress,
      type,
      status,
      assignee,
    } as GanttTask
  })
}

// Generate sample data for production orders
export function generateProductionOrderGanttData(records: any[]) {
  if (!records || records.length === 0) return []

  return records.map((record) => {
    // Extract dates - handle both string and Date objects
    const startDate =
      record.startDate instanceof Date ? record.startDate : record.startDate ? new Date(record.startDate) : new Date()

    const endDate =
      record.endDate instanceof Date
        ? record.endDate
        : record.endDate
          ? new Date(record.endDate)
          : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000) // Default to 30 days after start

    // Calculate progress
    const progress = record.progress || 0

    // Determine type and status
    const type = "Production"
    const status = record.status || "In Progress"

    // Get assignee if available
    const assignee = record.assignee || record.responsiblePerson || ""

    return {
      id: record.id,
      name: record.name || record.poNumber || `Order ${record.id}`,
      startDate,
      endDate,
      progress,
      type,
      status,
      assignee,
    } as GanttTask
  })
}

// Generate milestones for a production order
export function generateProductionMilestones(order: any) {
  if (!order) return []

  const milestones: GanttTask[] = []
  const startDate = order.startDate instanceof Date ? order.startDate : new Date(order.startDate || Date.now())

  // Calculate milestone dates based on the order start date
  const fabricDate = new Date(startDate)
  fabricDate.setDate(startDate.getDate() + 7) // 7 days after start

  const cuttingDate = new Date(startDate)
  cuttingDate.setDate(startDate.getDate() + 14) // 14 days after start

  const sewingDate = new Date(startDate)
  sewingDate.setDate(startDate.getDate() + 21) // 21 days after start

  const qcDate = new Date(startDate)
  qcDate.setDate(startDate.getDate() + 28) // 28 days after start

  const shipDate = order.endDate instanceof Date ? order.endDate : new Date(order.endDate || Date.now())

  // Add milestones
  milestones.push({
    id: `${order.id}-fabric`,
    name: "Fabric Ready",
    startDate: fabricDate,
    endDate: new Date(fabricDate.getTime() + 24 * 60 * 60 * 1000), // 1 day duration
    progress: 100,
    type: "Milestone",
    status: "Completed",
    color: "bg-blue-500",
  })

  milestones.push({
    id: `${order.id}-cutting`,
    name: "Cutting Complete",
    startDate: cuttingDate,
    endDate: new Date(cuttingDate.getTime() + 24 * 60 * 60 * 1000), // 1 day duration
    progress: 100,
    type: "Milestone",
    status: "Completed",
    color: "bg-green-500",
  })

  milestones.push({
    id: `${order.id}-sewing`,
    name: "Sewing Complete",
    startDate: sewingDate,
    endDate: new Date(sewingDate.getTime() + 24 * 60 * 60 * 1000), // 1 day duration
    progress: 75,
    type: "Milestone",
    status: "In Progress",
    color: "bg-amber-500",
  })

  milestones.push({
    id: `${order.id}-qc`,
    name: "QC Complete",
    startDate: qcDate,
    endDate: new Date(qcDate.getTime() + 24 * 60 * 60 * 1000), // 1 day duration
    progress: 0,
    type: "Milestone",
    status: "Pending",
    color: "bg-gray-500",
  })

  milestones.push({
    id: `${order.id}-ship`,
    name: "Ship Date",
    startDate: shipDate,
    endDate: new Date(shipDate.getTime() + 24 * 60 * 60 * 1000), // 1 day duration
    progress: 0,
    type: "Milestone",
    status: "Pending",
    color: "bg-purple-500",
  })

  return milestones
}

// Format date for display
export function formatGanttDate(date: Date): string {
  return formatDate(date, "MMM d, yyyy")
}

// Types
interface GanttTask {
  id: string
  title: string
  description?: string
  startDate: Date
  endDate: Date
  status: string
  milestones?: Array<{ date: Date; label: string }>
  assignee?: string
  priority?: string
}

interface ProductionOrder {
  id: string
  poNumber: string
  supplier: string
  status: string
  assignee: string
  startDate: Date
  endDate: Date
  quantity: number
}

interface Milestone {
  id: string
  name: string
  date: Date
  progress: number
}

/**
 * Generate production milestones for a production order
 */
export function generateProductionMilestones(order: ProductionOrder): Milestone[] {
  const milestones: Milestone[] = []
  const startDate = order.startDate
  const endDate = order.endDate

  // Calculate milestone dates based on the order's start and end dates
  const fabricDate = new Date(startDate.getTime() + (endDate.getTime() - startDate.getTime()) * 0.2) // 20%
  const productionStartDate = new Date(startDate.getTime() + (endDate.getTime() - startDate.getTime()) * 0.4) // 40%
  const qcDate = new Date(startDate.getTime() + (endDate.getTime() - startDate.getTime()) * 0.7) // 70%
  const shippingDate = new Date(endDate.getTime()) // 100%

  milestones.push({
    id: `${order.id}-fabric`,
    name: "Fabric Ready",
    date: fabricDate,
    progress: 20,
  })

  milestones.push({
    id: `${order.id}-production`,
    name: "Production Start",
    date: productionStartDate,
    progress: 40,
  })

  milestones.push({
    id: `${order.id}-qc`,
    name: "QC",
    date: qcDate,
    progress: 70,
  })

  milestones.push({
    id: `${order.id}-shipping`,
    name: "Shipping",
    date: shippingDate,
    progress: 100,
  })

  return milestones
}

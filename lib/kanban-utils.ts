import type { TableRecord } from "./data-structure"

export interface KanbanColumn {
  id: string
  title: string
  color?: string
}

export interface KanbanCard {
  id: string
  title: string
  description?: string
  tags?: string[]
  status: string
  data: TableRecord
}

export interface KanbanConfig {
  statusField: string
  columns: KanbanColumn[]
  getCardTitle: (record: TableRecord) => string
  getCardDescription?: (record: TableRecord) => string
  getCardTags?: (record: TableRecord) => string[]
}

// Default Kanban configurations for different tables
export const defaultKanbanConfigs: Record<string, KanbanConfig> = {
  orders: {
    statusField: "status",
    columns: [
      { id: "Draft", title: "Draft", color: "bg-gray-100" },
      { id: "Confirmed", title: "Confirmed", color: "bg-blue-100" },
      { id: "In Production", title: "In Production", color: "bg-yellow-100" },
      { id: "Shipped", title: "Shipped", color: "bg-purple-100" },
      { id: "Delivered", title: "Delivered", color: "bg-green-100" },
      { id: "Cancelled", title: "Cancelled", color: "bg-red-100" },
    ],
    getCardTitle: (record) => record.orderNumber || "Untitled Order",
    getCardDescription: (record) => record.notes || "",
    getCardTags: (record) => [record.priority, record.currency].filter(Boolean),
  },
  "production-orders": {
    statusField: "status",
    columns: [
      { id: "Planned", title: "Planned", color: "bg-gray-100" },
      { id: "In Progress", title: "In Progress", color: "bg-blue-100" },
      { id: "Quality Check", title: "Quality Check", color: "bg-yellow-100" },
      { id: "Completed", title: "Completed", color: "bg-green-100" },
      { id: "On Hold", title: "On Hold", color: "bg-orange-100" },
      { id: "Cancelled", title: "Cancelled", color: "bg-red-100" },
    ],
    getCardTitle: (record) => record.productionOrderNumber || "Untitled Production Order",
    getCardDescription: (record) => `Quantity: ${record.quantity || 0}`,
    getCardTags: (record) => [record.qualityStatus].filter(Boolean),
  },
  samples: {
    statusField: "status",
    columns: [
      { id: "Requested", title: "Requested", color: "bg-gray-100" },
      { id: "In Development", title: "In Development", color: "bg-blue-100" },
      { id: "Sent to Customer", title: "Sent to Customer", color: "bg-purple-100" },
      { id: "Approved", title: "Approved", color: "bg-green-100" },
      { id: "Rejected", title: "Rejected", color: "bg-red-100" },
      { id: "Revision Required", title: "Revision Required", color: "bg-yellow-100" },
    ],
    getCardTitle: (record) => record.sampleNumber || "Untitled Sample",
    getCardDescription: (record) => record.feedback || "",
    getCardTags: (record) => [record.approvalStatus, `Rev ${record.revisionNumber || 1}`].filter(Boolean),
  },
  shipments: {
    statusField: "status",
    columns: [
      { id: "Preparing", title: "Preparing", color: "bg-gray-100" },
      { id: "Shipped", title: "Shipped", color: "bg-blue-100" },
      { id: "In Transit", title: "In Transit", color: "bg-yellow-100" },
      { id: "Out for Delivery", title: "Out for Delivery", color: "bg-purple-100" },
      { id: "Delivered", title: "Delivered", color: "bg-green-100" },
      { id: "Exception", title: "Exception", color: "bg-red-100" },
    ],
    getCardTitle: (record) => record.shipmentNumber || "Untitled Shipment",
    getCardDescription: (record) => record.trackingNumber || "",
    getCardTags: (record) => [record.carrier].filter(Boolean),
  },
}

// Dynamic Kanban configuration for customers (one column per customer)
export function getDynamicKanbanConfig(tableId: string, records: TableRecord[]): KanbanConfig | null {
  if (tableId === "customers") {
    const columns = records.map((record) => ({
      id: record.companyName || record.id,
      title: record.companyName || "Unnamed Customer",
      color: "bg-blue-50",
    }))

    return {
      statusField: "companyName",
      columns,
      getCardTitle: (record) => record.companyName || "Unnamed Customer",
      getCardDescription: (record) => record.address || record.email || "",
      getCardTags: (record) => (Array.isArray(record.brands) ? record.brands : []),
    }
  }

  return null
}

export function getKanbanConfig(tableId: string, records: TableRecord[] = []): KanbanConfig | null {
  // First try dynamic configuration
  const dynamicConfig = getDynamicKanbanConfig(tableId, records)
  if (dynamicConfig) {
    return dynamicConfig
  }

  // Fall back to default configurations
  return defaultKanbanConfigs[tableId] || null
}

export function organizeRecordsIntoColumns(records: TableRecord[], config: KanbanConfig): Record<string, KanbanCard[]> {
  const columns: Record<string, KanbanCard[]> = {}

  // Initialize all columns
  config.columns.forEach((column) => {
    columns[column.id] = []
  })

  // Organize records into columns
  records.forEach((record) => {
    const status = record[config.statusField] || "Unknown"
    const card: KanbanCard = {
      id: record.id,
      title: config.getCardTitle(record),
      description: config.getCardDescription?.(record),
      tags: config.getCardTags?.(record),
      status,
      data: record,
    }

    if (columns[status]) {
      columns[status].push(card)
    } else {
      // If status doesn't match any column, add to first column or create Unknown column
      if (!columns["Unknown"]) {
        columns["Unknown"] = []
      }
      columns["Unknown"].push(card)
    }
  })

  return columns
}

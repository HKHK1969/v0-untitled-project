// Kanban view configurations for different table types
export const KANBAN_CONFIGS = {
  customers: {
    statusField: "companyName", // Group by company name
    statusConfig: {}, // Will be dynamically populated
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

// Get status options for a specific table
export function getStatusOptions(tableId: string): { value: string; label: string }[] {
  const config = KANBAN_CONFIGS[tableId] || KANBAN_CONFIGS.default

  return Object.entries(config.statusConfig).map(([value, { title }]) => ({
    value,
    label: title,
  }))
}

// Get the default status for a table
export function getDefaultStatus(tableId: string): string {
  const config = KANBAN_CONFIGS[tableId] || KANBAN_CONFIGS.default
  return Object.keys(config.statusConfig)[0] || "new"
}

// Get the Kanban configuration for a table
export function getTableConfig(tableId: string) {
  return KANBAN_CONFIGS[tableId] || KANBAN_CONFIGS.default
}

export function getKanbanConfig(tableId: string) {
  return KANBAN_CONFIGS[tableId] || KANBAN_CONFIGS.default
}

// Dynamic configuration generator for customers
export function getDynamicKanbanConfig(tableId: string, records: any[]) {
  const baseConfig = KANBAN_CONFIGS[tableId] || KANBAN_CONFIGS.default

  if (tableId === "customers") {
    // Create a column for each customer
    const statusConfig = {}
    const colors = ["bg-blue-400", "bg-green-400", "bg-purple-400", "bg-yellow-400", "bg-pink-400", "bg-indigo-400"]

    records.forEach((record, index) => {
      const companyName = record.companyName
      if (companyName) {
        statusConfig[companyName] = {
          title: companyName,
          color: colors[index % colors.length],
        }
      }
    })

    return {
      ...baseConfig,
      statusConfig,
    }
  }

  return baseConfig
}

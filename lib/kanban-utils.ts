// Kanban view configurations for different table types
export const KANBAN_CONFIGS: Record<string, any> = {
  customers: {
    statusField: "location", // Group by location
    statusConfig: {}, // Will be dynamically populated
    titleField: "companyName",
    descriptionField: "address",
    tagsField: "brands",
  },
  suppliers: {
    statusField: "location", // Group by location
    statusConfig: {}, // Will be dynamically populated
    titleField: "companyName",
    descriptionField: "address",
    tagsField: "productCategories",
  },
  styles: {
    statusField: "brand", // Group by brand
    statusConfig: {}, // Will be dynamically populated
    titleField: "styleCode",
    descriptionField: "styleDescription",
  },
  sampleOrders: {
    statusField: "sampleType", // Group by sample type
    statusConfig: {}, // Will be dynamically populated
    titleField: "styleCode",
    descriptionField: "notes",
    dueDateField: "exFactoryRequested",
  },
  productionOrders: {
    statusField: "orderType", // Group by order type
    statusConfig: {}, // Will be dynamically populated
    titleField: "styleCode",
    descriptionField: "notes",
    dueDateField: "exFactoryRequested",
  },
  customerPOs: {
    statusField: "brand", // Group by brand
    statusConfig: {}, // Will be dynamically populated
    titleField: "poNumber",
    descriptionField: "style",
    dueDateField: "exFactoryDate",
  },
  tasks: {
    statusField: "urgency", // Group by urgency
    statusConfig: {}, // Will be dynamically populated
    titleField: "customer",
    descriptionField: "notes",
    dueDateField: "date",
    assigneeField: "assignedTo",
  },
  // Default configuration for other tables
  default: {
    statusField: "status",
    statusConfig: {},
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

// Dynamic configuration generator that builds columns from actual data
export function getDynamicKanbanConfig(tableId: string, records: any[]) {
  const baseConfig = KANBAN_CONFIGS[tableId] || KANBAN_CONFIGS.default
  const statusField = baseConfig.statusField
  
  // Colors to cycle through for dynamic columns
  const colors = [
    "bg-blue-400", "bg-green-400", "bg-purple-400", "bg-yellow-400", 
    "bg-pink-400", "bg-indigo-400", "bg-teal-400", "bg-orange-400",
    "bg-cyan-400", "bg-rose-400", "bg-emerald-400", "bg-violet-400"
  ]

  // Collect unique values from the status field
  const uniqueValues = new Set<string>()
  
  records.forEach((record) => {
    const value = record[statusField]
    if (value !== undefined && value !== null && value !== "") {
      // Handle arrays (for multi-value fields)
      if (Array.isArray(value)) {
        value.forEach(v => {
          if (v) uniqueValues.add(String(v))
        })
      } else {
        uniqueValues.add(String(value))
      }
    }
  })

  // Also add an "Unassigned" column for items without a value
  const hasUnassigned = records.some(record => {
    const value = record[statusField]
    return value === undefined || value === null || value === "" || 
           (Array.isArray(value) && value.length === 0)
  })

  // Build statusConfig dynamically
  const statusConfig: Record<string, { title: string; color: string }> = {}
  
  // Add columns for actual values
  const sortedValues = Array.from(uniqueValues).sort()
  sortedValues.forEach((value, index) => {
    statusConfig[value] = {
      title: value,
      color: colors[index % colors.length],
    }
  })

  // Add Unassigned column if needed
  if (hasUnassigned) {
    statusConfig["__unassigned__"] = {
      title: "Unassigned",
      color: "bg-gray-400",
    }
  }

  // If no columns were created, add a default "All" column
  if (Object.keys(statusConfig).length === 0) {
    statusConfig["__all__"] = {
      title: "All Items",
      color: "bg-blue-400",
    }
  }

  return {
    ...baseConfig,
    statusConfig,
  }
}

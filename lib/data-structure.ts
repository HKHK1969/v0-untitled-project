export interface TableField {
  id: string
  name: string
  type:
    | "text"
    | "number"
    | "date"
    | "boolean"
    | "select"
    | "multiselect"
    | "currency"
    | "email"
    | "phone"
    | "url"
    | "textarea"
    | "file"
    | "image"
    | "relationship"
  required?: boolean
  options?: string[]
  defaultValue?: any
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
  relationshipConfig?: {
    targetTable: string
    displayField: string
    multiple?: boolean
  }
}

export interface TableSchema {
  id: string
  name: string
  description?: string
  fields: TableField[]
  createdAt: string
  updatedAt: string
}

export interface TableRecord {
  id: string
  [key: string]: any
  createdAt: string
  updatedAt: string
}

// Predefined table schemas
export const predefinedTables: TableSchema[] = [
  {
    id: "customers",
    name: "Customers",
    description: "Customer information and contact details",
    fields: [
      { id: "companyName", name: "Company Name", type: "text", required: true },
      { id: "contactPerson", name: "Contact Person", type: "text", required: true },
      { id: "email", name: "Email", type: "email", required: true },
      { id: "phone", name: "Phone", type: "phone" },
      { id: "address", name: "Address", type: "textarea" },
      { id: "country", name: "Country", type: "text" },
      { id: "currency", name: "Currency", type: "select", options: ["USD", "EUR", "GBP"], defaultValue: "USD" },
      {
        id: "paymentTerms",
        name: "Payment Terms",
        type: "select",
        options: ["Net 30", "Net 60", "Net 90", "30% Upfront / 70% Before Shipment"],
        defaultValue: "Net 30",
      },
      {
        id: "brands",
        name: "Brands",
        type: "multiselect",
        options: ["Nike", "Adidas", "Puma", "Under Armour", "New Balance", "Reebok"],
      },
      { id: "customerSince", name: "Customer Since", type: "date" },
      { id: "isActive", name: "Active", type: "boolean", defaultValue: true },
      {
        id: "status",
        name: "Status",
        type: "select",
        options: ["Active", "Inactive", "Pending"],
        defaultValue: "Active",
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "suppliers",
    name: "Suppliers",
    description: "Supplier information and capabilities",
    fields: [
      { id: "companyName", name: "Company Name", type: "text", required: true },
      { id: "contactPerson", name: "Contact Person", type: "text", required: true },
      { id: "email", name: "Email", type: "email", required: true },
      { id: "phone", name: "Phone", type: "phone" },
      { id: "address", name: "Address", type: "textarea" },
      { id: "country", name: "Country", type: "text" },
      {
        id: "specialization",
        name: "Specialization",
        type: "multiselect",
        options: ["Cut & Sew", "Knitting", "Dyeing", "Printing", "Embroidery", "Packaging"],
      },
      { id: "minimumOrder", name: "Minimum Order Quantity", type: "number" },
      { id: "leadTime", name: "Lead Time (days)", type: "number" },
      { id: "qualityRating", name: "Quality Rating", type: "select", options: ["A", "B", "C", "D"] },
      { id: "isApproved", name: "Approved", type: "boolean", defaultValue: false },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "products",
    name: "Products",
    description: "Product catalog and specifications",
    fields: [
      { id: "productName", name: "Product Name", type: "text", required: true },
      { id: "sku", name: "SKU", type: "text", required: true },
      {
        id: "category",
        name: "Category",
        type: "select",
        options: ["T-Shirts", "Hoodies", "Pants", "Shorts", "Jackets", "Accessories"],
      },
      {
        id: "brand",
        name: "Brand",
        type: "select",
        options: ["Nike", "Adidas", "Puma", "Under Armour", "New Balance", "Reebok"],
      },
      { id: "description", name: "Description", type: "textarea" },
      {
        id: "material",
        name: "Material",
        type: "multiselect",
        options: ["Cotton", "Polyester", "Nylon", "Spandex", "Wool", "Bamboo"],
      },
      {
        id: "colors",
        name: "Available Colors",
        type: "multiselect",
        options: ["Black", "White", "Navy", "Gray", "Red", "Blue", "Green"],
      },
      { id: "sizes", name: "Available Sizes", type: "multiselect", options: ["XS", "S", "M", "L", "XL", "XXL"] },
      { id: "unitPrice", name: "Unit Price", type: "currency" },
      { id: "isActive", name: "Active", type: "boolean", defaultValue: true },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "orders",
    name: "Orders",
    description: "Customer orders and order management",
    fields: [
      { id: "orderNumber", name: "Order Number", type: "text", required: true },
      {
        id: "customer",
        name: "Customer",
        type: "relationship",
        relationshipConfig: { targetTable: "customers", displayField: "companyName" },
        required: true,
      },
      { id: "orderDate", name: "Order Date", type: "date", required: true },
      { id: "deliveryDate", name: "Delivery Date", type: "date" },
      {
        id: "status",
        name: "Status",
        type: "select",
        options: ["Draft", "Confirmed", "In Production", "Shipped", "Delivered", "Cancelled"],
        defaultValue: "Draft",
      },
      { id: "totalAmount", name: "Total Amount", type: "currency" },
      { id: "currency", name: "Currency", type: "select", options: ["USD", "EUR", "GBP"], defaultValue: "USD" },
      { id: "notes", name: "Notes", type: "textarea" },
      {
        id: "priority",
        name: "Priority",
        type: "select",
        options: ["Low", "Medium", "High", "Urgent"],
        defaultValue: "Medium",
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "production-orders",
    name: "Production Orders",
    description: "Manufacturing orders and production tracking",
    fields: [
      { id: "productionOrderNumber", name: "Production Order Number", type: "text", required: true },
      {
        id: "customerOrder",
        name: "Customer Order",
        type: "relationship",
        relationshipConfig: { targetTable: "orders", displayField: "orderNumber" },
        required: true,
      },
      {
        id: "product",
        name: "Product",
        type: "relationship",
        relationshipConfig: { targetTable: "products", displayField: "productName" },
        required: true,
      },
      {
        id: "supplier",
        name: "Supplier",
        type: "relationship",
        relationshipConfig: { targetTable: "suppliers", displayField: "companyName" },
        required: true,
      },
      { id: "quantity", name: "Quantity", type: "number", required: true },
      { id: "startDate", name: "Start Date", type: "date" },
      { id: "expectedCompletionDate", name: "Expected Completion Date", type: "date" },
      { id: "actualCompletionDate", name: "Actual Completion Date", type: "date" },
      {
        id: "status",
        name: "Status",
        type: "select",
        options: ["Planned", "In Progress", "Quality Check", "Completed", "On Hold", "Cancelled"],
        defaultValue: "Planned",
      },
      {
        id: "qualityStatus",
        name: "Quality Status",
        type: "select",
        options: ["Pending", "Passed", "Failed", "Rework Required"],
      },
      { id: "notes", name: "Notes", type: "textarea" },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "samples",
    name: "Samples",
    description: "Sample development and approval tracking",
    fields: [
      { id: "sampleNumber", name: "Sample Number", type: "text", required: true },
      {
        id: "product",
        name: "Product",
        type: "relationship",
        relationshipConfig: { targetTable: "products", displayField: "productName" },
        required: true,
      },
      {
        id: "customer",
        name: "Customer",
        type: "relationship",
        relationshipConfig: { targetTable: "customers", displayField: "companyName" },
        required: true,
      },
      {
        id: "supplier",
        name: "Supplier",
        type: "relationship",
        relationshipConfig: { targetTable: "suppliers", displayField: "companyName" },
        required: true,
      },
      { id: "requestDate", name: "Request Date", type: "date", required: true },
      { id: "expectedDeliveryDate", name: "Expected Delivery Date", type: "date" },
      { id: "actualDeliveryDate", name: "Actual Delivery Date", type: "date" },
      {
        id: "status",
        name: "Status",
        type: "select",
        options: ["Requested", "In Development", "Sent to Customer", "Approved", "Rejected", "Revision Required"],
        defaultValue: "Requested",
      },
      {
        id: "approvalStatus",
        name: "Approval Status",
        type: "select",
        options: ["Pending", "Approved", "Rejected", "Conditional"],
      },
      { id: "feedback", name: "Customer Feedback", type: "textarea" },
      { id: "revisionNumber", name: "Revision Number", type: "number", defaultValue: 1 },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "shipments",
    name: "Shipments",
    description: "Shipping and logistics tracking",
    fields: [
      { id: "shipmentNumber", name: "Shipment Number", type: "text", required: true },
      {
        id: "customerOrder",
        name: "Customer Order",
        type: "relationship",
        relationshipConfig: { targetTable: "orders", displayField: "orderNumber" },
        required: true,
      },
      { id: "shipmentDate", name: "Shipment Date", type: "date" },
      { id: "expectedDeliveryDate", name: "Expected Delivery Date", type: "date" },
      { id: "actualDeliveryDate", name: "Actual Delivery Date", type: "date" },
      {
        id: "carrier",
        name: "Carrier",
        type: "select",
        options: ["DHL", "FedEx", "UPS", "Maersk", "COSCO", "Local Courier"],
      },
      { id: "trackingNumber", name: "Tracking Number", type: "text" },
      {
        id: "status",
        name: "Status",
        type: "select",
        options: ["Preparing", "Shipped", "In Transit", "Out for Delivery", "Delivered", "Exception"],
        defaultValue: "Preparing",
      },
      { id: "shippingCost", name: "Shipping Cost", type: "currency" },
      { id: "weight", name: "Weight (kg)", type: "number" },
      { id: "dimensions", name: "Dimensions (L×W×H cm)", type: "text" },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export function getFieldDisplayValue(field: TableField, value: any, allRecords?: Record<string, any[]>): string {
  if (value === null || value === undefined) return ""

  switch (field.type) {
    case "boolean":
      return value ? "Yes" : "No"
    case "date":
      return value ? new Date(value).toLocaleDateString() : ""
    case "currency":
      return value ? `$${Number(value).toFixed(2)}` : ""
    case "multiselect":
      return Array.isArray(value) ? value.join(", ") : ""
    case "relationship":
      if (field.relationshipConfig && allRecords) {
        const targetRecords = allRecords[field.relationshipConfig.targetTable] || []
        if (Array.isArray(value)) {
          return value
            .map((id) => {
              const record = targetRecords.find((r) => r.id === id)
              return record ? record[field.relationshipConfig!.displayField] : id
            })
            .join(", ")
        } else {
          const record = targetRecords.find((r) => r.id === value)
          return record ? record[field.relationshipConfig.displayField] : value
        }
      }
      return value
    default:
      return String(value)
  }
}

// Export tables as an alias for predefinedTables to maintain compatibility
export const tables = predefinedTables

// Get field options for a specific field
export function getFieldOptions(tableId: string, fieldId: string): string[] {
  const table = predefinedTables.find((t) => t.id === tableId)
  if (!table) return []
  
  const field = table.fields.find((f) => f.id === fieldId)
  return field?.options || []
}

// Get table by ID
export function getTableById(tableId: string): TableSchema | undefined {
  return predefinedTables.find((t) => t.id === tableId)
}

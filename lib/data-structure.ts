/**
 * Data Structure Definition
 *
 * Defines the schema for all tables in the application with support for static and dynamic data loading.
 */

import { memoize } from "lodash" // For memoization (optional, can be removed if not desired)
import { commonCurrencies } from "./currency-utils"

// Constants (Configurable for flexibility)
const FIELD_TYPES = [
  "text",
  "longtext",
  "number",
  "date",
  "email",
  "phone",
  "dropdown",
  "image",
  "file",
  "boolean",
  "currency",
  "formula",
] as const

// Type definitions
export type FieldType = (typeof FIELD_TYPES)[number]

type FieldValue = string | number | boolean | Date | string[] | null | undefined

export interface Field {
  id: string
  label: string
  type: FieldType
  required: boolean
  unique?: boolean
  options?: string[] | (() => Promise<string[]>) // Support for static or dynamic options
  maxLength?: number
  defaultValue?: FieldValue
  formula?: string // Only for formula type
  linkedTable?: string // Only for dropdown with relations
  linkedField?: string // Only for dropdown with relations
  notes?: string
  disabled?: boolean // Option to disable field
}

export interface TableDefinition {
  id: string
  name: string
  description: string
  fields: Field[]
}

const fetchSupplierCategories = async (): Promise<string[]> => {
  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), 5000),
    )

    // Example: Fetch from a hypothetical supplier API
    const fetchPromise = fetch("https://api.example.com/supplier-categories")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        return response.json()
      })
      .then((data) => data.categories || [])

    return await Promise.race([fetchPromise, timeoutPromise])
  } catch (error) {
    console.error("Error fetching supplier categories:", error)
    // Log to monitoring service if available
    // logErrorToMonitoring(error, "supplier_categories_fetch_failed");
    return [] // Fallback to empty array
  }
}

// Validation utility (Ensures field consistency)
const validateField = (field: Field): Field => {
  if (!FIELD_TYPES.includes(field.type)) {
    console.warn(`Invalid field type '${field.type}' for field '${field.id}'`)
    return { ...field, type: "text" as FieldType }
  }
  if (field.type !== "dropdown" && field.options) {
    console.warn(`Field '${field.id}' has options but is not a dropdown`)
    delete field.options
  }
  if (field.type !== "formula" && field.formula) {
    console.warn(`Field '${field.id}' has formula but is not a formula type`)
    delete field.formula
  }
  if (field.type !== "dropdown" && (field.linkedTable || field.linkedField)) {
    console.warn(`Field '${field.id}' has linkedTable/linkedField but is not a dropdown`)
    delete field.linkedTable
    delete field.linkedField
  }
  return field
}

// Unique identifier validation and enforcement
export const validateUniqueField = (tableId: string, fieldId: string, value: string, recordId?: string): boolean => {
  if (typeof window === "undefined") return true

  try {
    const dataKey = `table_${tableId}_data`
    const savedData = localStorage.getItem(dataKey)
    if (!savedData) return true

    const data = JSON.parse(savedData) as any[]
    const existingRecord = data.find((record: any) => record[fieldId] === value && record.id !== recordId)

    return !existingRecord
  } catch (error) {
    console.error(`Error validating unique field ${tableId}.${fieldId}:`, error)
    return true
  }
}

// Table definitions with support for dynamic data
const rawTables: TableDefinition[] = [
  {
    id: "customers",
    name: "Customers",
    description: "Customer information and contacts",
    fields: [
      { id: "companyName", label: "Company Name", type: "text", required: true, notes: "Alphanumeric" },
      {
        id: "companyCode",
        label: "Company Code",
        type: "text",
        required: true,
        unique: true,
        maxLength: 5,
        notes: "Alphanumeric (max 5 digits), Unique Code",
      },
      { id: "brands", label: "Brand/s", type: "text", required: false, notes: "Alphanumeric" },
      { id: "address", label: "Address", type: "longtext", required: false, notes: "Alphanumeric long text" },
      { id: "location", label: "Location", type: "text", required: false, notes: "City/State/Country" },
      {
        id: "currency",
        label: "Currency",
        type: "dropdown",
        required: false,
        options: commonCurrencies, // Use static currency options
        notes: "Select from USD, EUR, GBP",
      },
      {
        id: "paymentTerms",
        label: "Payment Terms",
        type: "dropdown",
        required: false,
        options: ["Net 30", "Net 60", "Net 90", "30% Upfront / 70% Before Shipment"],
        notes: "Can add unlimited number of payment terms",
      },
      {
        id: "keyContactPersons",
        label: "Key Contact Person/s",
        type: "text",
        required: true,
        notes: "Name, Last Name",
      },
      { id: "telephones", label: "Telephone/s", type: "phone", required: false, notes: "Telephone" },
      { id: "emails", label: "Email/s", type: "email", required: false, notes: "Email" },
      {
        id: "preferredCourier",
        label: "Customer Preferred Courier",
        type: "dropdown",
        required: false,
        options: ["DHL", "FedEx", "UPS"],
        notes: "Dropdown (DHL, Fedex, UPS, etc)",
      },
      { id: "courierAcct", label: "Courier Acct#", type: "text", required: false, notes: "Alphanumeric" },
      {
        id: "shipToLocations",
        label: "Ship to Locations",
        type: "dropdown",
        required: false,
        options: [],
        notes: "Dropdown add unlimited",
      },
      { id: "whCode", label: "WH Code", type: "text", required: false, notes: "Linked to Ship to Location" },
    ],
  },
  {
    id: "suppliers",
    name: "Suppliers",
    description: "Supplier information and contacts",
    fields: [
      { id: "companyName", label: "Company Name", type: "text", required: true, notes: "Alphanumeric" },
      {
        id: "companyCode",
        label: "Company Code",
        type: "text",
        required: true,
        unique: true,
        maxLength: 5,
        notes: "Alphanumeric (max 5 digits), Unique Code",
      },
      { id: "address", label: "Address", type: "longtext", required: false, notes: "Alphanumeric long text" },
      { id: "location", label: "Location", type: "text", required: false, notes: "City/State/Country" },
      {
        id: "keyContactPersons",
        label: "Key Contact Person/s",
        type: "text",
        required: true,
        notes: "Name, Last Name",
      },
      { id: "telephones", label: "Telephone/s", type: "phone", required: false, notes: "Telephone" },
      { id: "emails", label: "Email/s", type: "email", required: false, notes: "Email" },
      {
        id: "productCategories",
        label: "Product Categories",
        type: "dropdown",
        required: false,
        options: fetchSupplierCategories, // Dynamic loading from API
        notes: "Dynamically fetched from supplier API",
      },
      { id: "moqs", label: "MOQ's", type: "number", required: false, notes: "Number/units" },
    ],
  },
  {
    id: "styles",
    name: "Styles",
    description: "Style information and details",
    fields: [
      {
        id: "customer",
        label: "Customer",
        type: "dropdown",
        required: true,
        notes: "Select the customer this style belongs to",
      },
      {
        id: "brand",
        label: "Brand",
        type: "dropdown",
        required: false,
        linkedTable: "customers",
        linkedField: "brands",
        notes: "Dropdown (Brand from Customer table)",
      },
      {
        id: "suppliers",
        label: "Supplier/s",
        type: "dropdown",
        required: false,
        linkedTable: "suppliers",
        linkedField: "companyName",
        notes: "Dropdown (Supplier from Supplier Table)",
      },
      { id: "styleCode", label: "Style Code", type: "text", required: true, notes: "Alphanumeric" },
      {
        id: "styleDescription",
        label: "Style Description",
        type: "longtext",
        required: true,
        notes: "Alphanumeric Long Text",
      },
      { id: "images", label: "Image/s", type: "image", required: true, notes: "Image Files" },
      {
        id: "season",
        label: "Season",
        type: "dropdown",
        required: false,
        options: ["Spring", "Summer", "Fall", "Winter", "Holiday"],
        notes: "Dropdown",
      },
      { id: "fabric", label: "Fabric", type: "text", required: false, notes: "Alphanumeric" },
      { id: "colors", label: "Color/s", type: "text", required: false, notes: "Text" },
      {
        id: "sizeGridName",
        label: "Size Grid Name",
        type: "dropdown",
        required: false,
        options: [],
        notes: "From Size Grid Table dropdown",
      },
      { id: "applications", label: "Application/s", type: "text", required: false, notes: "Alphanumeric" },
      { id: "files", label: "Files", type: "file", required: false, notes: "Attach files or link files" },
      {
        id: "sizeRange",
        label: "Size range",
        type: "dropdown",
        required: false,
        options: [],
        notes: "Dropdown to be added with each entry",
      },
      {
        id: "targetPrice",
        label: "Target Price",
        type: "currency",
        required: false,
        notes: "Automatic - Currency of Customer",
      },
    ],
  },
  {
    id: "priceQuotes",
    name: "Price Quotes",
    description: "Price quotes for styles",
    fields: [
      {
        id: "brand",
        label: "Brand",
        type: "text",
        required: false,
        notes: "This will come automatically after Style Code is entered",
      },
      {
        id: "supplier",
        label: "Supplier",
        type: "text",
        required: false,
        notes: "This will come automatically after Style Code is entered",
      },
      {
        id: "styleCode",
        label: "Style Code",
        type: "dropdown",
        required: true,
        linkedTable: "styles",
        linkedField: "styleCode",
        notes: "Enter this first",
      },
      {
        id: "styleDescription",
        label: "Style Description",
        type: "text",
        required: false,
        notes: "This will come automatically after Style Code is entered",
      },
      {
        id: "targetPrice",
        label: "Target Price",
        type: "currency",
        required: false,
        notes: "This will come automatically after Style Code is entered",
      },
      { id: "priceQuote", label: "Price Quote", type: "currency", required: false, notes: "Currency" },
      { id: "dateQuoted", label: "Date Quoted", type: "date", required: false, notes: "Date" },
      {
        id: "quotedBy",
        label: "Quoted by",
        type: "dropdown",
        required: false,
        notes: "Key Contact person in Supplier dropdown",
      },
      { id: "validForDays", label: "Valid For (days)", type: "number", required: false, notes: "Number of days" },
      { id: "confirmed", label: "Confirmed", type: "boolean", required: false, notes: "Yes/No" },
      { id: "dateConfirmed", label: "Date Confirmed", type: "date", required: false, notes: "Date" },
      { id: "notes", label: "Notes", type: "longtext", required: false, notes: "Free text" },
    ],
  },
  {
    id: "sampleOrders",
    name: "Sample Orders",
    description: "Sample order information",
    fields: [
      {
        id: "brand",
        label: "Brand",
        type: "text",
        required: false,
        notes: "Automatically comes after style code is selected",
      },
      {
        id: "styleCode",
        label: "Style Code",
        type: "dropdown",
        required: true,
        linkedTable: "styles",
        linkedField: "styleCode",
        notes: "Enter first from dropdown",
      },
      {
        id: "styleDescription",
        label: "Style Description",
        type: "text",
        required: false,
        notes: "Automatically comes after style code is selected",
      },
      { id: "sampleRequestDate", label: "Sample Request Date", type: "date", required: false, notes: "Date" },
      {
        id: "requestedBy",
        label: "Requested by",
        type: "dropdown",
        required: false,
        notes: "Enter from dropdown of the Brand's contact people",
      },
      {
        id: "sampleType",
        label: "Sample Type",
        type: "dropdown",
        required: false,
        options: ["Proto", "SMS", "PPS", "TOP"],
        notes: "Dropdown: Proto, SMS, PPS, TOP",
      },
      { id: "sampleNumber", label: "Sample #", type: "text", required: false, notes: "Automatic" },
      { id: "exFactoryRequested", label: "Ex-factory Requested", type: "date", required: false, notes: "Date" },
      {
        id: "factoryExFactoryCommitted",
        label: "Factory Ex-Factory Committed",
        type: "date",
        required: false,
        notes: "Date",
      },
      {
        id: "daysRemaining",
        label: "Days remaining",
        type: "formula",
        required: false,
        formula: "Today-Factory ex-factory committed",
        notes: "Today-Factory ex-factory committed",
      },
      { id: "actualExFactory", label: "Actual Ex-Factory", type: "date", required: false, notes: "Date" },
      {
        id: "courier",
        label: "Courier",
        type: "dropdown",
        required: false,
        options: ["DHL", "FedEx", "UPS"],
        notes: "Select from drop down",
      },
      {
        id: "trackingNumber",
        label: "Tracking #",
        type: "text",
        required: false,
        notes: "Automatic link to courier tracking",
      },
      { id: "price", label: "Price", type: "currency", required: false, notes: "Currency" },
      { id: "targetPrice", label: "Target Price", type: "currency", required: false, notes: "Currency" },
      { id: "notes", label: "Notes", type: "longtext", required: false, notes: "Free Text" },
    ],
  },
  {
    id: "customerPOs",
    name: "Customer PO's",
    description: "Customer purchase order information",
    fields: [
      { id: "date", label: "Date", type: "date", required: false, notes: "Date" },
      {
        id: "customer",
        label: "Customer",
        type: "dropdown",
        required: false,
        linkedTable: "customers",
        linkedField: "companyName",
        notes: "Select from dropdown",
      },
      {
        id: "supplier",
        label: "Supplier",
        type: "dropdown",
        required: false,
        linkedTable: "suppliers",
        linkedField: "companyName",
        notes: "Select from dropdown",
      },
      { id: "poNumber", label: "PO#", type: "text", required: false, notes: "" },
      {
        id: "style",
        label: "Style",
        type: "dropdown",
        required: false,
        linkedTable: "styles",
        linkedField: "styleCode",
        notes: "Select from dropdown",
      },
      {
        id: "sizeType",
        label: "Size Type",
        type: "dropdown",
        required: false,
        options: [],
        notes: "Select from dropdown",
      },
      {
        id: "sizeGrid",
        label: "Size Grid",
        type: "text",
        required: false,
        notes: "Automatic size grid comes up to fill units",
      },
      { id: "unitsInSizeGrid", label: "Units in size grid", type: "number", required: false, notes: "Enter units" },
      {
        id: "totalUnits",
        label: "Total Units",
        type: "formula",
        required: false,
        formula: "Sum of units in size grid",
        notes: "Formula calculates all sizes total",
      },
      {
        id: "unitPrice",
        label: "Unit Price",
        type: "currency",
        required: false,
        notes: "Comes from confirmed price of style",
      },
      {
        id: "totalAmount",
        label: "Total Amount",
        type: "formula",
        required: false,
        formula: "unitPrice * totalUnits",
        notes: "Formula multiply price by units",
      },
      {
        id: "shipTo",
        label: "Ship to",
        type: "dropdown",
        required: false,
        linkedTable: "customers",
        linkedField: "shipToLocations",
        notes: "Dropdown from customer table",
      },
      {
        id: "whCode",
        label: "WH Code",
        type: "dropdown",
        required: false,
        linkedTable: "customers",
        linkedField: "whCode",
        notes: "Dropdown from customer table",
      },
      { id: "exFactoryDate", label: "Ex-Factory Date", type: "date", required: false, notes: "Date" },
      { id: "factoryCommittedDate", label: "Factory Committed Date", type: "date", required: false, notes: "Date" },
      { id: "actualShipDate", label: "Actual Ship Date", type: "date", required: false, notes: "Date" },
      {
        id: "daysRemaining",
        label: "Days remaining",
        type: "formula",
        required: false,
        formula: "Today-exFactoryDate",
        notes: "Formula today-ex-factory",
      },
    ],
  },
  {
    id: "tasks",
    name: "Tasks",
    description: "Task management",
    fields: [
      { id: "date", label: "Date", type: "date", required: false, notes: "Date" },
      {
        id: "customer",
        label: "Customer",
        type: "dropdown",
        required: false,
        linkedTable: "customers",
        linkedField: "companyName",
        notes: "",
      },
      {
        id: "supplier",
        label: "Supplier",
        type: "dropdown",
        required: false,
        linkedTable: "suppliers",
        linkedField: "companyName",
        notes: "",
      },
      {
        id: "style",
        label: "Style",
        type: "dropdown",
        required: false,
        linkedTable: "styles",
        linkedField: "styleCode",
        notes: "",
      },
      {
        id: "sampleOrder",
        label: "Sample Order",
        type: "dropdown",
        required: false,
        linkedTable: "sampleOrders",
        linkedField: "sampleNumber",
        notes: "",
      },
      {
        id: "customerPO",
        label: "Customer PO",
        type: "dropdown",
        required: false,
        linkedTable: "customerPOs",
        linkedField: "poNumber",
        notes: "",
      },
      { id: "assignedTo", label: "Assigned to", type: "text", required: false, notes: "" },
      {
        id: "urgency",
        label: "Urgency",
        type: "dropdown",
        required: false,
        options: ["Low", "Medium", "High", "Critical"],
        notes: "Dropdown",
      },
      { id: "notes", label: "Notes", type: "longtext", required: false, notes: "" },
    ],
  },
  {
    id: "fabrics",
    name: "Fabrics",
    description: "Fabric inventory and specifications",
    fields: [
      {
        id: "fabricCode",
        label: "Fabric Code",
        type: "text",
        required: true,
        unique: true,
        notes: "Unique fabric identifier",
      },
      { id: "fabricName", label: "Fabric Name", type: "text", required: true, notes: "Commercial fabric name" },
      {
        id: "composition",
        label: "Composition",
        type: "text",
        required: false,
        notes: "Fiber content (e.g., 100% Cotton)",
      },
      {
        id: "weight",
        label: "Weight (GSM)",
        type: "number",
        required: false,
        notes: "Fabric weight in grams per square meter",
      },
      { id: "width", label: "Width (inches)", type: "number", required: false, notes: "Fabric width in inches" },
      {
        id: "supplier",
        label: "Supplier",
        type: "dropdown",
        required: false,
        linkedTable: "suppliers",
        linkedField: "companyName",
        notes: "Fabric supplier",
      },
      {
        id: "fabricType",
        label: "Fabric Type",
        type: "dropdown",
        required: false,
        options: ["Woven", "Knit", "Non-woven", "Lace", "Mesh"],
        notes: "Type of fabric construction",
      },
      {
        id: "season",
        label: "Season",
        type: "dropdown",
        required: false,
        options: ["Spring", "Summer", "Fall", "Winter", "All Season"],
        notes: "Suitable season for fabric",
      },
      { id: "colorways", label: "Available Colorways", type: "text", required: false, notes: "Available colors" },
      {
        id: "minimumOrder",
        label: "Minimum Order (yards)",
        type: "number",
        required: false,
        notes: "Minimum order quantity",
      },
      { id: "pricePerYard", label: "Price per Yard", type: "currency", required: false, notes: "Cost per yard" },
      { id: "leadTime", label: "Lead Time (days)", type: "number", required: false, notes: "Production lead time" },
      {
        id: "status",
        label: "Status",
        type: "dropdown",
        required: false,
        options: ["Available", "Limited", "Discontinued", "Sample Only"],
        notes: "Current availability status",
      },
      { id: "notes", label: "Notes", type: "longtext", required: false, notes: "Additional fabric information" },
      { id: "images", label: "Images", type: "image", required: false, notes: "Fabric photos or swatches" },
    ],
  },
]

// Validated and exported tables
export const tables: TableDefinition[] = rawTables.map((table) => ({
  ...table,
  fields: table.fields.map(validateField),
}))

// Memoized table lookup
export const getTableById = memoize((tableId: string): TableDefinition | undefined => {
  const table = tables.find((t) => t.id === tableId)
  if (!table) console.warn(`Table with ID '${tableId}' not found`)
  return table
})

// Utility to get field options (supports static, linked, and dynamic data)
export const getFieldOptions = async (tableId: string, fieldId: string): Promise<string[]> => {
  const table = getTableById(tableId)
  if (!table) return []

  const field = table.fields.find((f) => f.id === fieldId)
  if (!field || field.type !== "dropdown") return []

  // Dynamic options from function
  if (typeof field.options === "function") {
    return await field.options() // Execute the async function
  }

  // Linked table options
  if (field.linkedTable && field.linkedField) {
    const dataKey = `table_${field.linkedTable}_data`
    const rawData = localStorage.getItem(dataKey)
    if (!rawData) {
      console.log(`[v0] No data found for linked table: ${field.linkedTable}`)
      return field.options || []
    }

    try {
      const data = JSON.parse(rawData) as any[]
      console.log(`[v0] Loading options from ${field.linkedTable}.${field.linkedField}, found ${data.length} records`)

      const options = new Set<string>()
      data.forEach((record) => {
        const value = record[field.linkedField]
        if (Array.isArray(value)) {
          value.forEach((v) => {
            if (v !== null && v !== undefined && v !== "") {
              options.add(String(v))
            }
          })
        } else if (value !== null && value !== undefined && value !== "") {
          options.add(String(value))
        }
      })

      const result = Array.from(options).sort()
      console.log(`[v0] Extracted ${result.length} unique options:`, result)
      return result
    } catch (e) {
      console.error(`Error fetching linked options for ${tableId}.${fieldId}:`, e)
      return field.options || []
    }
  }

  // Static options
  return field.options || []
}

// Additional Recommendations Implementation:
// 1. Dynamic Features: Added function-based options for dynamic data loading
// 2. Error Handling: Included fallbacks and logging in dynamic fetch functions
// 3. Performance: Used memoization for getTableById; dynamic loading is async
// 4. Accessibility: N/A (no UI), but improved type safety aids usage
// 5. Testing: Updated TODO comment below

// TODO: Add unit tests in a separate file (e.g., data-structure.test.ts) - Recommendation 5
// Suggested tests:
// 1. Test tables export contains all defined tables
// 2. Test getTableById returns correct table or undefined
// 3. Test validateField corrects invalid types
// 4. Test getFieldOptions fetches static, linked, and dynamic options
// 5. Test dynamic fetch functions handle success and failure
// Example test file structure:
// import { tables, getFieldOptions } from "./data-structure"
// test("dynamic currency options", async () => {
//   global.fetch = jest.fn().mockResolvedValue({
//     json: () => Promise.resolve({ success: true, symbols: { USD: "US Dollar", EUR: "Euro" } }),
//   });
//   const options = await getFieldOptions("customers", "currency");
//   expect(options).toEqual(["USD", "EUR"]);
// });
// test("linked options", async () => {
//   localStorage.setItem("table_customers_data", JSON.stringify([{ companyName: "A", brands: "Brand1" }]));
//   const options = await getFieldOptions("styles", "brand");
//   expect(options).toEqual(["Brand1"]);
// });

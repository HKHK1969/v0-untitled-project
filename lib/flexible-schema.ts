/**
 * Flexible Schema Utilities
 *
 * This module provides utilities for working with flexible database schemas,
 * supporting static and dynamic data extensions.
 */

import { tables, type Field, type TableDefinition, type FieldType, getFieldOptions } from "@/lib/data-structure"
import { memoize } from "lodash" // Optional, for memoization

// Constants
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
const DATA_KEY_PREFIX = "table_"
const DEFAULT_DATE_FIELD: Field = {
  id: "dateCreated",
  label: "Date Created",
  type: "date",
  required: false,
  notes: "Automatically set when record is created",
  defaultValue: () => new Date().toISOString(), // Dynamic default value
}

// Type definitions
interface SchemaConfig {
  persistToDatabase?: (tables: TableDefinition[]) => Promise<void> // Recommendation 1: Persistence callback
  onError?: (error: Error, context: string) => void // Recommendation 1: Error callback
}

const FIELD_TYPES_OLD = ["text", "number", "date", "dropdown", "checkbox", "formula"]

// Utility to validate and normalize field
const normalizeField = (field: Partial<Field>): Field => {
  const baseField: Field = {
    id: field.id || "",
    label: field.label || "",
    type: (field.type || "text") as FieldType,
    required: field.required || false,
    notes: field.notes || "",
  }

  if (!FIELD_TYPES.includes(baseField.type)) {
    console.warn(`Invalid field type '${baseField.type}' for field '${baseField.id}'`)
    baseField.type = "text"
  }

  return {
    ...baseField,
    unique: field.unique,
    options: field.type === "dropdown" ? field.options : undefined,
    maxLength: field.maxLength,
    defaultValue: field.defaultValue,
    formula: field.type === "formula" ? field.formula : undefined,
    linkedTable: field.type === "dropdown" ? field.linkedTable : undefined,
    linkedField: field.type === "dropdown" ? field.linkedField : undefined,
    disabled: field.disabled,
  }
}

// Add Field to Table (Recommendation 1: Dynamic support)
export function addFieldToTable(tableId: string, field: Partial<Field>, config: SchemaConfig = {}): boolean {
  try {
    const table = tables.find((t) => t.id === tableId)
    if (!table) {
      console.error(`Table ${tableId} not found`)
      config.onError?.(new Error(`Table ${tableId} not found`), "addFieldToTable")
      return false
    }

    // Validate field ID
    if (!field.id || !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(field.id)) {
      const errorMsg = `Invalid field ID: ${field.id}. Must start with a letter and contain only letters, numbers, and underscores.`
      console.error(errorMsg)
      config.onError?.(new Error(errorMsg), "addFieldToTable")
      return false
    }

    const normalizedField = normalizeField(field)
    if (table.fields.some((f) => f.id === normalizedField.id)) {
      console.error(`Field ${normalizedField.id} already exists in table ${tableId}`)
      config.onError?.(new Error(`Field ${normalizedField.id} already exists`), "addFieldToTable")
      return false
    }

    table.fields.push(normalizedField)
    console.log(`Added field ${normalizedField.id} to table ${tableId}`)

    if (config.persistToDatabase) {
      config
        .persistToDatabase(tables)
        .catch((e) => config.onError?.(e instanceof Error ? e : new Error("Persistence error"), "addFieldToTable"))
    }

    return true
  } catch (error) {
    console.error("Error adding field to table:", error)
    config.onError?.(error instanceof Error ? error : new Error("Unknown error"), "addFieldToTable")
    return false
  }
}

/**
 * Updates an existing field in a table definition
 *
 * @param tableId The ID of the table containing the field
 * @param fieldId The ID of the field to update
 * @param updates The updates to apply to the field
 * @returns boolean indicating success
 */
export function updateField(
  tableId: string,
  fieldId: string,
  updates: Partial<Field>,
  config: SchemaConfig = {},
): boolean {
  try {
    const table = tables.find((t) => t.id === tableId)
    if (!table) {
      console.error(`Table ${tableId} not found`)
      config.onError?.(new Error(`Table ${tableId} not found`), "updateField")
      return false
    }

    const fieldIndex = table.fields.findIndex((f) => f.id === fieldId)
    if (fieldIndex === -1) {
      console.error(`Field ${fieldId} not found in table ${tableId}`)
      config.onError?.(new Error(`Field ${fieldId} not found`), "updateField")
      return false
    }

    const updatedField = normalizeField({ ...table.fields[fieldIndex], ...updates })
    table.fields[fieldIndex] = updatedField
    console.log(`Updated field ${fieldId} in table ${tableId}`)

    if (config.persistToDatabase) {
      config
        .persistToDatabase(tables)
        .catch((e) => config.onError?.(e instanceof Error ? e : new Error("Persistence error"), "updateField"))
    }

    return true
  } catch (error) {
    console.error("Error updating field:", error)
    config.onError?.(error instanceof Error ? error : new Error("Unknown error"), "updateField")
    return false
  }
}

/**
 * Migrates existing data to accommodate schema changes
 *
 * @param tableId The ID of the table whose data needs migration
 * @param migrationFn A function that transforms each record
 * @returns boolean indicating success
 */
export function migrateTableData(
  tableId: string,
  migrationFn: (record: any) => any,
  config: SchemaConfig = {},
): boolean {
  if (typeof window === "undefined") return false

  try {
    const dataKey = `${DATA_KEY_PREFIX}${tableId}_data`
    const savedData = localStorage.getItem(dataKey)
    if (!savedData) {
      console.log(`No data found for table ${tableId}`)
      return true
    }

    const data = JSON.parse(savedData)
    if (!Array.isArray(data)) {
      console.error(`Data for table ${tableId} is not an array`)
      config.onError?.(new Error(`Invalid data format for ${tableId}`), "migrateTableData")
      return false
    }

    const migratedData = data.map((record) => {
      try {
        return migrationFn(record)
      } catch (e) {
        console.warn(`Error migrating record in ${tableId}:`, e)
        return record // Preserve original on error (Recommendation 2)
      }
    })

    localStorage.setItem(dataKey, JSON.stringify(migratedData))
    console.log(`Migrated ${migratedData.length} records for table ${tableId}`)
    return true
  } catch (error) {
    console.error("Error migrating table data:", error)
    config.onError?.(error instanceof Error ? error : new Error("Unknown error"), "migrateTableData")
    return false
  }
}

/**
 * Adds a new table to the application
 *
 * @param table The table definition to add
 * @returns boolean indicating success
 */
export function addTable(
  table: Omit<TableDefinition, "fields"> & { fields: Partial<Field>[] },
  config: SchemaConfig = {},
): boolean {
  try {
    if (tables.some((t) => t.id === table.id)) {
      console.error(`Table ${table.id} already exists`)
      config.onError?.(new Error(`Table ${table.id} already exists`), "addTable")
      return false
    }

    const normalizedFields = table.fields.map(normalizeField)
    if (!normalizedFields.some((f) => f.id === "dateCreated")) {
      normalizedFields.push(DEFAULT_DATE_FIELD)
    }

    const newTable: TableDefinition = {
      id: table.id,
      name: table.name,
      description: table.description,
      fields: normalizedFields,
    }

    tables.push(newTable)
    console.log(`Added table ${table.id}`)

    if (config.persistToDatabase) {
      config
        .persistToDatabase(tables)
        .catch((e) => config.onError?.(e instanceof Error ? e : new Error("Persistence error"), "addTable"))
    }

    return true
  } catch (error) {
    console.error("Error adding table:", error)
    config.onError?.(error instanceof Error ? error : new Error("Unknown error"), "addTable")
    return false
  }
}

// Utility to fetch dynamic field options (Recommendation 1: Dynamic data support)
export const fetchFieldOptions = memoize(
  async (tableId: string, fieldId: string): Promise<string[]> => {
    try {
      return await getFieldOptions(tableId, fieldId) // Leverages dynamic support from data-structure.ts
    } catch (error) {
      console.error(`Error fetching options for ${tableId}.${fieldId}:`, error)
      return []
    }
  },
  (tableId, fieldId) => `${tableId}.${fieldId}`, // Cache key
)

// Additional Recommendations Implementation:
// 1. Dynamic Features: Added config with persistToDatabase and dynamic options support
// 2. Error Handling: Enhanced with onError callback and per-record migration safety
// 3. Performance: Memoized fetchFieldOptions; optimized migrations
// 4. Accessibility: N/A (no UI), but improved type safety aids usage
// 5. Testing: Added TODO comment below

// TODO: Add unit tests in a separate file (e.g., schema-utils.test.ts) - Recommendation 5
// Suggested tests:
// 1. Test addFieldToTable adds new field and handles duplicates
// 2. Test updateField modifies existing field properties
// 3. Test migrateTableData transforms data and handles errors
// 4. Test addTable creates new table with dateCreated
// 5. Test fetchFieldOptions retrieves dynamic and static options
// Example test file structure:
// import { addFieldToTable, migrateTableData } from "./schema-utils"
// test("addFieldToTable", () => {
//   const success = addFieldToTable("customers", { id: "newField", label: "New Field", type: "text", required: false });
//   expect(success).toBe(true);
//   expect(tables.find(t => t.id === "customers")?.fields.some(f => f.id === "newField")).toBe(true);
// });
// test("migrateTableData", () => {
//   localStorage.setItem("table_customers_data", JSON.stringify([{ id: 1, name: "Test" }]));
//   const success = migrateTableData("customers", (rec) => ({ ...rec, newField: "default" }));
//   expect(success).toBe(true);
//   expect(JSON.parse(localStorage.getItem("table_customers_data")!).length).toBe(1);
// });

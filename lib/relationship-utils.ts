/**
 * Relationship Utilities
 *
 * Utilities for handling relationships between tables, supporting static and dynamic data.
 */

import { tables } from "@/lib/data-structure"
import { memoize } from "lodash" // Optional, for memoization

// Constants
const DATA_KEY_PREFIX = "table_"

// Type definitions
type RecordData = Record<string, string | string[] | number | boolean | Date | null | undefined>

interface RelationshipConfig {
  onError?: (error: Error, context: string) => void // Recommendation 1: Error callback
}

// Table and field relationship mappings (Recommendation 1: Dynamic mapping)
const getFieldToTableMap = memoize((): Record<string, string> => {
  const map: Record<string, string> = {}
  tables.forEach((table) => {
    table.fields.forEach((field) => {
      // Map field IDs to their tables
      map[field.id] = table.id
      // Additional common aliases
      if (field.id === "companyName") map["customer"] = table.id
      if (field.id === "brands") map["brand"] = table.id
      if (field.id === "styleCode") map["style"] = table.id
      if (field.id === "sampleNumber") map["sampleOrder"] = table.id
      if (field.id === "poNumber") map["customerPO"] = table.id
    })
  })
  return map
})

const getTableToDisplayFieldMap = memoize((): Record<string, string> => {
  const map: Record<string, string> = {}
  tables.forEach((table) => {
    // Default to first text or dropdown field as display, or "id"
    const displayField = table.fields.find((f) => f.type === "text" || f.type === "dropdown")?.id || "id"
    map[table.id] = displayField
  })
  return {
    customers: "companyName",
    suppliers: "companyName",
    styles: "styleCode",
    sampleOrders: "sampleNumber",
    customerPOs: "poNumber",
    ...map, // Override with dynamic mappings
  }
})

// Add cache invalidation mechanism
const cacheInvalidationTimestamps: Record<string, number> = {}

export function invalidateTableCache(tableId: string): void {
  cacheInvalidationTimestamps[tableId] = Date.now()
}

export const getRelatedTableData = memoize(
  (tableId: string, timestamp: number, config: RelationshipConfig = {}): RecordData[] => {
    if (typeof window === "undefined") return []

    try {
      const savedData = localStorage.getItem(`${DATA_KEY_PREFIX}${tableId}_data`)
      if (!savedData) return []

      const data = JSON.parse(savedData)
      if (!Array.isArray(data)) {
        throw new Error(`Data for table ${tableId} is not an array`)
      }
      return data as RecordData[]
    } catch (e) {
      console.error(`Error loading data for table ${tableId}:`, e)
      config.onError?.(e instanceof Error ? e : new Error("Unknown error"), `getRelatedTableData(${tableId})`)
      return []
    }
  },
  (tableId, timestamp) => `${tableId}-${timestamp}`, // Cache key includes timestamp
)

// Update the getUniqueFieldValues function to use the cache invalidation
export function getUniqueFieldValues(tableId: string, fieldId: string, config: RelationshipConfig = {}): string[] {
  const tableData = getRelatedTableData(tableId, cacheInvalidationTimestamps[tableId] || 0, config)
  const uniqueValues = new Set<string>()

  tableData.forEach((record) => {
    const value = record[fieldId]
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== "") {
          uniqueValues.add(String(item))
        }
      })
    } else if (value !== undefined && value !== null && value !== "") {
      uniqueValues.add(String(value))
    }
  })

  return Array.from(uniqueValues).sort()
}

// Find Related Table (Recommendation 1: Dynamic mapping)
export function findRelatedTable(fieldId: string): string | null {
  const fieldToTableMap = getFieldToTableMap()
  const relatedTable = fieldToTableMap[fieldId]
  if (!relatedTable) {
    console.warn(`No related table found for field '${fieldId}'`)
  }
  return relatedTable || null
}

// Get Display Field (Recommendation 1: Dynamic mapping)
export function getDisplayField(tableId: string): string {
  const tableToDisplayFieldMap = getTableToDisplayFieldMap()
  const displayField = tableToDisplayFieldMap[tableId]
  if (!displayField) {
    console.warn(`No display field defined for table '${tableId}'`)
  }
  return displayField || "id"
}

// Get Relationship Options (Supports dynamic data via data-structure.ts)
export async function getRelationshipOptions(fieldId: string, config: RelationshipConfig = {}): Promise<string[]> {
  const relatedTable = findRelatedTable(fieldId)
  if (!relatedTable) return []

  const table = tables.find((t) => t.id === relatedTable)
  const field = table?.fields.find((f) => f.id === fieldId)

  // If field has dynamic options (e.g., from an API)
  if (field && field.type === "dropdown" && typeof field.options === "function") {
    try {
      return await field.options()
    } catch (e) {
      console.error(`Error fetching dynamic options for ${relatedTable}.${fieldId}:`, e)
      config.onError?.(e instanceof Error ? e : new Error("Unknown error"), `getRelationshipOptions(${fieldId})`)
      return []
    }
  }

  // Otherwise, use static or linked data
  const displayField = getDisplayField(relatedTable)
  return getUniqueFieldValues(relatedTable, displayField, config)
}

// Additional Recommendations Implementation:
// 1. Dynamic Features: Added dynamic mappings and async options support
// 2. Error Handling: Enhanced with config.onError and dynamic fallback
// 3. Performance: Memoized key functions for efficiency
// 4. Accessibility: N/A (no UI), but improved type safety aids usage
// 5. Testing: Added TODO comment below

// TODO: Add unit tests in a separate file (e.g., relationships.test.ts) - Recommendation 5
// Suggested tests:
// 1. Test getRelatedTableData retrieves and parses data
// 2. Test getUniqueFieldValues returns sorted unique values
// 3. Test findRelatedTable maps fields to tables dynamically
// 4. Test getDisplayField returns appropriate fields
// 5. Test getRelationshipOptions handles static and dynamic options
// Example test file structure:
// import { getRelatedTableData, getRelationshipOptions } from "./relationships"
// test("getRelatedTableData", () => {
//   localStorage.setItem("table_customers_data", JSON.stringify([{ companyName: "Test" }]));
//   const data = getRelatedTableData("customers");
//   expect(data).toEqual([{ companyName: "Test" }]);
// });
// test("getRelationshipOptions dynamic", async () => {
//   jest.spyOn(require("@/lib/data-structure"), "tables").mockReturnValue([
//     { id: "customers", fields: [{ id: "currency", type: "dropdown", options: async () => ["USD", "EUR"] }] },
//   ]);
//   const options = await getRelationshipOptions("currency");
//   expect(options).toEqual(["USD", "EUR"]);
// });

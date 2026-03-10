/**
 * Enhanced Data Persistence Layer
 *
 * This module provides comprehensive backup and restoration of data
 * to prevent data loss during code changes or page refreshes.
 */

import { tables } from "@/lib/data-structure"

// Constants (Recommendation 1: Configurable)
const BACKUP_PREFIX = "backup_"
const BACKUP_PREFIX_SESSION = "session_backup_"
const BACKUP_PREFIX_LOCAL = "local_backup_"
const BACKUP_INTERVAL_MS = 15000 // Recommendation 1: Configurable interval
const VALID_KEY_PREFIXES = ["table_", "options_"] as const

// Type definitions
type StorageKeyPrefix = (typeof VALID_KEY_PREFIXES)[number]
interface TableField {
  id: string
  type: string
}
interface Table {
  id: string
  fields: TableField[]
}
interface PersistenceConfig {
  backupInterval?: number // Recommendation 1
  onError?: (error: Error, context: string) => void // Recommendation 1
}

// Utility functions
const getFilteredKeys = (storage: Storage): string[] =>
  Object.keys(storage).filter((key) => VALID_KEY_PREFIXES.some((prefix) => key.startsWith(prefix)))

const safeParseJSON = (data: string | null, context: string): any => {
  try {
    return data ? JSON.parse(data) : null
  } catch (e) {
    console.error(`Error parsing JSON in ${context}:`, e)
    return null
  }
}

// Backup to SessionStorage
export function backupToSessionStorage(): void {
  if (typeof window === "undefined") return

  try {
    const keys = getFilteredKeys(localStorage)
    keys.forEach((key) => {
      const data = localStorage.getItem(key)
      if (data) sessionStorage.setItem(`${BACKUP_PREFIX_SESSION}${key}`, data)
    })
    sessionStorage.setItem("last_session_backup_time", new Date().toISOString())
    console.log("Data backed up to sessionStorage at", new Date().toISOString())
  } catch (error) {
    console.error("Error backing up to sessionStorage:", error)
  }
}

// Backup to LocalStorage
export function backupToLocalStorage(): void {
  if (typeof window === "undefined") return

  try {
    const keys = getFilteredKeys(localStorage)
    keys.forEach((key) => {
      const data = localStorage.getItem(key)
      if (data) localStorage.setItem(`${BACKUP_PREFIX_LOCAL}${key}`, data)
    })
    localStorage.setItem("last_local_backup_time", new Date().toISOString())
    console.log("Data backed up to localStorage at", new Date().toISOString())
  } catch (error) {
    console.error("Error backing up to localStorage:", error)
  }
}

// Comprehensive Backup
export function backupAllData(): void {
  backupToSessionStorage()
  backupToLocalStorage()
}

/* ----------------------------------------------------------------------
 * Helper functions for table-level CRUD used by UI pages
 * -------------------------------------------------------------------- */
export function getTable(tableId: string) {
  try {
    // basic meta from table definitions
    const tableDef = tables.find((t) => t.id === tableId)
    const records = loadData(tableId)

    const columns =
      tableDef?.fields.map((f) => ({
        id: f.id,
        label: f.label,
        type: f.type,
        required: (f as any).required ?? false,
      })) ?? []

    return {
      id: tableId,
      name: tableDef?.name ?? tableId,
      columns,
      records,
    }
  } catch (error) {
    console.error("Error in getTable:", error)
    return null
  }
}

/**
 * updateTable – currently supports updating `records` only.
 * Can be extended later for schema / meta updates.
 */
export function updateTable(tableId: string, updates: { records?: any[] }): boolean {
  try {
    if (updates.records) {
      localStorage.setItem(`table_${tableId}_data`, JSON.stringify(updates.records))
      // Broadcast change so other tabs update.
      window.dispatchEvent(new Event("storage"))
    }
    return true
  } catch (error) {
    console.error("Error in updateTable:", error)
    return false
  }
}

// Check and Restore Data (Recommendation 2: Enhanced error handling)
export function checkAndRestoreData(config: PersistenceConfig = {}): boolean {
  if (typeof window === "undefined") return false

  let restoredData = false
  const restoredTables: string[] = []

  try {
    tables.forEach((table: Table) => {
      const tableKey = `table_${table.id}_data`
      const currentData = localStorage.getItem(tableKey)

      if (!currentData || currentData === "[]") {
        const backups = [
          sessionStorage.getItem(`${BACKUP_PREFIX_SESSION}${tableKey}`),
          localStorage.getItem(`${BACKUP_PREFIX_LOCAL}${tableKey}`),
          sessionStorage.getItem(`${BACKUP_PREFIX}${tableKey}`),
        ]

        const backup = backups.find((b) => b && b !== "[]")
        if (backup) {
          const parsed = safeParseJSON(backup, `restore ${tableKey}`)
          if (parsed !== null) {
            localStorage.setItem(tableKey, backup)
            restoredData = true
            restoredTables.push(table.id)
            console.log(`Restored data for ${tableKey} from backup`)
          }
        }
      }

      table.fields.forEach((field) => {
        if (field.type === "dropdown") {
          const optionsKey = `options_${table.id}_${field.id}`
          if (!localStorage.getItem(optionsKey)) {
            const backups = [
              sessionStorage.getItem(`${BACKUP_PREFIX_SESSION}${optionsKey}`),
              localStorage.getItem(`${BACKUP_PREFIX_LOCAL}${optionsKey}`),
              sessionStorage.getItem(`${BACKUP_PREFIX}${optionsKey}`),
            ]

            const backup = backups.find((b) => b)
            if (backup) {
              const parsed = safeParseJSON(backup, `restore ${optionsKey}`)
              if (parsed !== null) {
                localStorage.setItem(optionsKey, backup)
                restoredData = true
                console.log(`Restored options for ${optionsKey} from backup`)
              }
            }
          }
        }
      })
    })

    if (restoredData) {
      console.log("Restored tables:", restoredTables.join(", "))
    }
    return restoredData
  } catch (error) {
    console.error("Error in checkAndRestoreData:", error)
    config.onError?.(error instanceof Error ? error : new Error("Unknown error"), "checkAndRestoreData")
    return false
  }
}

// Export All Data
export function exportAllData(): string {
  if (typeof window === "undefined") return "{}"

  try {
    const exportData: Record<string, any> = {}
    const keys = getFilteredKeys(localStorage)

    keys.forEach((key) => {
      const data = safeParseJSON(localStorage.getItem(key), `export ${key}`)
      if (data !== null) exportData[key] = data
    })

    return JSON.stringify(exportData, null, 2)
  } catch (error) {
    console.error("Error in exportAllData:", error)
    return "{}"
  }
}

// Import All Data (Recommendation 2: Enhanced error handling)
export function importAllData(jsonData: string, config: PersistenceConfig = {}, retryCount = 3): boolean {
  if (typeof window === "undefined") return false

  try {
    const data = JSON.parse(jsonData)
    if (typeof data !== "object" || data === null) {
      throw new Error("Invalid data format")
    }

    backupAllData()

    Object.entries(data).forEach(([key, value]) => {
      try {
        localStorage.setItem(key, JSON.stringify(value))
      } catch (e) {
        console.error(`Error importing ${key}:`, e)
        config.onError?.(e instanceof Error ? e : new Error("Unknown error"), `import ${key}`)
      }
    })

    window.dispatchEvent(new Event("storage"))
    return true
  } catch (e) {
    console.error(`Error importing data (attempts left: ${retryCount}):`, e)
    if (retryCount > 0) {
      // Wait and retry with exponential backoff
      const backoffTime = Math.pow(2, 3 - retryCount) * 1000 // 1s, 2s, 4s
      setTimeout(() => importAllData(jsonData, config, retryCount - 1), backoffTime)
      return true
    }
    config.onError?.(e instanceof Error ? e : new Error("Unknown error"), "importAllData")
    return false
  }
}

// Initialize Data Persistence (Recommendation 3: Optimized)
export function initDataPersistence(config: PersistenceConfig = {}): (() => void) | void {
  if (typeof window === "undefined") return

  const { backupInterval = BACKUP_INTERVAL_MS, onError } = config

  try {
    const dataRestored = checkAndRestoreData(config)
    if (dataRestored && process.env.NODE_ENV === "development") {
      console.log("Data was restored from backup")
    }

    backupAllData()
    const intervalId = setInterval(backupAllData, backupInterval)

    const handleStorage = (e: StorageEvent) => {
      if (
        e.key &&
        !e.key.startsWith(BACKUP_PREFIX) &&
        !e.key.startsWith(BACKUP_PREFIX_SESSION) &&
        !e.key.startsWith(BACKUP_PREFIX_LOCAL) &&
        e.newValue &&
        VALID_KEY_PREFIXES.some((prefix) => e.key!.startsWith(prefix))
      ) {
        try {
          sessionStorage.setItem(`${BACKUP_PREFIX_SESSION}${e.key}`, e.newValue)
          localStorage.setItem(`${BACKUP_PREFIX_LOCAL}${e.key}`, e.newValue)
        } catch (error) {
          if (process.env.NODE_ENV === "development") {
            console.error("Error in storage event handler:", error)
          }
          onError?.(error instanceof Error ? error : new Error("Unknown error"), "storageEvent")
        }
      }
    }

    const handleBeforeUnload = () => {
      try {
        backupAllData()
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error during beforeunload backup:", error)
        }
      }
    }

    window.addEventListener("storage", handleStorage)
    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      clearInterval(intervalId)
      window.removeEventListener("storage", handleStorage)
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error in initDataPersistence:", error)
    }
    onError?.(error instanceof Error ? error : new Error("Unknown error"), "initDataPersistence")
  }
}

// Load Data
export function loadData(tableId: string): any[] {
  if (typeof window === "undefined") return []

  try {
    const savedData = localStorage.getItem(`table_${tableId}_data`)
    return savedData ? JSON.parse(savedData) : []
  } catch (e) {
    console.error(`Error loading table data for ${tableId}:`, e)
    return []
  }
}

// Get Local Data
export function getLocalData(): any {
  if (typeof window === "undefined") return null

  try {
    const data: any = {
      tables: {},
    }

    tables.forEach((table) => {
      const tableData = loadData(table.id)
      data.tables[table.id] = {
        name: table.name,
        description: table.description,
        fields: table.fields.reduce((acc: any, field) => {
          acc[field.id] = {
            label: field.label,
            type: field.type,
          }
          return acc
        }, {}),
        records: tableData.reduce((acc: any, record: any) => {
          acc[record.id] = record
          return acc
        }, {}),
      }
    })

    return data
  } catch (e) {
    console.error("Error getting local data:", e)
    return null
  }
}

// Also export as a named object for new code
export const DataPersistence = {
  backupToSessionStorage,
  backupToLocalStorage,
  backupAllData,
  checkAndRestoreData,
  exportAllData,
  importAllData,
  initDataPersistence,
  loadData,
  getLocalData,
  /* NEW: table-level helpers */
  getTable,
  updateTable,
}

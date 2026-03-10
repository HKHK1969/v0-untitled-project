import { DatabaseService } from "@/lib/supabase/database"
import { tables } from "@/lib/data-structure"
import { loadData } from "@/lib/data-persistence"

export interface MigrationResult {
  success: boolean
  migratedTables: string[]
  errors: string[]
}

export class DataMigrationService {
  private db: DatabaseService

  constructor(userId: string) {
    this.db = new DatabaseService(true) // Use client-side for migration
  }

  async migrateFromLocalStorage(userId: string): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: true,
      migratedTables: [],
      errors: [],
    }

    try {
      // Migrate each predefined table
      for (const table of tables) {
        try {
          // Check if table already exists in database
          const existingTables = await this.db.getUserTables(userId)
          const existingTable = existingTables.find((t) => t.name === table.name)

          let tableId: string

          if (!existingTable) {
            // Create the table in database
            const createdTable = await this.db.createTable(userId, {
              name: table.name,
              description: table.description,
              schema_definition: {
                fields: table.fields,
                id: table.id,
              },
            })

            if (!createdTable) {
              result.errors.push(`Failed to create table: ${table.name}`)
              continue
            }
            tableId = createdTable.id
          } else {
            tableId = existingTable.id
          }

          // Migrate data from localStorage
          const localData = loadData(table.id)
          if (localData && localData.length > 0) {
            for (const record of localData) {
              const created = await this.db.createRecord(userId, tableId, record)
              if (!created) {
                result.errors.push(`Failed to migrate record in table: ${table.name}`)
              }
            }
          }

          // Migrate dropdown options
          for (const field of table.fields) {
            if (field.type === "dropdown") {
              const optionsKey = `options_${table.id}_${field.id}`
              const savedOptions = localStorage.getItem(optionsKey)
              if (savedOptions) {
                try {
                  const options = JSON.parse(savedOptions)
                  await this.db.updateDropdownOptions(userId, tableId, field.id, options)
                } catch (e) {
                  result.errors.push(`Failed to migrate dropdown options for ${field.id}`)
                }
              }
            }
          }

          result.migratedTables.push(table.name)
        } catch (error) {
          result.errors.push(`Error migrating table ${table.name}: ${error}`)
          result.success = false
        }
      }

      return result
    } catch (error) {
      result.success = false
      result.errors.push(`Migration failed: ${error}`)
      return result
    }
  }

  async exportToLocalStorage(userId: string): Promise<boolean> {
    try {
      const userTables = await this.db.getUserTables(userId)

      for (const table of userTables) {
        // Export table records
        const records = await this.db.getTableRecords(table.id)
        const recordData = records.map((r) => r.record_data)

        // Find corresponding local table ID from schema
        const schemaId = table.schema_definition?.id || table.name.toLowerCase().replace(/\s+/g, "-")
        localStorage.setItem(`table_${schemaId}_data`, JSON.stringify(recordData))

        // Export dropdown options
        if (table.schema_definition?.fields) {
          for (const field of table.schema_definition.fields) {
            if (field.type === "dropdown") {
              const options = await this.db.getDropdownOptions(table.id, field.id)
              localStorage.setItem(`options_${schemaId}_${field.id}`, JSON.stringify(options))
            }
          }
        }
      }

      return true
    } catch (error) {
      console.error("Export to localStorage failed:", error)
      return false
    }
  }
}

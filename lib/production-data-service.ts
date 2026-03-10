import { DatabaseService } from "@/lib/supabase/database"
import { createClient } from "@/lib/supabase/client"

export class ProductionDataService {
  private db: DatabaseService
  private userId: string | null = null

  constructor() {
    this.db = new DatabaseService(true) // Client-side
    this.initUser()
  }

  private async initUser() {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    this.userId = user?.id || null
  }

  async ensureUser(): Promise<string | null> {
    if (!this.userId) {
      await this.initUser()
    }
    return this.userId
  }

  // Replace localStorage table operations
  async getTable(tableId: string) {
    const userId = await this.ensureUser()
    if (!userId) return null

    try {
      const userTables = await this.db.getUserTables(userId)
      const table = userTables.find(
        (t) => t.schema_definition?.id === tableId || t.name.toLowerCase().replace(/\s+/g, "-") === tableId,
      )

      if (!table) return null

      const records = await this.db.getTableRecords(table.id)
      const recordData = records.map((r) => r.record_data)

      const columns =
        table.schema_definition?.fields?.map((f: any) => ({
          id: f.id,
          label: f.label,
          type: f.type,
          required: f.required ?? false,
        })) ?? []

      return {
        id: tableId,
        name: table.name,
        columns,
        records: recordData,
      }
    } catch (error) {
      console.error("Error in getTable:", error)
      return null
    }
  }

  async updateTable(tableId: string, updates: { records?: any[] }): Promise<boolean> {
    const userId = await this.ensureUser()
    if (!userId) return false

    try {
      if (updates.records) {
        const userTables = await this.db.getUserTables(userId)
        const table = userTables.find(
          (t) => t.schema_definition?.id === tableId || t.name.toLowerCase().replace(/\s+/g, "-") === tableId,
        )

        if (!table) return false

        // Delete existing records
        const existingRecords = await this.db.getTableRecords(table.id)
        for (const record of existingRecords) {
          await this.db.deleteRecord(record.id)
        }

        // Create new records
        for (const recordData of updates.records) {
          await this.db.createRecord(userId, table.id, recordData)
        }
      }
      return true
    } catch (error) {
      console.error("Error in updateTable:", error)
      return false
    }
  }

  async loadData(tableId: string): Promise<any[]> {
    const table = await this.getTable(tableId)
    return table?.records || []
  }

  async saveData(tableId: string, data: any[]): Promise<boolean> {
    return await this.updateTable(tableId, { records: data })
  }

  // Dropdown options
  async getDropdownOptions(tableId: string, fieldId: string): Promise<string[]> {
    const userId = await this.ensureUser()
    if (!userId) return []

    try {
      const userTables = await this.db.getUserTables(userId)
      const table = userTables.find(
        (t) => t.schema_definition?.id === tableId || t.name.toLowerCase().replace(/\s+/g, "-") === tableId,
      )

      if (!table) return []

      return await this.db.getDropdownOptions(table.id, fieldId)
    } catch (error) {
      console.error("Error getting dropdown options:", error)
      return []
    }
  }

  async updateDropdownOptions(tableId: string, fieldId: string, options: string[]): Promise<boolean> {
    const userId = await this.ensureUser()
    if (!userId) return false

    try {
      const userTables = await this.db.getUserTables(userId)
      const table = userTables.find(
        (t) => t.schema_definition?.id === tableId || t.name.toLowerCase().replace(/\s+/g, "-") === tableId,
      )

      if (!table) return false

      return await this.db.updateDropdownOptions(userId, table.id, fieldId, options)
    } catch (error) {
      console.error("Error updating dropdown options:", error)
      return false
    }
  }
}

// Global instance
export const productionDataService = new ProductionDataService()

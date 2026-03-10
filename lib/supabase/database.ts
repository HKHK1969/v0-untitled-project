import { createClient } from "@/lib/supabase/server"
import { createClient as createBrowserClient } from "@/lib/supabase/client"

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  company_name: string | null
  role: string
  created_at: string
  updated_at: string
}

export interface CustomTable {
  id: string
  user_id: string
  name: string
  description: string | null
  table_type: string
  schema_definition: any
  created_at: string
  updated_at: string
}

export interface TableRecord {
  id: string
  table_id: string
  user_id: string
  record_data: any
  created_at: string
  updated_at: string
}

export interface DropdownOptions {
  id: string
  table_id: string
  field_id: string
  user_id: string
  options: string[]
  created_at: string
  updated_at: string
}

// Server-side database operations
export class DatabaseService {
  private supabase: any

  constructor(isClient = false) {
    if (isClient) {
      this.supabase = createBrowserClient()
    } else {
      // This will be called from server components
      this.initServerClient()
    }
  }

  private async initServerClient() {
    this.supabase = await createClient()
  }

  // Profile operations
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await this.supabase.from("profiles").select("*").eq("id", userId).single()

    if (error) {
      console.error("Error fetching profile:", error)
      return null
    }
    return data
  }

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<boolean> {
    const { error } = await this.supabase.from("profiles").update(updates).eq("id", userId)

    if (error) {
      console.error("Error updating profile:", error)
      return false
    }
    return true
  }

  // Custom table operations
  async getUserTables(userId: string): Promise<CustomTable[]> {
    const { data, error } = await this.supabase
      .from("custom_tables")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching user tables:", error)
      return []
    }
    return data || []
  }

  async createTable(
    userId: string,
    tableData: {
      name: string
      description?: string
      schema_definition: any
    },
  ): Promise<CustomTable | null> {
    const { data, error } = await this.supabase
      .from("custom_tables")
      .insert({
        user_id: userId,
        ...tableData,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating table:", error)
      return null
    }
    return data
  }

  async updateTable(tableId: string, updates: Partial<CustomTable>): Promise<boolean> {
    const { error } = await this.supabase.from("custom_tables").update(updates).eq("id", tableId)

    if (error) {
      console.error("Error updating table:", error)
      return false
    }
    return true
  }

  async deleteTable(tableId: string): Promise<boolean> {
    const { error } = await this.supabase.from("custom_tables").delete().eq("id", tableId)

    if (error) {
      console.error("Error deleting table:", error)
      return false
    }
    return true
  }

  // Table record operations
  async getTableRecords(tableId: string): Promise<TableRecord[]> {
    const { data, error } = await this.supabase
      .from("table_records")
      .select("*")
      .eq("table_id", tableId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching table records:", error)
      return []
    }
    return data || []
  }

  async createRecord(userId: string, tableId: string, recordData: any): Promise<TableRecord | null> {
    const { data, error } = await this.supabase
      .from("table_records")
      .insert({
        user_id: userId,
        table_id: tableId,
        record_data: recordData,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating record:", error)
      return null
    }
    return data
  }

  async updateRecord(recordId: string, recordData: any): Promise<boolean> {
    const { error } = await this.supabase.from("table_records").update({ record_data: recordData }).eq("id", recordId)

    if (error) {
      console.error("Error updating record:", error)
      return false
    }
    return true
  }

  async deleteRecord(recordId: string): Promise<boolean> {
    const { error } = await this.supabase.from("table_records").delete().eq("id", recordId)

    if (error) {
      console.error("Error deleting record:", error)
      return false
    }
    return true
  }

  // Dropdown options operations
  async getDropdownOptions(tableId: string, fieldId: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .from("dropdown_options")
      .select("options")
      .eq("table_id", tableId)
      .eq("field_id", fieldId)
      .single()

    if (error) {
      console.error("Error fetching dropdown options:", error)
      return []
    }
    return data?.options || []
  }

  async updateDropdownOptions(userId: string, tableId: string, fieldId: string, options: string[]): Promise<boolean> {
    const { error } = await this.supabase.from("dropdown_options").upsert({
      user_id: userId,
      table_id: tableId,
      field_id: fieldId,
      options: options,
    })

    if (error) {
      console.error("Error updating dropdown options:", error)
      return false
    }
    return true
  }
}

// Client-side database service
export const clientDb = new DatabaseService(true)

// Server-side database service factory
export const createServerDb = () => new DatabaseService(false)

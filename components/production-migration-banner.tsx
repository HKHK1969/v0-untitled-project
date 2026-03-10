"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DataMigrationService } from "@/lib/data-migration"
import { createClient } from "@/lib/supabase/client"
import { CheckCircle, AlertCircle, Upload, X } from "lucide-react"

export function ProductionMigrationBanner() {
  const [user, setUser] = useState<any>(null)
  const [hasLocalData, setHasLocalData] = useState(false)
  const [migrating, setMigrating] = useState(false)
  const [migrationComplete, setMigrationComplete] = useState(false)
  const [migrationError, setMigrationError] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
    }
    checkUser()

    // Check if there's local data to migrate
    if (typeof window !== "undefined") {
      const hasData =
        localStorage.getItem("table_suppliers_data") ||
        localStorage.getItem("table_products_data") ||
        localStorage.getItem("table_orders_data")
      setHasLocalData(!!hasData)

      // Check if migration was already completed
      const migrationCompleted = localStorage.getItem("migration_completed")
      setMigrationComplete(!!migrationCompleted)
    }
  }, [supabase])

  const handleMigration = async () => {
    if (!user) return

    setMigrating(true)
    setMigrationError(null)

    try {
      const migrationService = new DataMigrationService(user.id)
      const result = await migrationService.migrateFromLocalStorage(user.id)

      if (result.success) {
        setMigrationComplete(true)
        localStorage.setItem("migration_completed", "true")

        // Optionally clear localStorage after successful migration
        if (result.migratedTables.length > 0) {
          // Keep a backup but clear the main data
          const backupData = {
            suppliers: localStorage.getItem("table_suppliers_data"),
            products: localStorage.getItem("table_products_data"),
            orders: localStorage.getItem("table_orders_data"),
          }
          localStorage.setItem("pre_migration_backup", JSON.stringify(backupData))

          // Clear the main data
          localStorage.removeItem("table_suppliers_data")
          localStorage.removeItem("table_products_data")
          localStorage.removeItem("table_orders_data")
        }
      } else {
        setMigrationError(result.errors.join(", "))
      }
    } catch (error) {
      setMigrationError(error instanceof Error ? error.message : "Migration failed")
    } finally {
      setMigrating(false)
    }
  }

  if (!user || !hasLocalData || migrationComplete || dismissed) {
    return null
  }

  return (
    <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20 mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Migrate Your Data to the Cloud</CardTitle>
            <Badge variant="secondary">New Feature</Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setDismissed(true)} className="h-6 w-6 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          We've detected local data on your device. Migrate it to the cloud for better security, backup, and access from
          any device.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {migrationError && (
          <div className="flex items-center gap-2 text-red-600 mb-4">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{migrationError}</span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button onClick={handleMigration} disabled={migrating} className="bg-blue-600 hover:bg-blue-700">
            {migrating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Migrating...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Migrate Data
              </>
            )}
          </Button>

          <Button variant="outline" onClick={() => setDismissed(true)} disabled={migrating}>
            Maybe Later
          </Button>
        </div>

        <div className="mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-green-600" />
            Your local data will be safely backed up before migration
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

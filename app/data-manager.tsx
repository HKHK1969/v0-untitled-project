"use client"

import type React from "react"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Download, Upload, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { tables, type TableDefinition } from "@/lib/data-structure"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// Interfaces
type DataManagerPageProps = Record<string, unknown>

interface StoredData {
  [key: string]: any
}

// Constants
const STORAGE_PREFIX = "table_"
const OPTIONS_PREFIX = "options_"
const REFRESH_DELAY = 1500 // ms

export default function DataManagerPage(_props: DataManagerPageProps) {
  const [allData, setAllData] = useState<StoredData>({})
  const [exportedData, setExportedData] = useState<string>("")
  const [importData, setImportData] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isProcessing, setIsProcessing] = useState<boolean>(false) // For progress
  const [showConfirmImport, setShowConfirmImport] = useState<boolean>(false)

  // Load data from localStorage
  const loadData = useCallback(() => {
    if (typeof window === "undefined") return

    setIsLoading(true)
    const loadedData: StoredData = {}

    try {
      tables.forEach((table: TableDefinition) => {
        const key = `${STORAGE_PREFIX}${table.id}_data`
        const tableData = localStorage.getItem(key)
        if (tableData) {
          loadedData[key] = JSON.parse(tableData)
        }
      })

      tables.forEach((table: TableDefinition) => {
        table.fields.forEach((field) => {
          if (field.type === "dropdown") {
            const key = `${OPTIONS_PREFIX}${table.id}_${field.id}`
            const optionsData = localStorage.getItem(key)
            if (optionsData) {
              loadedData[key] = JSON.parse(optionsData)
            }
          }
        })
      })

      setAllData(loadedData)
    } catch (e) {
      console.error("Error loading data:", e)
      toast({
        title: "Error",
        description: "Failed to load some data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Export data to JSON
  const handleExport = useCallback(async () => {
    setIsProcessing(true)
    try {
      const dataStr = JSON.stringify(allData, null, 2)
      setExportedData(dataStr)
      toast({
        title: "Data Exported",
        description: "Your data has been exported successfully.",
        variant: "default",
      })
    } catch (e) {
      console.error("Error exporting data:", e)
      toast({
        title: "Export Failed",
        description: "An error occurred while exporting data",
        variant: "destructive",
      })
    } finally {
      setTimeout(() => setIsProcessing(false), 500) // Simulated delay
    }
  }, [allData])

  // Download exported data as a file
  const handleDownload = useCallback(() => {
    if (!exportedData) return

    try {
      const blob = new Blob([exportedData], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `data-backup-${new Date().toISOString().split("T")[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast({
        title: "Download Started",
        description: "Your data file is being downloaded.",
        variant: "default",
      })
    } catch (e) {
      console.error("Error downloading file:", e)
      toast({
        title: "Download Failed",
        description: "Failed to download the data file",
        variant: "destructive",
      })
    }
  }, [exportedData])

  // Copy exported data to clipboard
  const handleCopy = useCallback(async () => {
    if (!exportedData) return

    try {
      await navigator.clipboard.writeText(exportedData)
      toast({
        title: "Copied",
        description: "Data copied to clipboard.",
        variant: "default",
      })
    } catch (e) {
      console.error("Error copying to clipboard:", e)
      toast({
        title: "Copy Failed",
        description: "Failed to copy data to clipboard",
        variant: "destructive",
      })
    }
  }, [exportedData])

  // Handle file import
  const handleFileImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setImportData(result)
        toast({
          title: "File Loaded",
          description: "JSON data loaded from file. Click Import to proceed.",
          variant: "default",
        })
      }
      reader.onerror = () => {
        toast({
          title: "File Read Error",
          description: "Failed to read the file",
          variant: "destructive",
        })
      }
      reader.readAsText(file)
    }
  }, [])

  // Validate imported data structure
  const validateImportData = useCallback((data: any): boolean => {
    if (typeof data !== "object" || data === null) {
      throw new Error("Data must be a valid JSON object")
    }

    const validKeys = tables.flatMap((table) => [
      `${STORAGE_PREFIX}${table.id}_data`,
      ...table.fields
        .filter((field) => field.type === "dropdown")
        .map((field) => `${OPTIONS_PREFIX}${table.id}_${field.id}`),
    ])

    const invalidKeys = Object.keys(data).filter((key) => !validKeys.includes(key))
    if (invalidKeys.length > 0) {
      console.warn("Unknown keys in import data:", invalidKeys)
    }

    return true
  }, [])

  // Import data from JSON
  const handleImport = useCallback(() => {
    if (!importData.trim()) {
      toast({
        title: "Import Failed",
        description: "Please provide data to import",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      const dataObj = JSON.parse(importData)
      validateImportData(dataObj)

      Object.entries(dataObj).forEach(([key, value]) => {
        try {
          localStorage.setItem(key, JSON.stringify(value))
        } catch (e) {
          console.error(`Error saving ${key}:`, e)
        }
      })

      toast({
        title: "Data Imported",
        description: "Data restored successfully. Refreshing...",
        variant: "default",
      })

      window.dispatchEvent(new Event("storage"))
      setTimeout(() => {
        window.location.reload()
        setIsProcessing(false)
      }, REFRESH_DELAY)
    } catch (e) {
      console.error("Import error:", e)
      toast({
        title: "Import Failed",
        description: e instanceof Error ? e.message : "Invalid JSON data",
        variant: "destructive",
      })
      setIsProcessing(false)
    }
    setShowConfirmImport(false)
  }, [importData, validateImportData])

  // Memoized data size for UI
  const dataSize = useMemo(() => {
    const bytes = new Blob([JSON.stringify(allData)]).size
    return `${(bytes / 1024).toFixed(2)} KB`
  }, [allData])

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 text-center">
        <p>Loading data...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Data Manager</h1>
          <p className="text-muted-foreground">
            Backup and restore your data ({dataSize}) to prevent loss during code changes.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Export Data</CardTitle>
              <CardDescription>Export all data as JSON for backup</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleExport} className="mb-4 w-full" disabled={isLoading || isProcessing}>
                {isProcessing ? (
                  <>
                    <svg className="animate-spin mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                      <path
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        className="opacity-75"
                      />
                    </svg>
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export All Data
                  </>
                )}
              </Button>
              {exportedData && (
                <>
                  <div className="flex justify-between items-center mb-2 gap-2">
                    <span className="text-sm font-medium">Exported Data ({dataSize}):</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleCopy}>
                        <Copy className="mr-2 h-3 w-3" />
                        Copy
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleDownload}>
                        <Download className="mr-2 h-3 w-3" />
                        Download
                      </Button>
                    </div>
                  </div>
                  <Textarea value={exportedData} readOnly className="h-[300px] font-mono text-xs" />
                </>
              )}
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground">
              Save this data in a secure location for later restoration.
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Import Data</CardTitle>
              <CardDescription>Restore data from a previous JSON export</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="mb-2"
                  disabled={isProcessing}
                />
                <Textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder="Paste your exported JSON data here or use the file input above..."
                  className="h-[260px] font-mono text-xs"
                  disabled={isProcessing}
                />
              </div>
              <AlertDialog open={showConfirmImport} onOpenChange={setShowConfirmImport}>
                <AlertDialogTrigger asChild>
                  <Button className="w-full" disabled={!importData.trim() || isProcessing}>
                    {isProcessing ? (
                      <>
                        <svg className="animate-spin mr-2 h-4 w-4" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                          <path
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            className="opacity-75"
                          />
                        </svg>
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Import & Restore Data
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Import</AlertDialogTitle>
                    <AlertDialogDescription>
                      Importing this data will overwrite all existing data. Are you sure you want to proceed? Please
                      ensure you have exported your current data if you wish to keep it.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleImport}>Import</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground">
              Warning: This will overwrite existing data. Export current data first if needed.
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

// TODO: Add unit tests in a separate file (e.g., data-manager.test.tsx)
// Suggested tests:
// 1. Test data export generates valid JSON
// 2. Test data import with valid JSON
// 3. Test data import with invalid JSON
// 4. Test file download functionality
// 5. Test file upload and parsing
// 6. Test clipboard copy functionality

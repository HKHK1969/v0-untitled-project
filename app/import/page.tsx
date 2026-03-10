"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, CheckCircle, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { predefinedTables } from "@/lib/data-structure"
import { saveData, loadData } from "@/lib/data-persistence"

interface ImportPreview {
  headers: string[]
  rows: string[][]
  totalRows: number
}

export default function ImportPage() {
  const [selectedTable, setSelectedTable] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [importResult, setImportResult] = useState<{
    success: number
    errors: string[]
  } | null>(null)
  const { toast } = useToast()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith(".csv")) {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file",
        variant: "destructive",
      })
      return
    }

    setFile(selectedFile)
    parseCSV(selectedFile)
  }

  const parseCSV = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split("\n").filter((line) => line.trim())

      if (lines.length === 0) {
        toast({
          title: "Empty file",
          description: "The selected file appears to be empty",
          variant: "destructive",
        })
        return
      }

      const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
      const rows = lines.slice(1, 6).map((line) => line.split(",").map((cell) => cell.trim().replace(/"/g, "")))

      setPreview({
        headers,
        rows,
        totalRows: lines.length - 1,
      })

      // Auto-map fields with similar names
      const tableSchema = predefinedTables.find((t) => t.id === selectedTable)
      if (tableSchema) {
        const autoMapping: Record<string, string> = {}
        headers.forEach((header) => {
          const matchingField = tableSchema.fields.find(
            (field) =>
              field.name.toLowerCase().includes(header.toLowerCase()) ||
              header.toLowerCase().includes(field.name.toLowerCase()),
          )
          if (matchingField) {
            autoMapping[header] = matchingField.id
          }
        })
        setMapping(autoMapping)
      }
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!file || !selectedTable || !preview) return

    setImporting(true)
    setProgress(0)
    setImportResult(null)

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const text = e.target?.result as string
        const lines = text.split("\n").filter((line) => line.trim())
        const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))

        const existingRecords = (await loadData(`table_${selectedTable}`)) || []
        const newRecords = []
        const errors: string[] = []

        for (let i = 1; i < lines.length; i++) {
          try {
            const cells = lines[i].split(",").map((cell) => cell.trim().replace(/"/g, ""))
            const record: any = {
              id: `imported_${Date.now()}_${i}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }

            headers.forEach((header, index) => {
              const fieldId = mapping[header]
              if (fieldId && cells[index]) {
                record[fieldId] = cells[index]
              }
            })

            newRecords.push(record)
            setProgress((i / (lines.length - 1)) * 100)
          } catch (error) {
            errors.push(`Row ${i}: ${error}`)
          }
        }

        const allRecords = [...existingRecords, ...newRecords]
        await saveData(`table_${selectedTable}`, allRecords)

        setImportResult({
          success: newRecords.length,
          errors,
        })

        toast({
          title: "Import completed",
          description: `Successfully imported ${newRecords.length} records`,
        })
      }
      reader.readAsText(file)
    } catch (error) {
      toast({
        title: "Import failed",
        description: "An error occurred during import",
        variant: "destructive",
      })
    } finally {
      setImporting(false)
    }
  }

  const downloadTemplate = () => {
    const tableSchema = predefinedTables.find((t) => t.id === selectedTable)
    if (!tableSchema) return

    const headers = tableSchema.fields.map((field) => field.name)
    const csvContent = headers.join(",") + "\n"

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${tableSchema.name.toLowerCase().replace(/\s+/g, "_")}_template.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  const selectedTableSchema = predefinedTables.find((t) => t.id === selectedTable)

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Import Data</h1>
        <p className="text-muted-foreground">Import data from CSV files into your tables</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Import Configuration */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Select Table</CardTitle>
              <CardDescription>Choose the table to import data into</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Target Table</Label>
                  <Select value={selectedTable} onValueChange={setSelectedTable}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a table" />
                    </SelectTrigger>
                    <SelectContent>
                      {predefinedTables.map((table) => (
                        <SelectItem key={table.id} value={table.id}>
                          {table.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedTable && (
                  <Button onClick={downloadTemplate} variant="outline" className="w-full bg-transparent">
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Upload File</CardTitle>
              <CardDescription>Select a CSV file to import</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>CSV File</Label>
                  <div className="mt-2">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="h-8 w-8 mb-2 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">CSV files only</p>
                      </div>
                      <input type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
                    </label>
                  </div>
                  {file && (
                    <div className="mt-2 flex items-center text-sm text-green-600">
                      <FileText className="h-4 w-4 mr-2" />
                      {file.name}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {preview && selectedTableSchema && (
            <Card>
              <CardHeader>
                <CardTitle>3. Map Fields</CardTitle>
                <CardDescription>Map CSV columns to table fields</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {preview.headers.map((header) => (
                    <div key={header} className="flex items-center space-x-3">
                      <div className="w-1/3">
                        <Label className="text-sm font-medium">{header}</Label>
                      </div>
                      <div className="w-2/3">
                        <Select
                          value={mapping[header] || "skip"}
                          onValueChange={(value) => setMapping((prev) => ({ ...prev, [header]: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select field" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="skip">Skip this column</SelectItem>
                            {selectedTableSchema.fields.map((field) => (
                              <SelectItem key={field.id} value={field.id}>
                                {field.name} ({field.type})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {preview && (
            <Card>
              <CardHeader>
                <CardTitle>4. Import</CardTitle>
                <CardDescription>Start the import process</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {importing && (
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Importing...</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} />
                    </div>
                  )}

                  <Button onClick={handleImport} disabled={importing || !selectedTable || !file} className="w-full">
                    {importing ? "Importing..." : "Start Import"}
                  </Button>

                  {importResult && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Successfully imported {importResult.success} records
                        {importResult.errors.length > 0 && (
                          <div className="mt-2">
                            <p className="font-medium">Errors:</p>
                            <ul className="list-disc list-inside text-sm">
                              {importResult.errors.slice(0, 5).map((error, index) => (
                                <li key={index}>{error}</li>
                              ))}
                              {importResult.errors.length > 5 && <li>... and {importResult.errors.length - 5} more</li>}
                            </ul>
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Preview */}
        {preview && (
          <Card>
            <CardHeader>
              <CardTitle>Data Preview</CardTitle>
              <CardDescription>Showing first 5 rows of {preview.totalRows} total rows</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      {preview.headers.map((header) => (
                        <th key={header} className="text-left p-2 font-medium">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row, index) => (
                      <tr key={index} className="border-b">
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="p-2">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

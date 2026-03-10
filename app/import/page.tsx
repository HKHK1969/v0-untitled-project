"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Upload, Check, Shield, FileX, FileText, Database } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { validateFile, validateImportData, globalRateLimiter } from "@/lib/validation"
import { FileParser, ColumnMapper, type ParsedData, type ColumnMapping } from "@/lib/file-parser"

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<"success" | "error" | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [importOption, setImportOption] = useState("create-new")
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([])
  const [showPreview, setShowPreview] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const validation = validateFile(selectedFile)

      if (!validation.isValid) {
        setValidationErrors(validation.errors)
        setFile(null)
        setUploadStatus("error")
        setParsedData(null)
        setShowPreview(false)
        return
      }

      setFile(selectedFile)
      setUploadStatus(null)
      setValidationErrors([])
      setParsedData(null)
      setShowPreview(false)

      // Auto-parse the file for preview
      parseFileForPreview(selectedFile)
    }
  }

  const parseFileForPreview = async (file: File) => {
    try {
      const parsed = await FileParser.parseFile(file)
      const mappings = ColumnMapper.analyzeColumns(parsed.headers)

      setParsedData(parsed)
      setColumnMappings(mappings)
      setShowPreview(true)
    } catch (error) {
      setValidationErrors([error instanceof Error ? error.message : "Failed to parse file"])
      setUploadStatus("error")
    }
  }

  const handleUpload = async () => {
    if (!file || !parsedData) return

    const clientId = "import_" + (navigator.userAgent + Date.now()).slice(0, 32)
    if (!globalRateLimiter.isAllowed(clientId, 3, 300000)) {
      // 3 attempts per 5 minutes
      setValidationErrors(["Too many upload attempts. Please wait before trying again."])
      setUploadStatus("error")
      return
    }

    setUploading(true)
    setUploadProgress(0)
    setValidationErrors([])

    try {
      // Validate parsed data
      const contentValidation = validateImportData(parsedData)
      if (!contentValidation.isValid) {
        setValidationErrors(contentValidation.errors)
        setUploadStatus("error")
        setUploading(false)
        return
      }

      // Simulate processing steps
      const steps = [
        { message: "Validating data structure...", progress: 20 },
        { message: "Mapping columns...", progress: 40 },
        { message: "Processing records...", progress: 60 },
        { message: "Saving to database...", progress: 80 },
        { message: "Finalizing import...", progress: 100 },
      ]

      for (const step of steps) {
        await new Promise((resolve) => setTimeout(resolve, 500))
        setUploadProgress(step.progress)
      }

      // Process the validated data
      await processImportData(contentValidation.sanitizedValue, importOption, columnMappings)

      setUploading(false)
      setUploadStatus("success")
    } catch (error) {
      console.error("Import error:", error)
      setValidationErrors([error instanceof Error ? error.message : "Import failed"])
      setUploadStatus("error")
      setUploading(false)
    }
  }

  const processImportData = async (data: ParsedData, option: string, mappings: ColumnMapping[]): Promise<void> => {
    // Here you would implement the actual data processing logic
    // For now, we'll simulate the process
    console.log("Processing import data:", {
      option,
      rowCount: data.rows.length,
      columnCount: data.headers.length,
      mappings: mappings.length,
    })

    // Simulate saving to localStorage or database
    const tableId = `imported_${Date.now()}`
    const tableData = {
      id: tableId,
      name: `Imported from ${data.metadata?.fileName || "file"}`,
      columns: mappings.map((mapping) => ({
        id: mapping.mappedName,
        label: mapping.originalName,
        type: mapping.type,
        required: mapping.required,
      })),
      records: data.rows.map((row, index) => ({
        id: `row_${index}`,
        ...row,
      })),
    }

    // Save to localStorage (in a real app, this would go to a database)
    localStorage.setItem(`table_${tableId}_data`, JSON.stringify(tableData))
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-background border-b">
        <div className="container flex h-16 items-center px-4 md:px-6">
          <Link href="/" className="text-lg font-semibold">
            Apparel Supply Chain Tracker
          </Link>
          <nav className="ml-auto flex gap-4 sm:gap-6">
            <Link href="/dashboard" className="text-sm font-medium hover:underline underline-offset-4">
              Dashboard
            </Link>
            <Link href="/tables" className="text-sm font-medium hover:underline underline-offset-4">
              Tables
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6">
        <div className="mx-auto max-w-4xl grid gap-4 md:gap-8">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" asChild className="mr-2">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Import Data</h1>
          </div>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>Secure Import</AlertTitle>
            <AlertDescription>
              All uploaded files are validated and sanitized for security. Only Excel, CSV, and JSON files under 10MB
              are accepted.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Import File</CardTitle>
              <CardDescription>Upload your CSV, JSON, or Excel file to create or update tables</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="file">Data File</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="file"
                    type="file"
                    accept=".xlsx,.xls,.csv,.json"
                    onChange={handleFileChange}
                    className="flex-1"
                    disabled={uploading}
                  />
                </div>
                {file && parsedData && (
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {file.name} ({(file.size / 1024).toFixed(2)} KB)
                    </div>
                    <div className="flex items-center gap-1">
                      <Database className="h-4 w-4" />
                      {parsedData.metadata?.rowCount} rows, {parsedData.metadata?.columnCount} columns
                    </div>
                  </div>
                )}
              </div>

              {validationErrors.length > 0 && (
                <Alert variant="destructive">
                  <FileX className="h-4 w-4" />
                  <AlertTitle>Validation Error</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {uploading && (
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label>Processing and validating...</Label>
                    <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}

              {uploadStatus === "success" && (
                <Alert variant="default" className="bg-green-50 border-green-200 text-green-800">
                  <Check className="h-4 w-4" />
                  <AlertTitle>Import Successful</AlertTitle>
                  <AlertDescription>
                    Your data has been successfully imported and validated. You can now view and manage your tables.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-2">
                <Label>Import Options</Label>
                <div className="grid gap-4 p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="create-new"
                      name="import-option"
                      value="create-new"
                      checked={importOption === "create-new"}
                      onChange={(e) => setImportOption(e.target.value)}
                    />
                    <Label htmlFor="create-new" className="font-normal">
                      Create new table from file structure
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="update-existing"
                      name="import-option"
                      value="update-existing"
                      checked={importOption === "update-existing"}
                      onChange={(e) => setImportOption(e.target.value)}
                    />
                    <Label htmlFor="update-existing" className="font-normal">
                      Update existing table with file data
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="append-data"
                      name="import-option"
                      value="append-data"
                      checked={importOption === "append-data"}
                      onChange={(e) => setImportOption(e.target.value)}
                    />
                    <Label htmlFor="append-data" className="font-normal">
                      Append data to existing table
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" asChild>
                <Link href="/dashboard">Cancel</Link>
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!file || uploading || validationErrors.length > 0 || !parsedData}
              >
                <Upload className="mr-2 h-4 w-4" />
                {uploading ? "Processing..." : "Import Data"}
              </Button>
            </CardFooter>
          </Card>

          {/* Data Preview */}
          {showPreview && parsedData && (
            <Card>
              <CardHeader>
                <CardTitle>Data Preview</CardTitle>
                <CardDescription>
                  Preview of your data and column mappings. Showing first 5 rows of {parsedData.metadata?.rowCount}{" "}
                  total rows.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Column Mappings */}
                  <div>
                    <h4 className="font-medium mb-2">Column Mappings</h4>
                    <div className="grid gap-2">
                      {columnMappings.map((mapping, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{mapping.originalName}</span>
                            {mapping.required && (
                              <Badge variant="destructive" className="text-xs">
                                Required
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{mapping.type}</Badge>
                            <span className="text-sm text-muted-foreground">→ {mapping.mappedName}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Data Preview Table */}
                  <div>
                    <h4 className="font-medium mb-2">Data Preview</h4>
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {parsedData.headers.map((header, index) => (
                              <TableHead key={index}>{header}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {parsedData.rows.slice(0, 5).map((row, index) => (
                            <TableRow key={index}>
                              {parsedData.headers.map((header, cellIndex) => (
                                <TableCell key={cellIndex}>
                                  {row[header] !== null && row[header] !== undefined ? String(row[header]) : "-"}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}

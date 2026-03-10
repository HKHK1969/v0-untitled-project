"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Upload, Check, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"

export default function ImportPage() {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState(null) // 'success', 'error', null

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      setUploadStatus(null)
    }
  }

  const handleUpload = () => {
    if (!file) return

    setUploading(true)
    setUploadProgress(0)

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setUploading(false)
          setUploadStatus("success")
          return 100
        }
        return prev + 10
      })
    }, 300)
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
        <div className="mx-auto max-w-3xl grid gap-4 md:gap-8">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" asChild className="mr-2">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Import Data</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Import Excel Data</CardTitle>
              <CardDescription>Upload your Excel sheet to create or update tables in the system</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="file">Excel File</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="file"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="flex-1"
                  />
                </div>
                {file && (
                  <p className="text-sm text-muted-foreground">
                    Selected file: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>

              {uploading && (
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label>Uploading...</Label>
                    <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}

              {uploadStatus === "success" && (
                <Alert variant="default" className="bg-green-50 border-green-200 text-green-800">
                  <Check className="h-4 w-4" />
                  <AlertTitle>Upload Successful</AlertTitle>
                  <AlertDescription>
                    Your Excel data has been successfully imported. You can now view and manage your tables.
                  </AlertDescription>
                </Alert>
              )}

              {uploadStatus === "error" && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Upload Failed</AlertTitle>
                  <AlertDescription>
                    There was an error importing your Excel data. Please try again or contact support.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-2">
                <Label>Import Options</Label>
                <div className="grid gap-4 p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <input type="radio" id="create-new" name="import-option" defaultChecked />
                    <Label htmlFor="create-new" className="font-normal">
                      Create new tables from Excel structure
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="radio" id="update-existing" name="import-option" />
                    <Label htmlFor="update-existing" className="font-normal">
                      Update existing tables with Excel data
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="radio" id="append-data" name="import-option" />
                    <Label htmlFor="append-data" className="font-normal">
                      Append data to existing tables
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" asChild>
                <Link href="/dashboard">Cancel</Link>
              </Button>
              <Button onClick={handleUpload} disabled={!file || uploading}>
                <Upload className="mr-2 h-4 w-4" />
                Import Data
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Import Instructions</CardTitle>
              <CardDescription>How to prepare your Excel file for import</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="flex items-start gap-2">
                  <div className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <h3 className="font-medium">Prepare Your Excel File</h3>
                    <p className="text-sm text-muted-foreground">
                      Each sheet in your Excel file will become a table in the system. The first row should contain
                      column names.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <h3 className="font-medium">Column Formatting</h3>
                    <p className="text-sm text-muted-foreground">
                      You can specify column types by adding a suffix to the column name: _text, _number, _date, _email,
                      _phone, _select, etc. For example: "Customer Name_text" or "Order Date_date".
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div>
                    <h3 className="font-medium">Required Fields</h3>
                    <p className="text-sm text-muted-foreground">
                      Mark required fields with an asterisk (*) at the beginning of the column name. For example:
                      "*Customer ID_text".
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center shrink-0">
                    4
                  </div>
                  <div>
                    <h3 className="font-medium">Relationships</h3>
                    <p className="text-sm text-muted-foreground">
                      Define relationships between tables by using the same column names for foreign keys. The system
                      will automatically detect these relationships.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

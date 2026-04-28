"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Download, Upload, Save, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { tables } from "@/lib/data-structure"
import { toast } from "@/components/ui/use-toast"

export default function DataBackupPage() {
  const [tableData, setTableData] = useState({})
  const [actionState, setActionState] = useState({ isBackingUp: false, isRestoring: false })

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const storedData = localStorage.getItem("backupData")
      if (storedData) {
        setTableData(JSON.parse(storedData))
      }
    } catch (error) {
      console.error("Error reading localStorage:", error)
    }
  }, [])

  // Add proper TypeScript typing for event handlers
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string)
        setTableData(jsonData)
      } catch (error) {
        console.error("Invalid JSON file:", error)
        toast({
          title: "Error",
          description: "The file is not a valid JSON backup file.",
          variant: "destructive",
        })
      }
    }
    reader.onerror = () => {
      toast({
        title: "Error",
        description: "Failed to read the backup file.",
        variant: "destructive",
      })
    }
    reader.readAsText(file)
  }

  // Enhance backup function with better error handling
  const handleBackup = () => {
    setActionState({ isBackingUp: true, isRestoring: false })
    try {
      const backup: Record<string, string> = {}
      tables.forEach((table) => {
        backup[table.id] = localStorage.getItem(table.id) || ""
      })
      localStorage.setItem("backupData", JSON.stringify(backup))
      setTableData(backup)
      toast({
        title: "Success",
        description: "Backup created successfully.",
      })
    } catch (error) {
      console.error("Backup failed:", error)
      toast({
        title: "Backup Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred during backup.",
        variant: "destructive",
      })
    } finally {
      setActionState({ isBackingUp: false, isRestoring: false })
    }
  }

  const handleExport = () => {
    try {
      const json = JSON.stringify(tableData, null, 2)
      const blob = new Blob([json], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "backup.json"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Export failed:", error)
    }
  }

  // Enhance restore function with better error handling and validation
  const handleRestore = () => {
    setActionState({ isBackingUp: false, isRestoring: true })
    try {
      if (!Object.keys(tableData).length) {
        throw new Error("No backup data available to restore")
      }

      Object.keys(tableData).forEach((key) => {
        if (tableData[key]) {
          localStorage.setItem(key, tableData[key])
        }
      })

      toast({
        title: "Success",
        description: "Data restored successfully.",
      })
    } catch (error) {
      console.error("Restore failed:", error)
      toast({
        title: "Restore Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred during restore.",
        variant: "destructive",
      })
    } finally {
      setActionState({ isBackingUp: false, isRestoring: false })
    }
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
        <div className="mx-auto max-w-4xl grid gap-6">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" asChild className="mr-2">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Data Backup & Recovery</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Backup & Restore</CardTitle>
              <CardDescription>Backup your data or restore from a previous backup</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleBackup} disabled={actionState.isBackingUp}>
                  {actionState.isBackingUp ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Backing Up...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Backup Now
                    </>
                  )}
                </Button>

                <Button onClick={handleExport} disabled={!Object.keys(tableData).length} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export Backup
                </Button>
              </div>

              <div className="border-t pt-4">
                <label htmlFor="file-upload" className="block text-sm font-medium mb-2">
                  Upload backup file:
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-muted-foreground mb-4
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary file:text-primary-foreground
                    hover:file:bg-primary/90"
                />

                <Button
                  onClick={handleRestore}
                  disabled={actionState.isRestoring || !Object.keys(tableData).length}
                  variant="secondary"
                  className="w-full"
                >
                  {actionState.isRestoring ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Restoring...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Import & Restore
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Recovery Instructions</CardTitle>
              <CardDescription>Follow these steps if you&apos;re experiencing data loss</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-2">
                  <div className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <h3 className="font-medium">Create Regular Backups</h3>
                    <p className="text-sm text-muted-foreground">
                      Click the &quot;Backup Now&quot; button regularly to save your current data state.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <h3 className="font-medium">Export Your Backups</h3>
                    <p className="text-sm text-muted-foreground">
                      Use the &quot;Export Backup&quot; button to download your backup as a JSON file for safekeeping.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div>
                    <h3 className="font-medium">Restore When Needed</h3>
                    <p className="text-sm text-muted-foreground">
                      Upload your backup file and click &quot;Import &amp; Restore&quot; to recover your data.
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

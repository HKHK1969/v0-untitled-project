"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Save, Trash } from "lucide-react"
import debounce from "lodash/debounce" // Add as dependency

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getTableById, tables } from "@/lib/data-structure"

// Interfaces
interface Column {
  id: string
  label: string
  type: string
  required: boolean
}

interface TableInfo {
  name: string
  description: string
  columns: Column[]
}

interface TableSettingsPageProps {
  params: {
    tableId: string
  }
}

// Constants
const FIELD_TYPES = [
  "text",
  "number",
  "date",
  "email",
  "phone",
  "url",
  "boolean",
  "select",
  "textarea",
  "longtext",
  "currency",
  "image",
  "file",
  "dropdown",
] as const

const DEBOUNCE_DELAY = 300 // ms

export default function TableSettingsPage({ params }: TableSettingsPageProps) {
  const { tableId } = params
  const [tableInfo, setTableInfo] = useState<TableInfo | null>(null)
  const [tableName, setTableName] = useState<string>("")
  const [tableDescription, setTableDescription] = useState<string>("")
  const [columns, setColumns] = useState<Column[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false)

  // Load table data
  const loadTableData = useCallback(() => {
    setIsLoading(true)
    try {
      const tableDefinition = getTableById(tableId)
      if (tableDefinition) {
        const data: TableInfo = {
          name: tableDefinition.name,
          description: tableDefinition.description,
          columns: tableDefinition.fields.map((field) => ({
            id: field.id,
            label: field.label,
            type: field.type,
            required: field.required,
          })),
        }

        setTableInfo(data)
        setTableName(data.name)
        setTableDescription(data.description || "")
        setColumns(data.columns)
      } else {
        throw new Error("Table not found")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load table settings",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [tableId])

  useEffect(() => {
    loadTableData()
  }, [loadTableData])

  // Debounced handlers
  const debouncedSetTableName = useMemo(() => debounce((value: string) => setTableName(value), DEBOUNCE_DELAY), [])

  const debouncedSetTableDescription = useMemo(
    () => debounce((value: string) => setTableDescription(value), DEBOUNCE_DELAY),
    [],
  )

  const addColumn = useCallback(() => {
    const newId = `column_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    setColumns((prev) => [...prev, { id: newId, label: "", type: "text", required: false }])
  }, [])

  const removeColumn = useCallback((columnId: string) => {
    setColumns((prev) => prev.filter((column) => column.id !== columnId))
  }, [])

  const updateColumn = useCallback(
    (columnId: string, key: keyof Column, value: string | boolean) => {
      if (key === "id") {
        const idExists = columns.some((col) => col.id === value && col.id !== columnId)
        if (idExists) {
          toast({
            title: "Error",
            description: "Column ID must be unique",
            variant: "destructive",
          })
          return
        }
      }
      setColumns((prev) => prev.map((column) => (column.id === columnId ? { ...column, [key]: value } : column)))
    },
    [columns],
  )

  const validateForm = useCallback((): boolean => {
    if (!tableName.trim()) {
      toast({
        title: "Validation Error",
        description: "Table name is required",
        variant: "destructive",
      })
      return false
    }
    if (columns.length === 0) {
      toast({
        title: "Validation Error",
        description: "At least one column is required",
        variant: "destructive",
      })
      return false
    }

    // Check for empty column labels
    const emptyLabels = columns.some((col) => !col.label.trim())
    if (emptyLabels) {
      toast({
        title: "Validation Error",
        description: "All columns must have labels",
        variant: "destructive",
      })
      return false
    }

    return true
  }, [tableName, columns])

  const handleSave = useCallback(async () => {
    if (!validateForm()) return

    setIsSaving(true)
    setSaveSuccess(false)

    try {
      const updatedTableInfo: TableInfo = {
        name: tableName,
        description: tableDescription,
        columns: columns.map((col) => ({
          ...col,
          label: col.label.trim() || "Unnamed Field",
        })),
      }

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800))

      // In production, save to API or persistent storage
      console.log("Saving table settings:", updatedTableInfo)

      // Update local sample data (for demo purposes)
      tables[tableId] = updatedTableInfo

      setSaveSuccess(true)
      toast({
        title: "Success",
        description: "Table settings saved successfully",
        variant: "default",
      })

      // Reset success message after delay
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save table settings",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }, [tableName, tableDescription, columns, validateForm, tableId])

  const handleDeleteTable = useCallback(() => {
    // In a real app, this would show a confirmation dialog
    if (window.confirm(`Are you sure you want to delete the "${tableName}" table? This action cannot be undone.`)) {
      // Simulate API call
      toast({
        title: "Table Deleted",
        description: "The table has been deleted successfully",
        variant: "default",
      })
      // Redirect to tables list
      window.location.href = "/tables"
    }
  }, [tableName])

  if (isLoading) {
    return <div className="p-8 text-center">Loading table settings...</div>
  }

  if (!tableInfo) {
    return <div className="p-8 text-center">Table not found</div>
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
              <Link href={`/tables/${tableId}`}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">{tableInfo.name} Settings</h1>
          </div>

          {saveSuccess && (
            <Alert className="bg-green-50 border-green-200 text-green-800">
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>Your changes have been saved successfully.</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="fields">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="fields">Fields</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>Manage basic table settings</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Table Name</Label>
                    <Input id="name" defaultValue={tableName} onChange={(e) => debouncedSetTableName(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      defaultValue={tableDescription}
                      onChange={(e) => debouncedSetTableDescription(e.target.value)}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" asChild>
                    <Link href={`/tables/${tableId}`}>Cancel</Link>
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="fields" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Fields</CardTitle>
                  <CardDescription>Manage table fields</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                  {columns.map((column) => (
                    <div key={column.id} className="grid gap-4 p-4 border rounded-lg relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => removeColumn(column.id)}
                        disabled={column.id === "name" || column.id === "email"}
                      >
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">Remove field</span>
                      </Button>
                      <div className="grid gap-2">
                        <Label htmlFor={`field-id-${column.id}`}>Field ID</Label>
                        <Input
                          id={`field-id-${column.id}`}
                          value={column.id}
                          disabled={column.id === "name" || column.id === "email"} // Prevent changing critical fields
                          onChange={(e) => updateColumn(column.id, "id", e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor={`field-label-${column.id}`}>Field Label</Label>
                        <Input
                          id={`field-label-${column.id}`}
                          value={column.label}
                          onChange={(e) => updateColumn(column.id, "label", e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor={`field-type-${column.id}`}>Field Type</Label>
                        <Select value={column.type} onValueChange={(value) => updateColumn(column.id, "type", value)}>
                          <SelectTrigger id={`field-type-${column.id}`}>
                            <SelectValue placeholder="Select field type" />
                          </SelectTrigger>
                          <SelectContent>
                            {FIELD_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`field-required-${column.id}`}
                          checked={column.required}
                          onCheckedChange={(checked) => updateColumn(column.id, "required", checked)}
                        />
                        <Label htmlFor={`field-required-${column.id}`}>Required Field</Label>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" onClick={addColumn}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Field
                  </Button>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" asChild>
                    <Link href={`/tables/${tableId}`}>Cancel</Link>
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="advanced" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Advanced Settings</CardTitle>
                  <CardDescription>Configure advanced table settings</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="flex items-center gap-2">
                    <Switch id="enable-history" />
                    <Label htmlFor="enable-history">Enable Change History</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="enable-comments" />
                    <Label htmlFor="enable-comments">Enable Comments</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="enable-attachments" />
                    <Label htmlFor="enable-attachments">Enable Attachments</Label>
                  </div>
                  <div className="grid gap-2 pt-4">
                    <Label htmlFor="permissions">Permissions</Label>
                    <Select defaultValue="all">
                      <SelectTrigger id="permissions">
                        <SelectValue placeholder="Select permissions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Everyone can edit</SelectItem>
                        <SelectItem value="readonly">Everyone can view, only admins can edit</SelectItem>
                        <SelectItem value="restricted">Only specific users can access</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="destructive" onClick={handleDeleteTable}>
                    <Trash className="mr-2 h-4 w-4" />
                    Delete Table
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

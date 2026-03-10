"use client"

import { useState, useCallback, useMemo } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Trash } from "lucide-react"
import debounce from "lodash/debounce" // Add as dependency

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

// Interfaces
interface Field {
  id: number
  name: string
  type: string
  required: boolean
}

type FieldType =
  | "text"
  | "number"
  | "date"
  | "email"
  | "phone"
  | "url"
  | "boolean"
  | "select"
  | "textarea"
  | "longtext"
  | "currency"
  | "image"
  | "file"
  | "dropdown"

// Constants
const FIELD_TYPES: FieldType[] = [
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
]
const DEBOUNCE_DELAY = 300 // ms

export default function CreateTablePage() {
  const [fields, setFields] = useState<Field[]>([{ id: 1, name: "", type: "text", required: false }])
  const [tableName, setTableName] = useState<string>("")
  const [tableDescription, setTableDescription] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // Debounced setters
  const debouncedSetTableName = useMemo(() => debounce((value: string) => setTableName(value), DEBOUNCE_DELAY), [])

  const debouncedSetTableDescription = useMemo(
    () => debounce((value: string) => setTableDescription(value), DEBOUNCE_DELAY),
    [],
  )

  const addField = useCallback(() => {
    const newId = fields.length > 0 ? Math.max(...fields.map((f) => f.id)) + 1 : 1
    setFields((prev) => [...prev, { id: newId, name: "", type: "text", required: false }])
  }, [fields])

  const removeField = useCallback((id: number) => {
    setFields((prev) => prev.filter((field) => field.id !== id))
  }, [])

  const updateField = useCallback((id: number, key: keyof Field, value: string | boolean) => {
    setFields((prev) => prev.map((field) => (field.id === id ? { ...field, [key]: value } : field)))
  }, [])

  const validateForm = useCallback((): boolean => {
    if (!tableName.trim()) {
      toast({
        title: "Validation Error",
        description: "Table name is required",
        variant: "destructive",
      })
      return false
    }

    if (fields.length === 0) {
      toast({
        title: "Validation Error",
        description: "At least one field is required",
        variant: "destructive",
      })
      return false
    }

    const invalidFields = fields.filter((f) => !f.name.trim())
    if (invalidFields.length > 0) {
      toast({
        title: "Validation Error",
        description: "All fields must have a name",
        variant: "destructive",
      })
      return false
    }

    const duplicateNames = fields.some((f, i) =>
      fields.some((other, j) => i !== j && f.name.trim() === other.name.trim() && f.name.trim() !== ""),
    )
    if (duplicateNames) {
      toast({
        title: "Validation Error",
        description: "Field names must be unique",
        variant: "destructive",
      })
      return false
    }

    return true
  }, [tableName, fields])

  const handleCreateTable = useCallback(async () => {
    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      // Create a table ID from the name (lowercase, spaces to underscores)
      const tableId = tableName.trim().toLowerCase().replace(/\s+/g, "_")

      const tableData = {
        id: tableId,
        name: tableName.trim(),
        description: tableDescription.trim(),
        fields: fields.map((field) => ({
          id: field.name.toLowerCase().replace(/\s+/g, "_"),
          label: field.name,
          type: field.type,
          required: field.required,
        })),
      }

      // In a real app, this would be an API call
      console.log("Creating table:", tableData)

      // For demo purposes, store in localStorage
      const existingTables = localStorage.getItem("tables")
      const tables = existingTables ? JSON.parse(existingTables) : []
      tables.push(tableData)
      localStorage.setItem("tables", JSON.stringify(tables))

      // Create empty data array for the new table
      localStorage.setItem(`table_${tableId}_data`, JSON.stringify([]))

      toast({
        title: "Success",
        description: "Table created successfully",
        variant: "default",
      })

      // Redirect to tables list after a short delay
      setTimeout(() => {
        window.location.href = "/tables"
      }, 1500)
    } catch (error) {
      console.error("Error creating table:", error)
      toast({
        title: "Error",
        description: "Failed to create table",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [tableName, tableDescription, fields, validateForm])

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
              <Link href="/tables">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Create New Table</h1>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Table Information</CardTitle>
              <CardDescription>Define the basic information for your new table</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Table Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Customers, Products, Orders"
                  value={tableName}
                  onChange={(e) => debouncedSetTableName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Describe the purpose of this table"
                  value={tableDescription}
                  onChange={(e) => debouncedSetTableDescription(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Table Fields</CardTitle>
              <CardDescription>Define the fields (columns) for your table</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              {fields.map((field) => (
                <div key={field.id} className="grid gap-4 p-4 border rounded-lg relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => removeField(field.id)}
                    disabled={fields.length === 1} // Prevent removing the last field
                  >
                    <Trash className="h-4 w-4" />
                    <span className="sr-only">Remove field</span>
                  </Button>
                  <div className="grid gap-2">
                    <Label htmlFor={`field-name-${field.id}`}>Field Name</Label>
                    <Input
                      id={`field-name-${field.id}`}
                      placeholder="e.g. first_name, email, phone_number"
                      value={field.name}
                      onChange={(e) => updateField(field.id, "name", e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`field-type-${field.id}`}>Field Type</Label>
                    <Select value={field.type} onValueChange={(value) => updateField(field.id, "type", value)}>
                      <SelectTrigger id={`field-type-${field.id}`}>
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
                      id={`field-required-${field.id}`}
                      checked={field.required}
                      onCheckedChange={(checked) => updateField(field.id, "required", checked)}
                    />
                    <Label htmlFor={`field-required-${field.id}`}>Required Field</Label>
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={addField}>
                <Plus className="mr-2 h-4 w-4" />
                Add Field
              </Button>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" asChild>
                <Link href="/tables">Cancel</Link>
              </Button>
              <Button onClick={handleCreateTable} disabled={isSubmitting}>
                {isSubmitting ? (
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
                    Creating...
                  </>
                ) : (
                  "Create Table"
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  )
}

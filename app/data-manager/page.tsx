"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, Download, Upload, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { predefinedTables, type TableSchema, type TableField } from "@/lib/data-structure"
import { saveData, loadData } from "@/lib/data-persistence"

const fieldTypes = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "boolean", label: "Boolean" },
  { value: "select", label: "Select" },
  { value: "multiselect", label: "Multi-select" },
  { value: "currency", label: "Currency" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "url", label: "URL" },
  { value: "textarea", label: "Textarea" },
  { value: "relationship", label: "Relationship" },
]

export default function DataManagerPage() {
  const [tables, setTables] = useState<TableSchema[]>([])
  const [selectedTable, setSelectedTable] = useState<TableSchema | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editingField, setEditingField] = useState<TableField | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadTables()
  }, [])

  const loadTables = async () => {
    try {
      const savedTables = await loadData("tables")
      if (savedTables && savedTables.length > 0) {
        setTables(savedTables)
      } else {
        setTables(predefinedTables)
        await saveData("tables", predefinedTables)
      }
    } catch (error) {
      console.error("Error loading tables:", error)
      setTables(predefinedTables)
    }
  }

  const saveTables = async (updatedTables: TableSchema[]) => {
    try {
      await saveData("tables", updatedTables)
      setTables(updatedTables)
      toast({
        title: "Success",
        description: "Tables saved successfully",
      })
    } catch (error) {
      console.error("Error saving tables:", error)
      toast({
        title: "Error",
        description: "Failed to save tables",
        variant: "destructive",
      })
    }
  }

  const createNewTable = () => {
    const newTable: TableSchema = {
      id: `table_${Date.now()}`,
      name: "New Table",
      description: "",
      fields: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setSelectedTable(newTable)
    setIsEditing(true)
  }

  const saveTable = async () => {
    if (!selectedTable) return

    const updatedTables = tables.find((t) => t.id === selectedTable.id)
      ? tables.map((t) => (t.id === selectedTable.id ? { ...selectedTable, updatedAt: new Date().toISOString() } : t))
      : [...tables, selectedTable]

    await saveTables(updatedTables)
    setIsEditing(false)
  }

  const deleteTable = async (tableId: string) => {
    const updatedTables = tables.filter((t) => t.id !== tableId)
    await saveTables(updatedTables)
    if (selectedTable?.id === tableId) {
      setSelectedTable(null)
    }
  }

  const addField = () => {
    if (!selectedTable) return

    const newField: TableField = {
      id: `field_${Date.now()}`,
      name: "New Field",
      type: "text",
      required: false,
    }

    setSelectedTable({
      ...selectedTable,
      fields: [...selectedTable.fields, newField],
    })
  }

  const updateField = (fieldId: string, updates: Partial<TableField>) => {
    if (!selectedTable) return

    setSelectedTable({
      ...selectedTable,
      fields: selectedTable.fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)),
    })
  }

  const deleteField = (fieldId: string) => {
    if (!selectedTable) return

    setSelectedTable({
      ...selectedTable,
      fields: selectedTable.fields.filter((f) => f.id !== fieldId),
    })
  }

  const exportData = () => {
    const dataStr = JSON.stringify(tables, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)
    const exportFileDefaultName = "table-schemas.json"
    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const importedTables = JSON.parse(e.target?.result as string)
        await saveTables(importedTables)
        toast({
          title: "Success",
          description: "Tables imported successfully",
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to import tables",
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Data Manager</h1>
          <p className="text-muted-foreground">Manage your table schemas and data structures</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportData} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <label>
            <Button variant="outline" asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </span>
            </Button>
            <input type="file" accept=".json" onChange={importData} className="hidden" />
          </label>
          <Button onClick={createNewTable}>
            <Plus className="h-4 w-4 mr-2" />
            New Table
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tables List */}
        <Card>
          <CardHeader>
            <CardTitle>Tables</CardTitle>
            <CardDescription>Select a table to view or edit</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tables.map((table) => (
                <div
                  key={table.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedTable?.id === table.id ? "bg-primary/10 border-primary" : "hover:bg-muted"
                  }`}
                  onClick={() => {
                    setSelectedTable(table)
                    setIsEditing(false)
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{table.name}</h3>
                      <p className="text-sm text-muted-foreground">{table.fields.length} fields</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteTable(table.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Table Details */}
        {selectedTable && (
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>
                      {isEditing ? (
                        <Input
                          value={selectedTable.name}
                          onChange={(e) =>
                            setSelectedTable({
                              ...selectedTable,
                              name: e.target.value,
                            })
                          }
                          className="text-xl font-bold"
                        />
                      ) : (
                        selectedTable.name
                      )}
                    </CardTitle>
                    <CardDescription>
                      {isEditing ? (
                        <Textarea
                          value={selectedTable.description || ""}
                          onChange={(e) =>
                            setSelectedTable({
                              ...selectedTable,
                              description: e.target.value,
                            })
                          }
                          placeholder="Table description..."
                        />
                      ) : (
                        selectedTable.description || "No description"
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <Button onClick={saveTable}>Save</Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsEditing(false)
                            setEditingField(null)
                          }}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button onClick={() => setIsEditing(true)}>Edit</Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Fields</h3>
                    {isEditing && (
                      <Button size="sm" onClick={addField}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Field
                      </Button>
                    )}
                  </div>

                  {selectedTable.fields.length === 0 ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>No fields defined. Add some fields to get started.</AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-3">
                      {selectedTable.fields.map((field) => (
                        <div key={field.id} className="p-4 border rounded-lg space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label>Field Name</Label>
                                  {isEditing ? (
                                    <Input
                                      value={field.name}
                                      onChange={(e) => updateField(field.id, { name: e.target.value })}
                                    />
                                  ) : (
                                    <p className="font-medium">{field.name}</p>
                                  )}
                                </div>
                                <div>
                                  <Label>Type</Label>
                                  {isEditing ? (
                                    <Select
                                      value={field.type}
                                      onValueChange={(value) => updateField(field.id, { type: value as any })}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {fieldTypes.map((type) => (
                                          <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <Badge variant="secondary">{field.type}</Badge>
                                  )}
                                </div>
                              </div>

                              {(field.type === "select" || field.type === "multiselect") && (
                                <div>
                                  <Label>Options</Label>
                                  {isEditing ? (
                                    <Textarea
                                      value={field.options?.join("\n") || ""}
                                      onChange={(e) =>
                                        updateField(field.id, {
                                          options: e.target.value.split("\n").filter(Boolean),
                                        })
                                      }
                                      placeholder="Enter options, one per line"
                                    />
                                  ) : (
                                    <div className="flex flex-wrap gap-1">
                                      {field.options?.map((option, index) => (
                                        <Badge key={index} variant="outline">
                                          {option}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              {field.type === "relationship" && (
                                <div>
                                  <Label>Relationship Configuration</Label>
                                  {isEditing ? (
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <Label>Target Table</Label>
                                        <Select
                                          value={field.relationshipConfig?.targetTable || ""}
                                          onValueChange={(value) =>
                                            updateField(field.id, {
                                              relationshipConfig: {
                                                ...field.relationshipConfig,
                                                targetTable: value,
                                              },
                                            })
                                          }
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select table" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {tables.map((table) => (
                                              <SelectItem key={table.id} value={table.id}>
                                                {table.name}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div>
                                        <Label>Display Field</Label>
                                        <Input
                                          value={field.relationshipConfig?.displayField || ""}
                                          onChange={(e) =>
                                            updateField(field.id, {
                                              relationshipConfig: {
                                                ...field.relationshipConfig,
                                                displayField: e.target.value,
                                              },
                                            })
                                          }
                                          placeholder="Field to display"
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-sm text-muted-foreground">
                                      {field.relationshipConfig?.targetTable} → {field.relationshipConfig?.displayField}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>

                            {isEditing && (
                              <Button size="sm" variant="ghost" onClick={() => deleteField(field.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>

                          {isEditing && (
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`required-${field.id}`}
                                checked={field.required || false}
                                onChange={(e) => updateField(field.id, { required: e.target.checked })}
                              />
                              <Label htmlFor={`required-${field.id}`}>Required</Label>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

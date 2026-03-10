"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trash2, Plus, Save, ArrowLeft, AlertTriangle } from "lucide-react"
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

export default function TableSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const tableId = params.tableId as string
  const [schema, setSchema] = useState<TableSchema | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadTableSchema()
  }, [tableId])

  const loadTableSchema = async () => {
    try {
      const savedTables = (await loadData("tables")) || predefinedTables
      const tableSchema = savedTables.find((t: TableSchema) => t.id === tableId)

      if (tableSchema) {
        setSchema(tableSchema)
      } else {
        toast({
          title: "Table not found",
          description: "The requested table could not be found",
          variant: "destructive",
        })
        router.push("/tables")
      }
    } catch (error) {
      console.error("Error loading table schema:", error)
      toast({
        title: "Error",
        description: "Failed to load table schema",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const saveSchema = async () => {
    if (!schema) return

    setSaving(true)
    try {
      const savedTables = (await loadData("tables")) || predefinedTables
      const updatedTables = savedTables.map((t: TableSchema) =>
        t.id === schema.id ? { ...schema, updatedAt: new Date().toISOString() } : t,
      )

      await saveData("tables", updatedTables)
      setHasChanges(false)

      toast({
        title: "Success",
        description: "Table schema saved successfully",
      })
    } catch (error) {
      console.error("Error saving schema:", error)
      toast({
        title: "Error",
        description: "Failed to save table schema",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const updateSchema = (updates: Partial<TableSchema>) => {
    if (!schema) return
    setSchema({ ...schema, ...updates })
    setHasChanges(true)
  }

  const addField = () => {
    if (!schema) return

    const newField: TableField = {
      id: `field_${Date.now()}`,
      name: "New Field",
      type: "text",
      required: false,
    }

    updateSchema({
      fields: [...schema.fields, newField],
    })
  }

  const updateField = (fieldId: string, updates: Partial<TableField>) => {
    if (!schema) return

    updateSchema({
      fields: schema.fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)),
    })
  }

  const deleteField = (fieldId: string) => {
    if (!schema) return

    updateSchema({
      fields: schema.fields.filter((f) => f.id !== fieldId),
    })
  }

  const moveField = (fieldId: string, direction: "up" | "down") => {
    if (!schema) return

    const fields = [...schema.fields]
    const index = fields.findIndex((f) => f.id === fieldId)

    if (index === -1) return

    const newIndex = direction === "up" ? index - 1 : index + 1

    if (newIndex < 0 || newIndex >= fields.length) return
    ;[fields[index], fields[newIndex]] = [fields[newIndex], fields[index]]

    updateSchema({ fields })
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!schema) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Table schema not found. Please check the URL and try again.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/tables/${tableId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Table
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Table Settings</h1>
            <p className="text-muted-foreground">Configure {schema.name} schema and fields</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button onClick={saveSchema} disabled={!hasChanges || saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Configure table name and description</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="table-name">Table Name</Label>
              <Input id="table-name" value={schema.name} onChange={(e) => updateSchema({ name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="table-description">Description</Label>
              <Textarea
                id="table-description"
                value={schema.description || ""}
                onChange={(e) => updateSchema({ description: e.target.value })}
                placeholder="Describe what this table is used for..."
              />
            </div>
            <Separator />
            <div className="text-sm text-muted-foreground">
              <p>
                Table ID: <code className="bg-muted px-1 rounded">{schema.id}</code>
              </p>
              <p>Created: {new Date(schema.createdAt).toLocaleDateString()}</p>
              <p>Updated: {new Date(schema.updatedAt).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Fields Configuration */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Fields</CardTitle>
                  <CardDescription>Configure table fields and their properties</CardDescription>
                </div>
                <Button onClick={addField}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Field
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {schema.fields.length === 0 ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>No fields configured. Add some fields to get started.</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {schema.fields.map((field, index) => (
                    <Card key={field.id} className="p-4">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{index + 1}</Badge>
                            <h4 className="font-medium">{field.name}</h4>
                            <Badge variant="secondary">{field.type}</Badge>
                            {field.required && <Badge variant="destructive">Required</Badge>}
                          </div>
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => moveField(field.id, "up")}
                              disabled={index === 0}
                            >
                              ↑
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => moveField(field.id, "down")}
                              disabled={index === schema.fields.length - 1}
                            >
                              ↓
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => deleteField(field.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Field Name</Label>
                            <Input
                              value={field.name}
                              onChange={(e) => updateField(field.id, { name: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Field Type</Label>
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
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`required-${field.id}`}
                            checked={field.required || false}
                            onCheckedChange={(checked) => updateField(field.id, { required: checked })}
                          />
                          <Label htmlFor={`required-${field.id}`}>Required field</Label>
                        </div>

                        {(field.type === "select" || field.type === "multiselect") && (
                          <div>
                            <Label>Options (one per line)</Label>
                            <Textarea
                              value={field.options?.join("\n") || ""}
                              onChange={(e) =>
                                updateField(field.id, {
                                  options: e.target.value.split("\n").filter(Boolean),
                                })
                              }
                              placeholder="Option 1&#10;Option 2&#10;Option 3"
                              rows={4}
                            />
                          </div>
                        )}

                        {field.type === "relationship" && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                  {predefinedTables.map((table) => (
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
                        )}

                        {field.validation && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {field.type === "number" && (
                              <>
                                <div>
                                  <Label>Minimum Value</Label>
                                  <Input
                                    type="number"
                                    value={field.validation.min || ""}
                                    onChange={(e) =>
                                      updateField(field.id, {
                                        validation: {
                                          ...field.validation,
                                          min: e.target.value ? Number(e.target.value) : undefined,
                                        },
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <Label>Maximum Value</Label>
                                  <Input
                                    type="number"
                                    value={field.validation.max || ""}
                                    onChange={(e) =>
                                      updateField(field.id, {
                                        validation: {
                                          ...field.validation,
                                          max: e.target.value ? Number(e.target.value) : undefined,
                                        },
                                      })
                                    }
                                  />
                                </div>
                              </>
                            )}
                            <div>
                              <Label>Validation Message</Label>
                              <Input
                                value={field.validation.message || ""}
                                onChange={(e) =>
                                  updateField(field.id, {
                                    validation: {
                                      ...field.validation,
                                      message: e.target.value,
                                    },
                                  })
                                }
                                placeholder="Custom error message"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

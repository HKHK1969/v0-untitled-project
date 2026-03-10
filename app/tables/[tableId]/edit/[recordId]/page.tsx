"use client"

import type React from "react"

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { ArrowLeft, Save, Check, Plus, X, Bug, AlertCircle, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import debounce from "lodash/debounce" // Add lodash as dependency
import { format } from "date-fns"
import { toast } from "sonner" // Import toast from sonner instead

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { getTableById, type Field, type TableDefinition } from "@/lib/data-structure"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { RelationshipSelect } from "@/components/relationship-select"

// First, import the currency utilities at the top of the file
import { getCurrencySymbol } from "@/lib/currency-utils"

// Import the CurrencySelector component at the top of the file
import { CurrencySelector } from "@/components/currency-selector"

// Import performance utilities
import { MemoryManager } from "@/lib/performance-utils"

// Interfaces
interface FormData {
  [key: string]: string | string[] | File | boolean | number | null
}

interface DebugInfo {
  [key: string]: {
    value: any
    type: string
    isArray: boolean
    isObject: boolean
    stringified: string
  }
}

interface EditRecordPageProps {
  params: {
    tableId: string
    recordId: string
  }
}

// Constants
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_MULTI_VALUES = 100
const DEBOUNCE_DELAY = 300 // ms

// Helper function with type safety
function safeToString(value: unknown): string {
  if (value == null) return ""
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)

  if (typeof value === "object") {
    try {
      if (value instanceof Date) return value.toISOString()
      if (value instanceof File) return value.name
      if (Array.isArray(value)) return value.map(safeToString).join(", ")
      return JSON.stringify(value)
    } catch (e) {
      console.error("Failed to stringify object:", e)
      return ""
    }
  }
  return String(value)
}

export default function EditRecordPage({ params }: EditRecordPageProps) {
  const { tableId, recordId } = params
  const router = useRouter()
  const tableDefinition: TableDefinition | undefined = getTableById(tableId)

  // State with types
  const [formData, setFormData] = useState<FormData>({})
  const [originalRecord, setOriginalRecord] = useState<FormData | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [isSuccess, setIsSuccess] = useState<boolean>(false)
  const [errors, setErrors] = useState<Record<string, string | null>>({})
  const [debugMode, setDebugMode] = useState<boolean>(false)
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({})
  const [recordNotFound, setRecordNotFound] = useState<boolean>(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageDataUrls, setImageDataUrls] = useState<Record<string, string>>({})

  const [newBrand, setNewBrand] = useState<string>("")
  const [newContact, setNewContact] = useState<string>("")
  const [newEmail, setNewEmail] = useState<string>("")
  const [newLocation, setNewLocation] = useState<string>("")
  const [customOptions, setCustomOptions] = useState<Record<string, string[]>>({})

  // Memoized initial data loader
  const initializeFormData = useCallback(() => {
    if (!tableDefinition) return

    const initialData: FormData = {}
    const initialOptions: Record<string, string[]> = {}

    tableDefinition.fields.forEach((field) => {
      if (["brands", "keyContactPersons", "emails", "shipToLocations"].includes(field.id)) {
        initialData[field.id] = []
      } else {
        initialData[field.id] = field.defaultValue ?? ""
      }

      if (field.type === "dropdown") {
        try {
          const savedOptions = localStorage.getItem(`options_${tableId}_${field.id}`)
          initialOptions[field.id] = savedOptions ? JSON.parse(savedOptions) : field.options || []
        } catch (e) {
          console.error("Error loading saved options:", e)
          initialOptions[field.id] = field.options || []
        }
      }
    })

    setFormData(initialData)
    setCustomOptions(initialOptions)
    loadRecordData(recordId)
  }, [tableId, tableDefinition, recordId])

  useEffect(() => {
    initializeFormData()
  }, [initializeFormData])

  const loadRecordData = useCallback(
    (recId: string) => {
      if (typeof window === "undefined") return

      try {
        const savedData = localStorage.getItem(`table_${tableId}_data`)
        if (!savedData) {
          setRecordNotFound(true)
          return
        }

        const tableData = JSON.parse(savedData)
        const record = tableData.find((r: any) => r.id === recId)

        if (record) {
          setOriginalRecord(record)
          setFormData({ ...record, dateCreated: record.dateCreated || new Date().toISOString() })
        } else {
          const index = Number.parseInt(recId, 10)
          if (!isNaN(index) && index >= 0 && index < tableData.length) {
            const updatedRecord = {
              ...tableData[index],
              dateCreated: tableData[index].dateCreated || new Date().toISOString(),
            }
            setOriginalRecord(tableData[index])
            setFormData(updatedRecord)
          } else {
            setRecordNotFound(true)
            toast.error("Record not found", {
              description: "The record you're trying to edit could not be found.",
            })
          }
        }
      } catch (e) {
        console.error("Error loading record data:", e)
        toast.error("Error loading record", {
          description: "Failed to load record data.",
        })
        setRecordNotFound(true)
      }
    },
    [tableId],
  )

  // Debounced input handler
  const debouncedHandleInputChange = useMemo(
    () =>
      debounce((fieldId: string, value: any) => {
        if (value instanceof File) {
          if (value.size > MAX_FILE_SIZE) {
            setErrors((prev) => ({ ...prev, [fieldId]: "File size exceeds 5MB limit" }))
            return
          }

          if (fieldId === "images" || fieldId.includes("image")) {
            const reader = new FileReader()
            reader.onload = (e) => {
              const dataUrl = e.target?.result as string
              setImagePreview(dataUrl)
              // Store the data URL in state
              setImageDataUrls((prev) => ({ ...prev, [fieldId]: dataUrl }))
              // Update formData with the data URL
              setFormData((prev) => ({ ...prev, [fieldId]: dataUrl }))
            }
            reader.onerror = () =>
              toast.error("Error", {
                description: "Failed to preview image",
              })
            reader.readAsDataURL(value)
          } else {
            setFormData((prev) => ({ ...prev, [fieldId]: value }))
          }
        } else {
          const processedValue = typeof value === "object" && value !== null ? safeToString(value) : value
          setFormData((prev) => {
            const newData = { ...prev, [fieldId]: processedValue }

            if (fieldId === "styleCode" && ["sampleOrders", "priceQuotes"].includes(tableId)) {
              try {
                const savedData = localStorage.getItem(`table_styles_data`)
                if (savedData) {
                  const stylesData = JSON.parse(savedData)
                  const selectedStyle = stylesData.find((style: any) => style.styleCode === value)
                  if (selectedStyle) {
                    newData.brand = selectedStyle.brand || ""
                    newData.styleDescription = selectedStyle.styleDescription || ""
                    if (tableId === "priceQuotes") {
                      newData.supplier = selectedStyle.supplier || ""
                      newData.targetPrice = selectedStyle.targetPrice || ""
                    }
                  }
                }
              } catch (e) {
                console.error("Error auto-populating style data:", e)
              }
            }
            return newData
          })
        }
        setErrors((prev) => ({ ...prev, [fieldId]: null }))
      }, DEBOUNCE_DELAY),
    [tableId],
  )

  const handleInputChange = useCallback(
    (fieldId: string, value: any) => {
      debouncedHandleInputChange(fieldId, value)
    },
    [debouncedHandleInputChange],
  )

  const addMultiValue = useCallback(
    (fieldId: string, value: string, setValue: (val: string) => void) => {
      if (!value.trim()) return

      if ((formData[fieldId] as string[])?.length >= MAX_MULTI_VALUES) {
        toast.error("Maximum limit reached", {
          description: `Maximum of ${MAX_MULTI_VALUES} items allowed.`,
        })
        return
      }

      setFormData((prev) => ({
        ...prev,
        [fieldId]: [...((prev[fieldId] as string[]) || []), value.trim()],
      }))
      setValue("")
      setErrors((prev) => ({ ...prev, [fieldId]: null }))
    },
    [formData],
  )

  const removeMultiValue = useCallback((fieldId: string, index: number) => {
    setFormData((prev) => {
      const currentValues = [...((prev[fieldId] as string[]) || [])]
      currentValues.splice(index, 1)
      return { ...prev, [fieldId]: currentValues }
    })
  }, [])

  const addCustomOption = useCallback(
    (fieldId: string, newOption: string) => {
      if (!newOption.trim()) return

      setCustomOptions((prev) => {
        const updatedOptions = [...(prev[fieldId] || []), newOption.trim()]

        // Save to localStorage
        try {
          localStorage.setItem(`options_${tableId}_${fieldId}`, JSON.stringify(updatedOptions))
        } catch (e) {
          console.error("Error saving custom options:", e)
        }

        return { ...prev, [fieldId]: updatedOptions }
      })

      toast.success("Option added", {
        description: `Added "${newOption}" to the options.`,
      })
    },
    [tableId],
  )

  // Function to sanitize form data before saving
  const sanitizeFormData = useCallback((data: FormData, imageUrls: Record<string, string>) => {
    const sanitized: Record<string, any> = {}

    Object.entries(data).forEach(([key, value]) => {
      // Check if this field has a data URL stored
      if (imageUrls[key]) {
        sanitized[key] = imageUrls[key]
      } else if (value instanceof File) {
        sanitized[key] = value.name
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map((item) => (typeof item === "string" ? item : safeToString(item)))
      } else if (typeof value === "object" && value !== null) {
        sanitized[key] = safeToString(value)
      } else {
        sanitized[key] = value
      }
    })

    return sanitized
  }, [])

  const validateForm = useCallback((): boolean => {
    if (!tableDefinition) return false

    const newErrors: Record<string, string> = {}
    let isValid = true

    tableDefinition.fields.forEach((field) => {
      const value = formData[field.id]

      // Required field validation
      if (field.required) {
        if (Array.isArray(value)) {
          if (!value || value.length === 0) {
            newErrors[field.id] = "This field is required"
            isValid = false
          }
        } else if (value === undefined || value === null || value === "") {
          newErrors[field.id] = "This field is required"
          isValid = false
        }
      }

      // Type-specific validations
      if (value !== undefined && value !== null && value !== "") {
        switch (field.type) {
          case "email":
            // Basic email validation
            if (typeof value === "string" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
              newErrors[field.id] = "Please enter a valid email address"
              isValid = false
            }
            break

          case "number":
            // Number validation
            if (typeof value === "string" && isNaN(Number(value))) {
              newErrors[field.id] = "Please enter a valid number"
              isValid = false
            }
            break

          case "date":
            // Date validation
            if (typeof value === "string") {
              try {
                const date = new Date(value)
                if (isNaN(date.getTime())) {
                  throw new Error("Invalid date")
                }
              } catch (e) {
                newErrors[field.id] = "Please enter a valid date"
                isValid = false
              }
            }
            break

          case "phone":
            // Basic phone validation
            if (typeof value === "string" && !/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(value)) {
              newErrors[field.id] = "Please enter a valid phone number"
              isValid = false
            }
            break
        }
      }

      // Field-specific validations
      if (field.maxLength && typeof value === "string" && value.length > field.maxLength) {
        newErrors[field.id] = `Maximum length is ${field.maxLength} characters`
        isValid = false
      }
    })

    setErrors(newErrors)
    return isValid
  }, [tableDefinition, formData])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!validateForm()) {
        toast.error("Validation Error", {
          description: "Please fill in all required fields",
        })
        return
      }

      setIsSubmitting(true)
      try {
        if (tableId === "styles" && debugMode) {
          const debugData: DebugInfo = {}
          tableDefinition?.fields.forEach((field) => {
            debugData[field.id] = {
              value: formData[field.id],
              type: typeof formData[field.id],
              isArray: Array.isArray(formData[field.id]),
              isObject:
                typeof formData[field.id] === "object" &&
                formData[field.id] !== null &&
                !Array.isArray(formData[field.id]),
              stringified: safeToString(formData[field.id]),
            }
          })
          setDebugInfo(debugData)
          console.log("Debug data:", debugData)
        }

        await new Promise((resolve) => setTimeout(resolve, 500))
        const savedData = localStorage.getItem(`table_${tableId}_data`)
        const existingData = savedData ? JSON.parse(savedData) : []

        const sanitizedData = sanitizeFormData(formData, imageDataUrls)

        // Make sure image URLs are properly saved
        tableDefinition?.fields.forEach((field) => {
          if (field.type === "image" && formData[field.id]) {
            // Ensure image URLs are strings and valid
            const imageUrl = formData[field.id].toString()
            if (!imageUrl.startsWith("http") && !imageUrl.startsWith("/")) {
              formData[field.id] = `/placeholder.svg?height=200&width=200`
            }
          }
        })

        const recordIndex = existingData.findIndex((record: any) => record.id === recordId)

        if (recordIndex !== -1) {
          existingData[recordIndex] = { ...sanitizedData, id: recordId }
        } else {
          const index = Number.parseInt(recordId, 10)
          if (!isNaN(index) && index >= 0 && index < existingData.length) {
            existingData[index] = {
              ...sanitizedData,
              id: existingData[index].id || `record-${Date.now()}`,
            }
          } else {
            throw new Error("Record not found")
          }
        }

        localStorage.setItem(`table_${tableId}_data`, JSON.stringify(existingData))

        MemoryManager.clear(`table_${tableId}`)

        window.dispatchEvent(
          new CustomEvent("tableDataChanged", {
            detail: { tableId },
          }),
        )

        window.dispatchEvent(new Event("storage"))

        setIsSuccess(true)
        toast.success("Record updated", {
          description: `${tableDefinition?.name.slice(0, -1).toLowerCase() || "Record"} updated successfully.`,
        })

        setTimeout(() => router.push(`/tables/${tableId}`), 1500)
      } catch (error: any) {
        toast.error("Error updating record", {
          description: error.message || "An unexpected error occurred",
        })
      } finally {
        setIsSubmitting(false)
      }
    },
    [tableId, recordId, formData, imageDataUrls, debugMode, tableDefinition, router, validateForm, sanitizeFormData],
  )

  const renderMultiValueField = useCallback(
    (field: Field, newValue: string, setValue: (val: string) => void, placeholder: string) => {
      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={newValue}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addMultiValue(field.id, newValue, setValue)
                }
              }}
            />
            <Button type="button" onClick={() => addMultiValue(field.id, newValue, setValue)} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>

          {(formData[field.id] as string[])?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {(formData[field.id] as string[]).map((value, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {safeToString(value)}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 ml-1"
                    onClick={() => removeMultiValue(field.id, index)}
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Remove</span>
                  </Button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      )
    },
    [formData, addMultiValue, removeMultiValue],
  )

  const renderFormField = useCallback(
    (field: Field) => {
      // Don't allow editing the dateCreated field
      if (field.id === "dateCreated") {
        try {
          return (
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
              {formData.dateCreated ? format(new Date(formData.dateCreated as string), "PPP p") : "Not set"}
            </div>
          )
        } catch (e) {
          return <div className="text-sm text-muted-foreground">{formData.dateCreated || "Not set"}</div>
        }
      }

      // Special handling for multi-value fields in the Customers table
      if (tableId === "customers") {
        if (field.id === "brands") {
          return renderMultiValueField(field, newBrand, setNewBrand, "Add a brand...")
        }

        if (field.id === "keyContactPersons") {
          return renderMultiValueField(field, newContact, setNewContact, "Add a contact person...")
        }

        if (field.id === "emails") {
          return renderMultiValueField(field, newEmail, setNewEmail, "Add an email...")
        }

        if (field.id === "shipToLocations") {
          return renderMultiValueField(field, newLocation, setNewLocation, "Add a location...")
        }
      }

      // This ensures all relationship fields automatically use RelationshipSelect, including in newly created tables
      if (field.type === "dropdown" && field.linkedTable && field.linkedField) {
        let parentField: { id: string; value: string } | undefined = undefined

        if (field.parentField) {
          const parentFieldValue = formData[field.parentField.fieldId]
          if (parentFieldValue) {
            parentField = {
              id: field.parentField.linkedField,
              value: safeToString(parentFieldValue),
            }
          }
        }

        return (
          <RelationshipSelect
            id={field.id}
            label={field.label}
            value={safeToString(formData[field.id])}
            sourceTable={field.linkedTable}
            sourceField={field.linkedField}
            parentField={parentField}
            onValueChange={(value) => handleInputChange(field.id, value)}
            required={field.required}
            placeholder={`Select ${field.label}`}
            error={errors[field.id]}
            allowAddNew={field.id !== "styleCode"} // Disable "Add new" for styleCode fields
          />
        )
      }

      // Special case for auto-populated fields in Sample Orders and Price Quotes
      if (
        (tableId === "sampleOrders" || tableId === "priceQuotes") &&
        (field.id === "brand" || field.id === "styleDescription")
      ) {
        // These fields are auto-populated from style code
        const isDisabled = !!formData["styleCode"]

        return (
          <Input
            id={field.id}
            value={safeToString(formData[field.id])}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            disabled={isDisabled}
            className={isDisabled ? "bg-muted" : ""}
            required={field.required}
            aria-invalid={errors[field.id] ? "true" : "false"}
          />
        )
      }

      // Additional fields for Price Quotes
      if (tableId === "priceQuotes" && (field.id === "supplier" || field.id === "targetPrice")) {
        // These fields are auto-populated from style code
        const isDisabled = !!formData["styleCode"]

        return (
          <Input
            id={field.id}
            value={safeToString(formData[field.id])}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            disabled={isDisabled}
            className={isDisabled ? "bg-muted" : ""}
            required={field.required}
            aria-invalid={errors[field.id] ? "true" : "false"}
          />
        )
      }

      // Handle styleCode field in Sample Orders and Price Quotes
      if ((tableId === "sampleOrders" || tableId === "priceQuotes") && field.id === "styleCode") {
        return (
          <RelationshipSelect
            id={field.id}
            label={field.label}
            value={safeToString(formData[field.id])}
            sourceTable="styles"
            sourceField="styleCode"
            onValueChange={(value) => handleInputChange(field.id, value)}
            required={field.required}
            placeholder={`Select ${field.label}`}
            error={errors[field.id]}
            allowAddNew={false}
          />
        )
      }

      // Regular field rendering for other fields
      switch (field.type) {
        case "text":
          return (
            <Input
              id={field.id}
              value={safeToString(formData[field.id])}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              required={field.required}
              maxLength={field.maxLength}
              aria-invalid={errors[field.id] ? "true" : "false"}
            />
          )
        case "longtext":
          return (
            <Textarea
              id={field.id}
              value={safeToString(formData[field.id])}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              required={field.required}
              aria-invalid={errors[field.id] ? "true" : "false"}
            />
          )
        case "number":
          return (
            <Input
              id={field.id}
              type="number"
              value={safeToString(formData[field.id])}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              required={field.required}
              aria-invalid={errors[field.id] ? "true" : "false"}
            />
          )
        case "date":
          return (
            <Input
              id={field.id}
              type="date"
              value={safeToString(formData[field.id])}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              required={field.required}
              aria-invalid={errors[field.id] ? "true" : "false"}
            />
          )
        case "email":
          return (
            <Input
              id={field.id}
              type="email"
              value={safeToString(formData[field.id])}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              required={field.required}
              aria-invalid={errors[field.id] ? "true" : "false"}
            />
          )
        case "phone":
          return (
            <Input
              id={field.id}
              type="tel"
              value={safeToString(formData[field.id])}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              required={field.required}
              aria-invalid={errors[field.id] ? "true" : "false"}
            />
          )
        case "dropdown":
          if (!field.linkedTable) {
            // For dropdown fields without linkedTable, use RelationshipSelect to enable "Add new" functionality
            // This applies to all tables: customers (paymentTerms, preferredCourier, shipToLocations),
            // suppliers (productCategories), styles (season, sizeGridName, sizeRange),
            // priceQuotes (quotedBy), sampleOrders (requestedBy, sampleType, courier),
            // customerPOs (sizeType), tasks (urgency), and any future tables
            return (
              <RelationshipSelect
                id={field.id}
                label={field.label}
                value={safeToString(formData[field.id])}
                sourceTable={tableId}
                sourceField={field.id}
                onValueChange={(value) => handleInputChange(field.id, value)}
                required={field.required}
                placeholder={`Select ${field.label}`}
                error={errors[field.id]}
                allowAddNew={true}
              />
            )
          }

          // Special case for currency field in customers table
          if (tableId === "customers" && field.id === "currency") {
            return (
              <CurrencySelector
                value={safeToString(formData[field.id])}
                onValueChange={(value) => handleInputChange(field.id, value)}
                placeholder={`Select ${field.label}`}
                disabled={false}
              />
            )
          }

          // This should never be reached now, but keep as fallback
          const options = customOptions[field.id] || field.options || []
          return (
            <div>
              <select
                id={field.id}
                value={safeToString(formData[field.id] || "")}
                onChange={(e) => handleInputChange(field.id, e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                required={field.required}
              >
                <option value="">Select {field.label}</option>
                {options.map((option) => (
                  <option key={String(option || "")} value={String(option || "")}>
                    {String(option || "")}
                  </option>
                ))}
              </select>
            </div>
          )
        case "boolean":
          return (
            <div className="flex items-center space-x-2">
              <Switch
                id={field.id}
                checked={!!formData[field.id]}
                onCheckedChange={(checked) => handleInputChange(field.id, checked)}
              />
              <Label htmlFor={field.id}>{formData[field.id] ? "Yes" : "No"}</Label>
            </div>
          )
        case "currency":
          return (
            <div className="flex">
              <div className="flex-none w-16">
                <div className="flex h-10 items-center justify-center rounded-md border border-input bg-background px-3">
                  {getCurrencySymbol((formData.currency as string) || "USD")}
                </div>
              </div>
              <Input
                id={field.id}
                type="number"
                step="0.01"
                className="flex-1 ml-2"
                value={safeToString(formData[field.id])}
                onChange={(e) => handleInputChange(field.id, e.target.value)}
                required={field.required}
                aria-invalid={errors[field.id] ? "true" : "false"}
              />
            </div>
          )
        case "image":
          return (
            <div>
              <div className="flex items-center gap-4">
                <Input
                  id={field.id}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleInputChange(field.id, file)
                    }
                  }}
                  required={field.required}
                  aria-invalid={errors[field.id] ? "true" : "false"}
                />
              </div>

              {/* Show current image if it exists */}
              {formData[field.id] && !imagePreview && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Current Image:</p>
                  <div className="border rounded-md p-2 w-fit">
                    <Image
                      src={`/ceholder-svg-key-czet2.jpg?key=czet2&height=200&width=200`}
                      alt="Current image"
                      width={200}
                      height={200}
                      className="object-contain max-h-[200px]"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Filename: {safeToString(formData[field.id])}</p>
                </div>
              )}

              {/* Show image preview if a new image is selected */}
              {imagePreview && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">New Image Preview:</p>
                  <div className="border rounded-md p-2 w-fit">
                    <Image
                      src={imagePreview || "/placeholder.svg"}
                      alt="Preview"
                      width={200}
                      height={200}
                      className="object-contain max-h-[200px]"
                    />
                  </div>
                </div>
              )}
            </div>
          )
        case "file":
          return (
            <div>
              <Input
                id={field.id}
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    // Just store the file name for now
                    handleInputChange(field.id, file.name)
                  }
                }}
                required={field.required}
                aria-invalid={errors[field.id] ? "true" : "false"}
              />
              {formData[field.id] && (
                <p className="text-xs text-muted-foreground mt-1">Selected: {safeToString(formData[field.id])}</p>
              )}
            </div>
          )
        case "formula":
          return <Input id={field.id} value={safeToString(formData[field.id])} disabled className="bg-muted" />
        default:
          return (
            <Input
              id={field.id}
              value={safeToString(formData[field.id])}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              required={field.required}
              aria-invalid={errors[field.id] ? "true" : "false"}
            />
          )
      }
    },
    [
      tableId,
      formData,
      errors,
      imagePreview,
      customOptions,
      handleInputChange,
      newBrand,
      newContact,
      newEmail,
      newLocation,
      renderMultiValueField,
    ],
  )

  if (!tableDefinition) {
    return <div className="p-8 text-center">Table not found</div>
  }

  if (recordNotFound) {
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
                <Link href={`/tables/${tableId}`}>
                  <ArrowLeft className="h-4 w-4" />
                  <span className="sr-only">Back</span>
                </Link>
              </Button>
              <h1 className="text-2xl font-bold tracking-tight">Record Not Found</h1>
            </div>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                The record you're trying to edit could not be found. It may have been deleted or the ID is invalid.
              </AlertDescription>
            </Alert>
            <Button asChild>
              <Link href={`/tables/${tableId}`}>Return to Table</Link>
            </Button>
          </div>
        </main>
      </div>
    )
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
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button variant="ghost" size="icon" asChild className="mr-2">
                <Link href={`/tables/${tableId}`}>
                  <ArrowLeft className="h-4 w-4" />
                  <span className="sr-only">Back</span>
                </Link>
              </Button>
              <h1 className="text-2xl font-bold tracking-tight">Edit {tableDefinition.name.slice(0, -1)}</h1>
            </div>

            {/* Debug mode toggle for styles table */}
            {tableId === "styles" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDebugMode(!debugMode)}
                className={debugMode ? "bg-amber-100" : ""}
              >
                <Bug className="mr-2 h-4 w-4" />
                {debugMode ? "Debug Mode On" : "Debug Mode"}
              </Button>
            )}
          </div>

          {isSuccess && (
            <Alert className="bg-green-50 border-green-200 text-green-800">
              <Check className="h-4 w-4" />
              <AlertTitle>Success!</AlertTitle>
              <AlertDescription>Record updated successfully. Redirecting to table view...</AlertDescription>
            </Alert>
          )}

          {/* Debug info display */}
          {debugMode && Object.keys(debugInfo).length > 0 && (
            <Alert className="bg-amber-50 border-amber-200">
              <AlertTitle>Debug Information</AlertTitle>
              <AlertDescription>
                <div className="mt-2 text-xs font-mono overflow-auto max-h-40">
                  <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Edit Record</CardTitle>
                <CardDescription>Update the details for this record</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                {/* Date Created field at the top */}
                <div className="grid gap-2">
                  <Label htmlFor="dateCreated">Date Created</Label>
                  {renderFormField({ id: "dateCreated", label: "Date Created", type: "date", required: false })}
                </div>

                {/* Regular fields */}
                {tableDefinition.fields.map(
                  (field) =>
                    field.id !== "dateCreated" && (
                      <div key={field.id} className="grid gap-2">
                        <Label htmlFor={field.id} className={errors[field.id] ? "text-destructive" : ""}>
                          {field.label}
                          {field.required && <span className="text-destructive ml-1">*</span>}
                        </Label>
                        {renderFormField(field)}
                        {errors[field.id] && <p className="text-xs text-destructive">{errors[field.id]}</p>}
                        {field.notes && <p className="text-xs text-muted-foreground">{field.notes}</p>}
                      </div>
                    ),
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" asChild>
                  <Link href={`/tables/${tableId}`}>Cancel</Link>
                </Button>
                <Button type="submit" disabled={isSubmitting || isSuccess}>
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                      Update Record
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>
      </main>
    </div>
  )
}

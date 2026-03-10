"use client"

import { useState, useEffect, useCallback, memo, useMemo, useRef } from "react"
import { Plus } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { getTableById } from "@/lib/data-structure"

// Constants
const ADD_NEW_VALUE = "__add_new__"
const DEFAULT_PLACEHOLDER = "Select..."
const OPTION_KEY_PREFIX = "options_"

// Type definitions
type SafeValue = string | number | boolean | Date | object | null | undefined
interface ParentField {
  id: string
  value: string
}
interface RelationshipSelectProps {
  id: string
  label: string
  value: SafeValue
  sourceTable: string
  sourceField: string
  parentField?: ParentField
  onValueChange: (value: string) => void
  required?: boolean
  placeholder?: string
  error?: string
  allowAddNew?: boolean
  disabled?: boolean
  maxOptions?: number
}

const safeToString = (value: SafeValue): string => {
  if (value === null || value === undefined) return ""
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) return value.map(safeToString).join(", ")
  if (typeof value === "object") {
    try {
      return JSON.stringify(value)
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to stringify object:", e)
      }
      return String(value)
    }
  }
  return String(value)
}

// Memoized RelationshipSelect
export const RelationshipSelect = memo(function RelationshipSelect({
  id,
  label,
  value,
  sourceTable,
  sourceField,
  parentField,
  onValueChange,
  required = false,
  placeholder = DEFAULT_PLACEHOLDER,
  error,
  allowAddNew = true,
  disabled = false,
  maxOptions = Number.POSITIVE_INFINITY,
}: RelationshipSelectProps) {
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newOption, setNewOption] = useState("")
  const [validationError, setValidationError] = useState("")
  const [options, setOptions] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const loadingRef = useRef(false)
  const instanceIdRef = useRef(`${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options
    return options.filter((option) => option.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [options, searchTerm])

  const parentFieldId = parentField?.id
  const parentFieldValue = parentField?.value

  const loadOptions = useCallback(() => {
    if (typeof window === "undefined") return
    if (loadingRef.current) {
      console.log(`[v0] Already loading options for ${sourceTable}.${sourceField}, skipping`)
      return
    }

    try {
      loadingRef.current = true
      setIsLoading(true)
      console.log(`[v0] ========== START loadOptions ==========`)
      console.log(`[v0] Loading options for ${sourceTable}.${sourceField}`)
      console.log(`[v0] Parent field: ${parentFieldId} = ${parentFieldValue}`)

      const savedData = localStorage.getItem(`table_${sourceTable}_data`)
      console.log(`[v0] Raw localStorage data length:`, savedData?.length || 0)

      // Check if this is a field without linkedTable (stored in localStorage as options)
      const savedOptions = localStorage.getItem(`options_${sourceTable}_${sourceField}`)
      if (savedOptions) {
        try {
          const parsedOptions = JSON.parse(savedOptions)
          if (Array.isArray(parsedOptions)) {
            console.log(`[v0] Loaded ${parsedOptions.length} options from localStorage`)
            console.log(`[v0] Options:`, parsedOptions)
            setOptions(parsedOptions)
            console.log(`[v0] ========== END loadOptions (from saved options) ==========`)
            return
          }
        } catch (e) {
          console.error(`[v0] Error parsing saved options:`, e)
        }
      }

      if (!savedData) {
        console.log(`[v0] No data found for table: ${sourceTable}`)
        setOptions([])
        console.log(`[v0] ========== END loadOptions (no data) ==========`)
        return
      }

      const tableData: unknown = JSON.parse(savedData)
      if (!Array.isArray(tableData) || tableData.length === 0) {
        console.log(`[v0] Empty or invalid data for table: ${sourceTable}`)
        setOptions([])
        console.log(`[v0] ========== END loadOptions (empty data) ==========`)
        return
      }

      console.log(`[v0] Found ${tableData.length} records in ${sourceTable}`)
      console.log(`[v0] Sample record:`, tableData[0])

      const uniqueValues = new Set<string>()
      if (parentFieldId && parentFieldValue) {
        const filteredData = tableData.filter((record: any) => record[parentFieldId] === parentFieldValue)
        console.log(`[v0] Filtered to ${filteredData.length} records based on parent field`)
        filteredData.forEach((record: any) => {
          const fieldValue = record[sourceField]
          if (Array.isArray(fieldValue)) {
            fieldValue.forEach((item) => item && uniqueValues.add(safeToString(item)))
          } else if (fieldValue) {
            uniqueValues.add(safeToString(fieldValue))
          }
        })
      } else {
        tableData.forEach((record: any) => {
          const fieldValue = record[sourceField]
          console.log(`[v0] Processing record, ${sourceField} =`, fieldValue)
          if (Array.isArray(fieldValue)) {
            fieldValue.forEach((item) => item && uniqueValues.add(safeToString(item)))
          } else if (fieldValue) {
            uniqueValues.add(safeToString(fieldValue))
          }
        })
      }

      const newOptions = Array.from(uniqueValues).sort()
      console.log(`[v0] Loaded ${newOptions.length} unique options:`, newOptions)
      setOptions(newOptions)
      console.log(`[v0] ========== END loadOptions ==========`)
    } catch (e) {
      console.error(`[v0] Error loading options from ${sourceTable}.${sourceField}:`, e)
      setOptions([])
    } finally {
      setTimeout(() => {
        loadingRef.current = false
        setIsLoading(false)
      }, 100)
    }
  }, [sourceTable, sourceField, parentFieldId, parentFieldValue])

  useEffect(() => {
    loadOptions()
  }, [sourceTable, sourceField, parentFieldId, parentFieldValue])

  useEffect(() => {
    const handleTableDataChange = (event: CustomEvent) => {
      // Skip reload if this component triggered the event
      if (event.detail?.instanceId === instanceIdRef.current) {
        console.log(`[v0] Skipping reload for ${sourceTable} - event from this instance`)
        return
      }

      if (event.detail?.tableId === sourceTable) {
        console.log(`[v0] Reloading options for ${sourceTable} due to data change from another instance`)
        setTimeout(() => {
          loadOptions()
        }, 150)
      }
    }

    window.addEventListener("tableDataChanged", handleTableDataChange as EventListener)

    return () => {
      window.removeEventListener("tableDataChanged", handleTableDataChange as EventListener)
    }
  }, [sourceTable, loadOptions])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isAddingNew && e.key === "Escape") {
        setIsAddingNew(false)
        e.preventDefault()
      }
    },
    [isAddingNew],
  )

  useEffect(() => {
    if (isAddingNew) {
      document.addEventListener("keydown", handleKeyDown)
      return () => {
        document.removeEventListener("keydown", handleKeyDown)
      }
    }
  }, [handleKeyDown, isAddingNew])

  useEffect(() => {
    if (!isAddingNew) {
      setSearchTerm("")
    }
  }, [isAddingNew])

  const handleAddOption = useCallback(() => {
    const trimmedOption = newOption.trim()
    console.log(`[v0] Adding new option: "${trimmedOption}" to ${sourceTable}.${sourceField}`)

    if (!trimmedOption) {
      setValidationError("Please enter a value")
      return
    }
    if (options.includes(trimmedOption)) {
      setValidationError("This option already exists")
      return
    }
    if (options.length >= maxOptions) {
      setValidationError(`Maximum of ${maxOptions} options reached`)
      return
    }

    try {
      const tableDef = getTableById(sourceTable)

      if (!tableDef) {
        const optionsKey = `options_${sourceTable}_${sourceField}`
        const updatedOptions = [...options, trimmedOption]
        localStorage.setItem(optionsKey, JSON.stringify(updatedOptions))
        console.log(`[v0] Saved options to localStorage: ${optionsKey}`)

        setOptions(updatedOptions)
        onValueChange(trimmedOption)
        setNewOption("")
        setIsAddingNew(false)
        setValidationError("")

        window.dispatchEvent(
          new CustomEvent("tableDataChanged", {
            detail: { tableId: sourceTable, instanceId: instanceIdRef.current },
          }),
        )

        toast.success("Option added", {
          description: `Added "${trimmedOption}" to ${label.toLowerCase()}.`,
        })
        return
      }

      const tableDataKey = `table_${sourceTable}_data`
      const savedData = localStorage.getItem(tableDataKey)
      const existingRecords = savedData ? JSON.parse(savedData) : []
      console.log(`[v0] Existing records in ${sourceTable}:`, existingRecords.length)

      if (parentFieldId && parentFieldValue) {
        console.log(`[v0] Parent field detected: ${parentFieldId} = ${parentFieldValue}`)
        const parentRecord = existingRecords.find((record: any) => record[parentFieldId] === parentFieldValue)

        if (parentRecord) {
          console.log(`[v0] Found parent record, updating field ${sourceField}`)
          const currentValue = parentRecord[sourceField]

          if (Array.isArray(currentValue)) {
            parentRecord[sourceField] = [...currentValue, trimmedOption]
          } else if (currentValue && typeof currentValue === "string") {
            const values = currentValue
              .split(",")
              .map((v: string) => v.trim())
              .filter(Boolean)
            values.push(trimmedOption)
            parentRecord[sourceField] = values.join(", ")
          } else {
            parentRecord[sourceField] = trimmedOption
          }

          localStorage.setItem(tableDataKey, JSON.stringify(existingRecords))

          const updatedOptions = [...options, trimmedOption]
          setOptions(updatedOptions)
          onValueChange(trimmedOption)
          setNewOption("")
          setIsAddingNew(false)
          setValidationError("")

          window.dispatchEvent(
            new CustomEvent("tableDataChanged", {
              detail: { tableId: sourceTable, instanceId: instanceIdRef.current },
            }),
          )

          console.log(`[v0] Successfully updated ${sourceField} in ${sourceTable} table`)

          toast.success("Option added", {
            description: `Added "${trimmedOption}" to ${label.toLowerCase()}.`,
          })

          return
        }
      }

      const newRecord: any = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        dateCreated: new Date().toISOString(),
      }

      newRecord[sourceField] = trimmedOption

      tableDef.fields.forEach((field) => {
        if (field.required && !newRecord[field.id]) {
          switch (field.type) {
            case "text":
            case "longtext":
            case "email":
            case "phone":
              newRecord[field.id] = field.id === sourceField ? trimmedOption : ""
              break
            case "number":
            case "currency":
              newRecord[field.id] = 0
              break
            case "date":
              newRecord[field.id] = ""
              break
            case "boolean":
              newRecord[field.id] = false
              break
            case "dropdown":
              newRecord[field.id] = field.id === sourceField ? trimmedOption : ""
              break
            default:
              newRecord[field.id] = ""
          }
        } else if (!newRecord[field.id]) {
          newRecord[field.id] =
            field.type === "number" || field.type === "currency"
              ? ""
              : field.type === "boolean"
                ? false
                : field.type === "dropdown" && field.options
                  ? ""
                  : ""
        }
      })

      const updatedRecords = [...existingRecords, newRecord]
      localStorage.setItem(tableDataKey, JSON.stringify(updatedRecords))
      console.log(`[v0] Created new record in ${sourceTable}:`, newRecord)

      const updatedOptions = [...options, trimmedOption]
      setOptions(updatedOptions)
      onValueChange(trimmedOption)
      setNewOption("")
      setIsAddingNew(false)
      setValidationError("")

      window.dispatchEvent(
        new CustomEvent("tableDataChanged", {
          detail: { tableId: sourceTable, instanceId: instanceIdRef.current },
        }),
      )

      console.log(`[v0] Successfully added "${trimmedOption}" to ${sourceTable}.${sourceField}`)

      toast.success("Record created", {
        description: `Added "${trimmedOption}" to ${label.toLowerCase()}.`,
      })
    } catch (e) {
      console.error("[v0] Error in handleAddOption:", e)
      toast.error("Failed to create record", {
        description: "There was an error creating the new record.",
      })
    }
  }, [newOption, options, onValueChange, sourceTable, sourceField, maxOptions, parentFieldId, parentFieldValue, label])

  const safeValue = safeToString(value)

  return (
    <>
      <Select
        value={safeValue || ""}
        onValueChange={(val) => {
          if (val === ADD_NEW_VALUE) {
            setIsAddingNew(true)
          } else {
            onValueChange(val)
          }
        }}
        disabled={disabled}
      >
        <SelectTrigger
          id={id}
          aria-invalid={error || validationError ? "true" : "false"}
          className={error || validationError ? "border-destructive" : ""}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {filteredOptions.map((option) => (
            <SelectItem key={option} value={option || ""}>
              {option || ""}
            </SelectItem>
          ))}
          {allowAddNew && !disabled && (
            <SelectItem
              value={ADD_NEW_VALUE}
              className="text-primary font-medium"
              aria-label={`Add new ${label.toLowerCase()}`}
            >
              <div className="flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                Add new {label.toLowerCase()}
              </div>
            </SelectItem>
          )}
        </SelectContent>
      </Select>

      <Dialog open={isAddingNew} onOpenChange={setIsAddingNew}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New {label}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new-option">
                {label} Name
                {required && <span className="text-destructive ml-1">*</span>}
              </Label>
              <Input
                id="new-option"
                value={newOption}
                onChange={(e) => {
                  setNewOption(e.target.value)
                  setValidationError("")
                }}
                placeholder={`Enter new ${label.toLowerCase()}`}
                className={validationError ? "border-destructive" : ""}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddOption()
                  }
                }}
                disabled={disabled}
              />
              {validationError && <p className="text-xs text-destructive">{validationError}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingNew(false)} disabled={disabled}>
              Cancel
            </Button>
            <Button onClick={handleAddOption} disabled={disabled}>
              Add {label}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
})

export default RelationshipSelect

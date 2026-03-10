"use client"

import { useState, useEffect, useCallback, memo, useMemo } from "react"
import { Plus } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

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

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options
    return options.filter((option) => option.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [options, searchTerm])

  const loadOptions = useCallback(() => {
    if (typeof window === "undefined") return

    console.log(`[v0] Loading options for ${sourceTable}.${sourceField}`)

    try {
      const savedData = localStorage.getItem(`table_${sourceTable}_data`)
      if (!savedData) {
        console.log(`[v0] No data found for table: ${sourceTable}`)
        setOptions([])
        return
      }

      const tableData: unknown = JSON.parse(savedData)
      if (!Array.isArray(tableData) || tableData.length === 0) {
        console.log(`[v0] Empty or invalid data for table: ${sourceTable}`)
        setOptions([])
        return
      }

      console.log(`[v0] Found ${tableData.length} records in ${sourceTable}`)

      const uniqueValues = new Set<string>()
      if (parentField && parentField.value) {
        console.log(`[v0] Filtering by parent field: ${parentField.id} = ${parentField.value}`)
        const filteredData = tableData.filter((record: any) => record[parentField.id] === parentField.value)
        console.log(`[v0] Filtered to ${filteredData.length} records`)

        filteredData.forEach((record: any) => {
          const fieldValue = record[sourceField]
          if (Array.isArray(fieldValue)) {
            fieldValue.forEach((item) => {
              if (item && item !== "") {
                uniqueValues.add(safeToString(item))
              }
            })
          } else if (fieldValue && fieldValue !== "") {
            uniqueValues.add(safeToString(fieldValue))
          }
        })
      } else {
        tableData.forEach((record: any) => {
          const fieldValue = record[sourceField]
          if (Array.isArray(fieldValue)) {
            fieldValue.forEach((item) => {
              if (item && item !== "") {
                uniqueValues.add(safeToString(item))
              }
            })
          } else if (fieldValue && fieldValue !== "") {
            uniqueValues.add(safeToString(fieldValue))
          }
        })
      }

      const newOptions = Array.from(uniqueValues).sort()
      console.log(`[v0] Extracted ${newOptions.length} unique options:`, newOptions)
      setOptions(newOptions)
    } catch (e) {
      console.error(`[v0] Error loading options from ${sourceTable}.${sourceField}:`, e)
      setOptions([])
    }
  }, [sourceTable, sourceField, parentField])

  // Load options from localStorage
  useEffect(() => {
    loadOptions()
  }, [loadOptions])

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isAddingNew && e.key === "Escape") {
        setIsAddingNew(false)
        e.preventDefault()
      }
    },
    [isAddingNew],
  )

  // Add event listener cleanup
  useEffect(() => {
    if (isAddingNew) {
      document.addEventListener("keydown", handleKeyDown)
      return () => {
        document.removeEventListener("keydown", handleKeyDown)
      }
    }
  }, [handleKeyDown, isAddingNew])

  // Reset search term when dialog closes
  useEffect(() => {
    if (!isAddingNew) {
      setSearchTerm("")
    }
  }, [isAddingNew])

  // Memoized handler for adding options
  const handleAddOption = useCallback(() => {
    const trimmedOption = newOption.trim()
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

    const updatedOptions = [...options, trimmedOption]
    setOptions(updatedOptions)

    try {
      const optionKey = `${OPTION_KEY_PREFIX}${sourceTable}_${sourceField}`
      const savedOptions = localStorage.getItem(optionKey)
      const existingOptions = savedOptions ? JSON.parse(savedOptions) : []
      const newOptions = [...existingOptions, trimmedOption]
      localStorage.setItem(optionKey, JSON.stringify(newOptions))
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error saving new option:", e)
      }
      toast.error("Failed to save new option.", {
        description: "There was an error saving the new option.",
      })
      return
    }

    onValueChange(trimmedOption)
    setNewOption("")
    setIsAddingNew(false)
    setValidationError("")
    toast.success("Option added", {
      description: `Added "${trimmedOption}" to the options.`,
    })
  }, [newOption, options, onValueChange, sourceTable, sourceField, maxOptions])

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

// Default export for backward compatibility
export default RelationshipSelect

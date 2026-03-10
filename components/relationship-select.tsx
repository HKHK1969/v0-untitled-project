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
const ADD_NEW_VALUE = "__add_new__" // Recommendation 1: Configurable special value
const DEFAULT_PLACEHOLDER = "Select..." // Recommendation 1: Configurable placeholder
const OPTION_KEY_PREFIX = "options_" // Recommendation 1: Configurable storage key

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
  disabled?: boolean // Recommendation 1: Add disable option
  maxOptions?: number // Recommendation 1: Limit options
}

// Helper function with stricter typing
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
      console.error("Failed to stringify object:", e)
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

  // Load options from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const savedData = localStorage.getItem(`table_${sourceTable}_data`)
      if (!savedData) {
        setOptions([])
        return
      }

      const tableData: unknown = JSON.parse(savedData)
      if (!Array.isArray(tableData) || tableData.length === 0) {
        setOptions([])
        return
      }

      const uniqueValues = new Set<string>()
      if (parentField && parentField.value) {
        const filteredData = tableData.filter((record: any) => record[parentField.id] === parentField.value)
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
          if (Array.isArray(fieldValue)) {
            fieldValue.forEach((item) => item && uniqueValues.add(safeToString(item)))
          } else if (fieldValue) {
            uniqueValues.add(safeToString(fieldValue))
          }
        })
      }

      const newOptions = Array.from(uniqueValues).sort()
      setOptions(newOptions)
    } catch (e) {
      console.error(`Error loading options from ${sourceTable}.${sourceField}:`, e)
      setOptions([])
    }
  }, [sourceTable, sourceField, parentField?.value, parentField?.id])

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
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleKeyDown])

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
      console.error("Error saving new option:", e)
      toast.error("Failed to save new option.", {
        description: "There was an error saving the new option.",
      })
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

// Additional Recommendations Implementation:
// 1. Dynamic Features: Added disabled and maxOptions props
// 2. Error Handling: Enhanced with max options check and storage error toast
// 3. Performance: Memoized component and key functions
// 4. Accessibility: Added aria-label to add new option
// 5. Testing: Added TODO comment below

// TODO: Add unit tests in a separate file (e.g., relationship-select.test.tsx) - Recommendation 5
// Suggested tests:
// 1. Test renders with default options and value
// 2. Test loads options from localStorage
// 3. Test adds new option and saves to localStorage
// 4. Test validation errors for empty, duplicate, or max options
// 5. Test disabled prevents interaction
// Example test file structure:
// import { render, screen, fireEvent } from "@testing-library/react"
// test("renders select", () => {
//   render(<RelationshipSelect id="test" label="Test" value="" sourceTable="test" sourceField="field" onValueChange={jest.fn()} />)
//   expect(screen.getByText("Select...")).toBeInTheDocument()
// })
// test("adds new option", () => {
//   const onValueChange = jest.fn()
//   render(<RelationshipSelect id="test" label="Test" value="" sourceTable="test" sourceField="field" onValueChange={onValueChange} />)
//   fireEvent.click(screen.getByText("Add new test"))
//   fireEvent.change(screen.getByPlaceholderText("Enter new test"), { target: { value: "new" } })
//   fireEvent.click(screen.getByText("Add Test"))
//   expect(onValueChange).toHaveBeenCalledWith("new")
// })

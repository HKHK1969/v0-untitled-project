"use client"

import { useState, useEffect, useCallback, memo } from "react"
import { Plus } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

// Constants
const ADD_NEW_VALUE = "__add_new__" // Recommendation 1: Configurable special value
const DEFAULT_PLACEHOLDER = "Select..." // Recommendation 1: Configurable placeholder

// Type definitions
interface ParentField {
  id: string
  value: string
  relationKey: string
}

interface RelatedDataRecord {
  [key: string]: string | string[] | undefined
}

interface RelatedFieldSelectProps {
  id: string
  label: string
  value: string
  options: string[]
  onValueChange: (value: string) => void
  onAddOption: (option: string) => void
  required?: boolean
  placeholder?: string
  error?: string
  disabled?: boolean
  parentField?: ParentField
  relatedData?: RelatedDataRecord[]
  maxOptions?: number // Recommendation 1: Limit options
}

// Enhanced RelatedFieldSelect with memoization
export const RelatedFieldSelect = memo(function RelatedFieldSelect({
  id,
  label,
  value,
  options,
  onValueChange,
  onAddOption,
  required = false,
  placeholder = DEFAULT_PLACEHOLDER,
  error,
  disabled = false,
  parentField,
  relatedData,
  maxOptions = Number.POSITIVE_INFINITY, // Recommendation 1
}: RelatedFieldSelectProps) {
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newOption, setNewOption] = useState("")
  const [validationError, setValidationError] = useState("")
  const [filteredOptions, setFilteredOptions] = useState<string[]>(options)

  // Filter options based on parent field (Recommendation 3: Memoized)
  const filterOptions = useCallback(() => {
    if (!parentField || !parentField.value || !relatedData) {
      return options
    }

    try {
      const parentRecord = relatedData.find((record) =>
        Array.isArray(record[parentField.relationKey])
          ? record[parentField.relationKey].includes(parentField.value)
          : record[parentField.relationKey] === parentField.value,
      )

      if (!parentRecord) return options

      const fieldValue = parentRecord[id]
      if (Array.isArray(fieldValue)) return fieldValue
      if (fieldValue) return [fieldValue]
      return []
    } catch (err) {
      console.error("Error filtering related data:", err) // Recommendation 2
      return options // Fallback to all options on error
    }
  }, [id, options, parentField, relatedData])

  useEffect(() => {
    setFilteredOptions(filterOptions())
  }, [filterOptions])

  // Memoized handler for adding options (Recommendation 3)
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
      setValidationError(`Maximum of ${maxOptions} options reached`) // Recommendation 2
      return
    }

    onAddOption(trimmedOption)
    setNewOption("")
    setIsAddingNew(false)
    setValidationError("")
    onValueChange(trimmedOption)
  }, [newOption, options, onAddOption, onValueChange, maxOptions])

  return (
    <>
      <Select
        value={value || ""}
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
          {!disabled && (
            <SelectItem
              value={ADD_NEW_VALUE}
              className="text-primary font-medium"
              aria-label={`Add new ${label.toLowerCase()}`} // Recommendation 4
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
                disabled={disabled} // Recommendation 1
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
export default RelatedFieldSelect

// Additional Recommendations Implementation:
// 1. Dynamic Features: Added maxOptions prop
// 2. Error Handling: Added error handling for related data filtering
// 3. Performance: Memoized component and filter logic
// 4. Accessibility: Added aria-label to add new option
// 5. Testing: Added TODO comment below

// TODO: Add unit tests in a separate file (e.g., related-field-select.test.tsx) - Recommendation 5
// Suggested tests:
// 1. Test renders with default options and value
// 2. Test filters options based on parentField and relatedData
// 3. Test adds new option and selects it
// 4. Test validation errors for empty, duplicate, or max options
// 5. Test disabled prevents interaction
// Example test file structure:
// import { render, screen, fireEvent } from "@testing-library/react"
// test("renders select", () => {
//   render(<RelatedFieldSelect id="test" label="Test" value="" options={["a"]} onValueChange={jest.fn()} onAddOption={jest.fn()} />)
//   expect(screen.getByText("Select...")).toBeInTheDocument()
// })
// test("filters options", () => {
//   const relatedData = [{ test: ["b"], parent: "p1" }]
//   render(
//     <RelatedFieldSelect
//       id="test"
//       label="Test"
//       value=""
//       options={["a", "b"]}
//       onValueChange={jest.fn()}
//       onAddOption={jest.fn()}
//       parentField={{ id: "parent", value: "p1", relationKey: "parent" }}
//       relatedData={relatedData}
//     />
//   )
//   fireEvent.click(screen.getByRole("combobox"))
//   expect(screen.getByText("b")).toBeInTheDocument()
//   expect(screen.queryByText("a")).not.toBeInTheDocument()
// })

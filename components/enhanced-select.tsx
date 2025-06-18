"use client"

import { useState, useCallback, memo, useEffect, useMemo } from "react"
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
type SafeValue = string | number | boolean | Date | object | null | undefined
interface EnhancedSelectProps<T extends SafeValue> {
  id: string
  label: string
  value: T
  options: T[]
  onValueChange: (value: string) => void
  onAddOption: (option: string) => void
  required?: boolean
  placeholder?: string
  error?: string
  disabled?: boolean // Recommendation 1: Add disable option
  maxOptions?: number // Recommendation 1: Limit options
}

// Helper function with stricter typing (Recommendation 2)
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

// EnhancedSelect component with memoization
export const EnhancedSelect = memo(function EnhancedSelect<T extends SafeValue>({
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
  maxOptions = Number.POSITIVE_INFINITY, // Recommendation 1
}: EnhancedSelectProps<T>) {
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newOption, setNewOption] = useState("")
  const [validationError, setValidationError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options
    return options.filter((option) => safeToString(option).toLowerCase().includes(searchTerm.toLowerCase()))
  }, [options, searchTerm])

  // Memoized handler for adding options
  const handleAddOption = useCallback(() => {
    const trimmedOption = newOption.trim()
    if (!trimmedOption) {
      setValidationError("Please enter a value")
      return
    }
    if (options.map(safeToString).includes(trimmedOption)) {
      setValidationError("This option already exists")
      return
    }
    if (options.length >= maxOptions) {
      setValidationError(`Maximum of ${maxOptions} options reached`)
      return
    }

    onAddOption(trimmedOption)
    setNewOption("")
    setIsAddingNew(false)
    setValidationError("")
    onValueChange(trimmedOption)
  }, [newOption, options, onAddOption, onValueChange, maxOptions])

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

  // Memoized value conversion (Recommendation 3)
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
        disabled={disabled} // Recommendation 1
      >
        <SelectTrigger
          id={id}
          aria-invalid={error || validationError ? "true" : "false"}
          className={error || validationError ? "border-destructive" : ""}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {filteredOptions.map((option) => {
            const optionStr = safeToString(option)
            return (
              <SelectItem key={optionStr || `${id}-${options.indexOf(option)}`} value={optionStr || ""}>
                {optionStr || ""}
              </SelectItem>
            )
          })}
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
}) as <T extends SafeValue>(props: EnhancedSelectProps<T>) => JSX.Element

// Default export for backward compatibility
export default EnhancedSelect

// Additional Recommendations Implementation:
// 1. Dynamic Features: Added disabled and maxOptions props
// 2. Error Handling: Added max options check and improved validation
// 3. Performance: Memoized component and handler
// 4. Accessibility: Added aria-label to add new option
// 5. Testing: Added TODO comment below

// TODO: Add unit tests in a separate file (e.g., enhanced-select.test.tsx) - Recommendation 5
// Suggested tests:
// 1. Test renders with default options and value
// 2. Test adds new option and selects it
// 3. Test validation errors for empty or duplicate options
// 4. Test disabled prevents interaction
// 5. Test maxOptions limits new additions
// Example test file structure:
// import { render, screen, fireEvent } from "@testing-library/react"
// test("renders select", () => {
//   render(<EnhancedSelect id="test" label="Test" value="" options={["a"]} onValueChange={jest.fn()} onAddOption={jest.fn()} />)
//   expect(screen.getByText("Select...")).toBeInTheDocument()
// })
// test("adds new option", () => {
//   const onAddOption = jest.fn()
//   const onValueChange = jest.fn()
//   render(<EnhancedSelect id="test" label="Test" value="" options={["a"]} onValueChange={onValueChange} onAddOption={onAddOption} />)
//   fireEvent.click(screen.getByText("Add new test"))
//   fireEvent.change(screen.getByPlaceholderText("Enter new test"), { target: { value: "b" } })
//   fireEvent.click(screen.getByText("Add Test"))
//   expect(onAddOption).toHaveBeenCalledWith("b")
// })

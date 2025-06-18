"use client"

import { memo, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

// Constants
const FIELD_TYPES = ["text", "email", "longtext", "number", "currency", "boolean", "dropdown", "image", "file"] as const
const DEFAULT_PLACEHOLDER = "Select an option" // Recommendation 1: Configurable

// Type definitions
type FieldTypeEnum = (typeof FIELD_TYPES)[number]

export interface FieldType {
  id: string
  label: string
  type: FieldTypeEnum
  required?: boolean
  options?: string[]
  placeholder?: string // Recommendation 1: Custom placeholder per field
}

type FieldValue = string | number | boolean | null | undefined

interface FormFieldProps {
  field: FieldType
  value: FieldValue
  onChange: (fieldId: string, value: FieldValue) => void
  error?: string | null
  disabled?: boolean // Recommendation 1: Add disable option
}

// Memoized FormField
export const FormField = memo(function FormField({ field, value, onChange, error, disabled = false }: FormFieldProps) {
  // Safe string conversion (Recommendation 2)
  const safeStringValue = useCallback((): string => {
    try {
      return value === null || value === undefined ? "" : String(value)
    } catch (e) {
      console.error(`Error converting value for field ${field.id}:`, e)
      return ""
    }
  }, [value, field.id])

  const stringValue = safeStringValue()

  // Memoized change handler (Recommendation 3)
  const handleChange = useCallback(
    (newValue: FieldValue) => {
      if (disabled) return
      onChange(field.id, newValue)
    },
    [field.id, onChange, disabled],
  )

  // Render field with type safety (Recommendation 3)
  const renderField = useCallback(() => {
    switch (field.type) {
      case "text":
      case "email":
        return (
          <Input
            id={field.id}
            type={field.type}
            value={stringValue}
            onChange={(e) => handleChange(e.target.value)}
            className={cn(error && "border-destructive")}
            disabled={disabled}
          />
        )

      case "longtext":
        return (
          <Textarea
            id={field.id}
            value={stringValue}
            onChange={(e) => handleChange(e.target.value)}
            className={cn(error && "border-destructive")}
            disabled={disabled}
          />
        )

      case "number":
      case "currency":
        return (
          <Input
            id={field.id}
            type="number"
            value={stringValue}
            onChange={(e) =>
              handleChange(field.type === "currency" ? Number.parseFloat(e.target.value) || 0 : e.target.value)
            }
            className={cn(error && "border-destructive")}
            step={field.type === "currency" ? "0.01" : "1"}
            disabled={disabled}
          />
        )

      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Switch
              id={field.id}
              checked={!!value}
              onCheckedChange={(checked) => handleChange(checked)}
              disabled={disabled}
            />
            <Label htmlFor={field.id}>Enabled</Label>
          </div>
        )

      case "dropdown":
        return (
          <Select value={stringValue || ""} onValueChange={(val) => handleChange(val)} disabled={disabled}>
            <SelectTrigger className={cn(error && "border-destructive")}>
              <SelectValue placeholder={field.placeholder || DEFAULT_PLACEHOLDER} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option || ""}>
                  {option || ""}
                </SelectItem>
              )) || <SelectItem value="">No options available</SelectItem>}
            </SelectContent>
          </Select>
        )

      case "image":
      case "file":
        return (
          <Input
            id={field.id}
            type="text"
            value={stringValue}
            onChange={(e) => handleChange(e.target.value)}
            className={cn(error && "border-destructive")}
            placeholder={`Enter ${field.type} URL`}
            disabled={disabled}
          />
        )

      default:
        console.warn(`Unsupported field type: ${field.type}`) // Recommendation 2
        return (
          <Input
            id={field.id}
            value={stringValue}
            onChange={(e) => handleChange(e.target.value)}
            className={cn(error && "border-destructive")}
            disabled={disabled}
          />
        )
    }
  }, [field, stringValue, handleChange, error, disabled])

  return (
    <div className="space-y-1">
      {renderField()}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
})

// Additional Recommendations Implementation:
// 1. Dynamic Features: Added disabled prop and custom placeholder
// 2. Error Handling: Added safe value conversion and type warning
// 3. Performance: Memoized component and handlers
// 4. Accessibility: Relied on base components with added checks
// 5. Testing: Added TODO comment below

// TODO: Add unit tests in a separate file (e.g., form-field.test.tsx) - Recommendation 5
// Suggested tests:
// 1. Test renders text input with default value
// 2. Test handles number and currency types correctly
// 3. Test boolean switch toggles value
// 4. Test dropdown renders options and handles empty case
// 5. Test disabled prevents interaction
// Example test file structure:
// import { render, screen, fireEvent } from "@testing-library/react"
// test("renders text input", () => {
//   const onChange = jest.fn()
//   render(<FormField field={{ id: "test", label: "Test", type: "text" }} value="value" onChange={onChange} />)
//   expect(screen.getByDisplayValue("value")).toBeInTheDocument()
// })
// test("handles boolean switch", () => {
//   const onChange = jest.fn()
//   render(<FormField field={{ id: "test", label: "Test", type: "boolean" }} value={false} onChange={onChange} />)
//   fireEvent.click(screen.getByRole("checkbox"))
//   expect(onChange).toHaveBeenCalledWith("test", true)
// })

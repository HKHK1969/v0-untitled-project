export interface ValidationRule {
  type: "required" | "email" | "phone" | "url" | "number" | "date" | "minLength" | "maxLength" | "pattern" | "custom"
  value?: any
  message?: string
  validator?: (value: any) => boolean
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  sanitizedValue?: any
}

// Sanitization utilities
export const sanitizeInput = (input: string): string => {
  if (typeof input !== "string") return String(input || "")

  // Remove potentially dangerous characters and scripts
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim()
}

export const sanitizeObject = (obj: Record<string, any>): Record<string, any> => {
  const sanitized: Record<string, any> = {}

  for (const [key, value] of Object.entries(obj)) {
    const sanitizedKey = sanitizeInput(key)

    if (typeof value === "string") {
      sanitized[sanitizedKey] = sanitizeInput(value)
    } else if (Array.isArray(value)) {
      sanitized[sanitizedKey] = value.map((item) => (typeof item === "string" ? sanitizeInput(item) : item))
    } else if (value && typeof value === "object") {
      sanitized[sanitizedKey] = sanitizeObject(value)
    } else {
      sanitized[sanitizedKey] = value
    }
  }

  return sanitized
}

// Validation functions
export const validateField = (value: any, rules: ValidationRule[]): ValidationResult => {
  const errors: string[] = []
  let sanitizedValue = value

  // Sanitize string inputs
  if (typeof value === "string") {
    sanitizedValue = sanitizeInput(value)
  }

  for (const rule of rules) {
    switch (rule.type) {
      case "required":
        if (!sanitizedValue || (typeof sanitizedValue === "string" && sanitizedValue.trim() === "")) {
          errors.push(rule.message || "This field is required")
        }
        break

      case "email":
        if (sanitizedValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedValue)) {
          errors.push(rule.message || "Please enter a valid email address")
        }
        break

      case "phone":
        if (sanitizedValue && !/^[+]?[1-9][\d]{0,15}$/.test(sanitizedValue.replace(/[\s\-$$$$]/g, ""))) {
          errors.push(rule.message || "Please enter a valid phone number")
        }
        break

      case "url":
        if (sanitizedValue) {
          try {
            new URL(sanitizedValue)
          } catch {
            errors.push(rule.message || "Please enter a valid URL")
          }
        }
        break

      case "number":
        if (sanitizedValue && isNaN(Number(sanitizedValue))) {
          errors.push(rule.message || "Please enter a valid number")
        }
        break

      case "date":
        if (sanitizedValue && isNaN(Date.parse(sanitizedValue))) {
          errors.push(rule.message || "Please enter a valid date")
        }
        break

      case "minLength":
        if (sanitizedValue && sanitizedValue.length < (rule.value || 0)) {
          errors.push(rule.message || `Minimum length is ${rule.value} characters`)
        }
        break

      case "maxLength":
        if (sanitizedValue && sanitizedValue.length > (rule.value || 0)) {
          errors.push(rule.message || `Maximum length is ${rule.value} characters`)
        }
        break

      case "pattern":
        if (sanitizedValue && rule.value && !new RegExp(rule.value).test(sanitizedValue)) {
          errors.push(rule.message || "Invalid format")
        }
        break

      case "custom":
        if (rule.validator && !rule.validator(sanitizedValue)) {
          errors.push(rule.message || "Invalid value")
        }
        break
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue,
  }
}

// File validation
export const validateFile = (file: File): ValidationResult => {
  const errors: string[] = []
  const maxSize = 10 * 1024 * 1024 // 10MB
  const allowedTypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "application/vnd.ms-excel", // .xls
    "text/csv", // .csv
    "application/json", // .json
  ]

  // Check file size
  if (file.size > maxSize) {
    errors.push("File size must be less than 10MB")
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    errors.push("Only Excel (.xlsx, .xls), CSV, and JSON files are allowed")
  }

  // Check file name for suspicious patterns
  const suspiciousPatterns = [/\.exe$/i, /\.bat$/i, /\.cmd$/i, /\.scr$/i, /\.js$/i, /\.vbs$/i, /\.php$/i]

  if (suspiciousPatterns.some((pattern) => pattern.test(file.name))) {
    errors.push("File type not allowed for security reasons")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

// JSON validation for imports
export const validateImportData = (data: any): ValidationResult => {
  const errors: string[] = []

  try {
    // Check if data is valid JSON object
    if (typeof data !== "object" || data === null) {
      errors.push("Data must be a valid JSON object")
      return { isValid: false, errors }
    }

    // Check for suspicious properties
    const suspiciousKeys = ["__proto__", "constructor", "prototype", "eval", "function"]
    const checkSuspiciousKeys = (obj: any, path = ""): void => {
      if (typeof obj !== "object" || obj === null) return

      for (const key in obj) {
        const fullPath = path ? `${path}.${key}` : key

        if (suspiciousKeys.some((suspicious) => key.toLowerCase().includes(suspicious))) {
          errors.push(`Suspicious property detected: ${fullPath}`)
        }

        if (typeof obj[key] === "object") {
          checkSuspiciousKeys(obj[key], fullPath)
        }
      }
    }

    checkSuspiciousKeys(data)

    // Check data size (prevent DoS attacks)
    const dataString = JSON.stringify(data)
    if (dataString.length > 50 * 1024 * 1024) {
      // 50MB limit
      errors.push("Data size too large (maximum 50MB)")
    }

    // Sanitize the data
    const sanitizedData = sanitizeObject(data)

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: sanitizedData,
    }
  } catch (error) {
    errors.push("Invalid JSON format")
    return { isValid: false, errors }
  }
}

// Rate limiting helper
export class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map()

  isAllowed(identifier: string, maxAttempts = 5, windowMs = 60000): boolean {
    const now = Date.now()
    const record = this.attempts.get(identifier)

    if (!record || now > record.resetTime) {
      this.attempts.set(identifier, { count: 1, resetTime: now + windowMs })
      return true
    }

    if (record.count >= maxAttempts) {
      return false
    }

    record.count++
    return true
  }

  getRemainingAttempts(identifier: string, maxAttempts = 5): number {
    const record = this.attempts.get(identifier)
    if (!record || Date.now() > record.resetTime) {
      return maxAttempts
    }
    return Math.max(0, maxAttempts - record.count)
  }
}

// Create global rate limiter instance
export const globalRateLimiter = new RateLimiter()

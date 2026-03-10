export interface ParsedData {
  headers: string[]
  rows: Record<string, any>[]
  metadata?: {
    fileName: string
    fileSize: number
    rowCount: number
    columnCount: number
  }
}

export interface ColumnMapping {
  originalName: string
  mappedName: string
  type: "text" | "number" | "date" | "email" | "phone" | "select" | "boolean"
  required: boolean
}

// CSV Parser
export class CSVParser {
  static parse(content: string, fileName = "unknown.csv"): ParsedData {
    const lines = content.split("\n").filter((line) => line.trim())

    if (lines.length === 0) {
      throw new Error("CSV file is empty")
    }

    // Parse headers
    const headers = this.parseCSVLine(lines[0])

    if (headers.length === 0) {
      throw new Error("CSV file must have at least one column")
    }

    // Parse data rows
    const rows: Record<string, any>[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i])

      if (values.length > 0) {
        const row: Record<string, any> = {}

        headers.forEach((header, index) => {
          const value = values[index] || ""
          row[header] = this.convertValue(value)
        })

        rows.push(row)
      }
    }

    return {
      headers,
      rows,
      metadata: {
        fileName,
        fileSize: content.length,
        rowCount: rows.length,
        columnCount: headers.length,
      },
    }
  }

  private static parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ""
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++ // Skip next quote
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === "," && !inQuotes) {
        result.push(current.trim())
        current = ""
      } else {
        current += char
      }
    }

    result.push(current.trim())
    return result.map((value) => value.replace(/^"|"$/g, ""))
  }

  private static convertValue(value: string): any {
    if (!value || value.trim() === "") return null

    const trimmed = value.trim()

    // Try to convert to number
    if (/^-?\d+\.?\d*$/.test(trimmed)) {
      const num = Number(trimmed)
      return isNaN(num) ? trimmed : num
    }

    // Try to convert to boolean
    if (trimmed.toLowerCase() === "true") return true
    if (trimmed.toLowerCase() === "false") return false

    // Try to convert to date
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed) || /^\d{1,2}\/\d{1,2}\/\d{4}/.test(trimmed)) {
      const date = new Date(trimmed)
      if (!isNaN(date.getTime())) {
        return date.toISOString()
      }
    }

    return trimmed
  }
}

// JSON Parser
export class JSONParser {
  static parse(content: string, fileName = "unknown.json"): ParsedData {
    try {
      const data = JSON.parse(content)

      if (Array.isArray(data)) {
        if (data.length === 0) {
          throw new Error("JSON array is empty")
        }

        // Extract headers from first object
        const headers = Object.keys(data[0])

        return {
          headers,
          rows: data,
          metadata: {
            fileName,
            fileSize: content.length,
            rowCount: data.length,
            columnCount: headers.length,
          },
        }
      } else if (typeof data === "object" && data !== null) {
        // Handle object format like { headers: [], data: [] }
        if (data.headers && data.data && Array.isArray(data.headers) && Array.isArray(data.data)) {
          return {
            headers: data.headers,
            rows: data.data,
            metadata: {
              fileName,
              fileSize: content.length,
              rowCount: data.data.length,
              columnCount: data.headers.length,
            },
          }
        }

        // Convert single object to array
        const headers = Object.keys(data)
        return {
          headers,
          rows: [data],
          metadata: {
            fileName,
            fileSize: content.length,
            rowCount: 1,
            columnCount: headers.length,
          },
        }
      }

      throw new Error("JSON must be an array of objects or a single object")
    } catch (error) {
      throw new Error(`Invalid JSON format: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }
}

// Excel Parser (simplified - would need xlsx library for full support)
export class ExcelParser {
  static parse(content: string, fileName = "unknown.xlsx"): ParsedData {
    // For now, we'll provide a helpful error message
    // In a real implementation, you'd use a library like 'xlsx'
    throw new Error(
      "Excel file parsing requires the xlsx library. Please convert your Excel file to CSV format or use the JSON export option from Excel.",
    )
  }
}

// Column mapping utilities
export class ColumnMapper {
  static analyzeColumns(headers: string[]): ColumnMapping[] {
    return headers.map((header) => {
      const mapping: ColumnMapping = {
        originalName: header,
        mappedName: this.cleanColumnName(header),
        type: this.inferColumnType(header),
        required: this.isRequired(header),
      }

      return mapping
    })
  }

  private static cleanColumnName(name: string): string {
    return name
      .replace(/^\*/, "") // Remove required marker
      .replace(/_\w+$/, "") // Remove type suffix
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "")
  }

  private static inferColumnType(name: string): ColumnMapping["type"] {
    const lowerName = name.toLowerCase()

    if (/_email$/.test(lowerName) || lowerName.includes("email")) return "email"
    if (/_phone$/.test(lowerName) || lowerName.includes("phone")) return "phone"
    if (/_date$/.test(lowerName) || lowerName.includes("date")) return "date"
    if (
      /_number$/.test(lowerName) ||
      lowerName.includes("number") ||
      lowerName.includes("qty") ||
      lowerName.includes("amount")
    )
      return "number"
    if (/_select$/.test(lowerName) || lowerName.includes("status") || lowerName.includes("category")) return "select"
    if (/_boolean$/.test(lowerName) || lowerName.includes("active") || lowerName.includes("enabled")) return "boolean"

    return "text"
  }

  private static isRequired(name: string): boolean {
    return name.startsWith("*")
  }
}

// Main file parser
export class FileParser {
  static async parseFile(file: File): Promise<ParsedData> {
    const content = await this.readFileContent(file)

    switch (file.type) {
      case "text/csv":
        return CSVParser.parse(content, file.name)

      case "application/json":
        return JSONParser.parse(content, file.name)

      case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      case "application/vnd.ms-excel":
        return ExcelParser.parse(content, file.name)

      default:
        throw new Error(`Unsupported file type: ${file.type}`)
    }
  }

  private static readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        const result = e.target?.result
        if (typeof result === "string") {
          resolve(result)
        } else {
          reject(new Error("Failed to read file as text"))
        }
      }

      reader.onerror = () => reject(new Error("Failed to read file"))
      reader.readAsText(file)
    })
  }
}

// Export utilities
export class DataExporter {
  static exportToCSV(data: Record<string, any>[], filename = "export.csv"): void {
    if (data.length === 0) {
      throw new Error("No data to export")
    }

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header]
            if (value === null || value === undefined) return ""

            const stringValue = String(value)
            // Escape quotes and wrap in quotes if contains comma or quote
            if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
              return `"${stringValue.replace(/"/g, '""')}"`
            }
            return stringValue
          })
          .join(","),
      ),
    ].join("\n")

    this.downloadFile(csvContent, filename, "text/csv")
  }

  static exportToJSON(data: any, filename = "export.json"): void {
    const jsonContent = JSON.stringify(data, null, 2)
    this.downloadFile(jsonContent, filename, "application/json")
  }

  private static downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    URL.revokeObjectURL(url)
  }
}

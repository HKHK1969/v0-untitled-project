type LogLevel = "debug" | "info" | "warn" | "error"

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, any>
  error?: Error
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development"
  private isProduction = process.env.NODE_ENV === "production"

  private formatMessage(entry: LogEntry): string {
    const { level, message, timestamp, context, error } = entry
    let formatted = `[${timestamp}] [${level.toUpperCase()}] ${message}`

    if (context && Object.keys(context).length > 0) {
      formatted += ` | Context: ${JSON.stringify(context)}`
    }

    if (error) {
      formatted += ` | Error: ${error.message}`
      if (error.stack && this.isDevelopment) {
        formatted += `\n${error.stack}`
      }
    }

    return formatted
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
    }

    // In development, log to console
    if (this.isDevelopment) {
      const formatted = this.formatMessage(entry)
      switch (level) {
        case "debug":
          console.debug(formatted)
          break
        case "info":
          console.info(formatted)
          break
        case "warn":
          console.warn(formatted)
          break
        case "error":
          console.error(formatted)
          break
      }
    }

    // In production, send to external service (e.g., Sentry, LogRocket)
    if (this.isProduction && (level === "error" || level === "warn")) {
      this.sendToExternalService(entry)
    }
  }

  private sendToExternalService(entry: LogEntry): void {
    // TODO: Integrate with Sentry or other logging service
    // Example: Sentry.captureMessage(entry.message, { level: entry.level, extra: entry.context })

    // For now, store in localStorage for debugging
    try {
      const logs = JSON.parse(localStorage.getItem("app_logs") || "[]")
      logs.push(entry)
      // Keep only last 100 logs
      if (logs.length > 100) {
        logs.shift()
      }
      localStorage.setItem("app_logs", JSON.stringify(logs))
    } catch (e) {
      // Silently fail if localStorage is not available
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log("debug", message, context)
  }

  info(message: string, context?: Record<string, any>): void {
    this.log("info", message, context)
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log("warn", message, context)
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log("error", message, context, error)
  }
}

export const logger = new Logger()

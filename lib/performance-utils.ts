"use client"

import { useState, useEffect, useMemo } from "react"

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export function createMemoizedFilter<T>(items: T[], filterFn: (item: T) => boolean, dependencies: any[]): T[] {
  return useMemo(() => {
    return items.filter(filterFn)
  }, [items, filterFn, ...dependencies])
}

export function createMemoizedSort<T>(items: T[], sortFn: (a: T, b: T) => number, dependencies: any[]): T[] {
  return useMemo(() => {
    return [...items].sort(sortFn)
  }, [items, sortFn, ...dependencies])
}

export class PerformanceMonitor {
  private static measurements: Map<string, number> = new Map()

  static startMeasurement(name: string): void {
    this.measurements.set(name, performance.now())
  }

  static endMeasurement(name: string): number {
    const startTime = this.measurements.get(name)
    if (startTime === undefined) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`No measurement started for: ${name}`)
      }
      return 0
    }

    const duration = performance.now() - startTime
    this.measurements.delete(name)
    if (process.env.NODE_ENV === "development") {
      console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`)
    }
    return duration
  }

  static clearMeasurements(): void {
    this.measurements.clear()
  }
}

export class MemoryManager {
  private static cache: Map<string, { value: any; expiry: number }> = new Map()
  private static cleanupInterval: NodeJS.Timeout | null = null

  static get<T>(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }

    return item.value
  }

  static set<T>(key: string, value: T, ttlMs = 300000): void {
    const expiry = Date.now() + ttlMs
    this.cache.set(key, { value, expiry })
  }

  static clear(key?: string): void {
    if (key) {
      this.cache.delete(key)
    } else {
      this.cache.clear()
    }
  }

  static size(): number {
    return this.cache.size
  }

  static cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key)
      }
    }
  }

  static startCleanupInterval(): void {
    if (typeof window !== "undefined" && !this.cleanupInterval) {
      this.cleanupInterval = setInterval(() => {
        this.cleanup()
      }, 300000) // 5 minutes
    }
  }

  static stopCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }
}

if (typeof window !== "undefined") {
  MemoryManager.startCleanupInterval()
}

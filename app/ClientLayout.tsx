"use client"

import React from "react"

import { useState } from "react"
import Link from "next/link"
import { Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeProvider } from "next-themes"
import { ErrorBoundary } from "react-error-boundary"
import { DataPersistenceInitializer } from "@/components/data-persistence-initializer"
import { DataRecoveryNotification } from "@/components/data-recovery-notification"
import { SonnerProvider } from "@/components/sonner-provider"

interface DataContextType {
  tables: any[]
  setTables: (tables: any[]) => void
  records: Record<string, any[]>
  setRecords: (records: Record<string, any[]>) => void
  updateRecord: (tableId: string, recordId: string, updates: any) => void
  addRecord: (tableId: string, record: any) => void
  deleteRecord: (tableId: string, recordId: string) => void
  getTable: (tableId: string) => any
  getRecord: (tableId: string, recordId: string) => any
}

const DataContext = React.createContext<DataContextType | null>(null)

export function useData() {
  const context = React.useContext(DataContext)
  if (!context) {
    throw new Error("useData must be used within a DataContextProvider")
  }
  return context
}

function DataContextProvider({ children }: { children: React.ReactNode }) {
  const [tables, setTables] = useState<any[]>([])
  const [records, setRecords] = useState<Record<string, any[]>>({})

  const updateRecord = (tableId: string, recordId: string, updates: any) => {
    setRecords((prev) => ({
      ...prev,
      [tableId]: prev[tableId]?.map((record) => (record.id === recordId ? { ...record, ...updates } : record)) || [],
    }))
  }

  const addRecord = (tableId: string, record: any) => {
    setRecords((prev) => ({
      ...prev,
      [tableId]: [...(prev[tableId] || []), record],
    }))
  }

  const deleteRecord = (tableId: string, recordId: string) => {
    setRecords((prev) => ({
      ...prev,
      [tableId]: prev[tableId]?.filter((record) => record.id !== recordId) || [],
    }))
  }

  const getTable = (tableId: string) => {
    return tables.find((table) => table.id === tableId)
  }

  const getRecord = (tableId: string, recordId: string) => {
    return records[tableId]?.find((record) => record.id === recordId)
  }

  return (
    <DataContext.Provider
      value={{
        tables,
        setTables,
        records,
        setRecords,
        updateRecord,
        addRecord,
        deleteRecord,
        getTable,
        getRecord,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="container flex max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-muted-foreground">
          ClientLayout Error: {error.message} {JSON.stringify(error, null, 2)}
        </p>
        <Button onClick={() => window.location.reload()}>Try again</Button>
      </div>
    </div>
  )
}

function ClientLayoutComponent({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <DataContextProvider>
          <div className="flex min-h-screen flex-col">
            <header className="bg-background border-b">
              <div className="container flex h-16 items-center px-4 md:px-6">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard" className="flex items-center gap-2">
                      <span className="text-lg" role="img" aria-label="Ninja">&#x1F977;</span>
                      <span className="sr-only">Home</span>
                    </Link>
                  </Button>
                  <Link href="/" className="text-lg font-semibold">
                    Apparel Supply Chain Tracker
                  </Link>
                </div>
                <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
                  <Link href="/dashboard" className="text-sm font-medium hover:underline underline-offset-4">
                    Dashboard
                  </Link>
                  <Link href="/tables" className="text-sm font-medium hover:underline underline-offset-4">
                    Tables
                  </Link>
                  <Link href="/analytics" className="text-sm font-medium hover:underline underline-offset-4">
                    Analytics
                  </Link>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard">
                      <Home className="h-4 w-4 mr-2" />
                      Home
                    </Link>
                  </Button>
                </nav>
              </div>
            </header>
            <main className="flex-1">
              <DataPersistenceInitializer />
              <DataRecoveryNotification />
              {children}
            </main>
          </div>
          <SonnerProvider />
        </DataContextProvider>
      </ErrorBoundary>
    </ThemeProvider>
  )
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return <ClientLayoutComponent>{children}</ClientLayoutComponent>
}

"use client"

import { useState, memo, createContext, useContext, useMemo } from "react"
import type React from "react"

// Props interface
interface ClientLayoutProps {
  children: React.ReactNode
}

// Global state context
interface DataContextType {
  dataInitialized: boolean
  setDataInitialized: (value: boolean) => void
  appVersion: string
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export const DataContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dataInitialized, setDataInitialized] = useState<boolean>(false)
  const [appVersion] = useState<string>("1.0.0")

  const value = useMemo(
    () => ({
      dataInitialized,
      setDataInitialized,
      appVersion,
    }),
    [dataInitialized, appVersion],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export const useDataContext = (): DataContextType => {
  const context = useContext(DataContext)
  if (!context) throw new Error("useDataContext must be used within DataContextProvider")
  return context
}

// Main layout component - simplified, no longer renders html/body
const ClientLayoutComponent: React.FC<ClientLayoutProps> = ({ children }) => {
  return <>{children}</>
}

// Memoized export with explicit typing
export const ClientLayout: React.ComponentType<ClientLayoutProps> = memo(ClientLayoutComponent)

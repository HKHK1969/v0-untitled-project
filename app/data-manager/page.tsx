"use client"

import DataManager from "../data-manager"
import { useEffect } from "react"

export default function DataManagerPage() {
  useEffect(() => {
    // Future-proofing: Handle any necessary setup or cleanup
    console.log("DataManagerPage mounted")
    return () => console.log("DataManagerPage unmounted")
  }, [])

  return <DataManager />
}

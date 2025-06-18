import { memo } from "react"

/**
 * A simple loading component that renders nothing.
 * Used as a placeholder during data fetching or async operations.
 * @returns {null} Always returns null to render nothing
 */
const Loading = (): null => {
  return null
}

// Memoize the component to prevent unnecessary re-renders
export default memo(Loading)

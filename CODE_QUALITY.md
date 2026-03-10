# Code Quality Guidelines

This document outlines code quality standards and best practices for the project.

## TypeScript Best Practices

### 1. Avoid `any` Type

❌ **Bad:**
\`\`\`typescript
function processData(data: any) {
  return data.map((item: any) => item.value)
}
\`\`\`

✅ **Good:**
\`\`\`typescript
interface DataItem {
  value: string
  id: number
}

function processData(data: DataItem[]): string[] {
  return data.map((item) => item.value)
}
\`\`\`

### 2. Use Type Guards

❌ **Bad:**
\`\`\`typescript
function getValue(obj: any) {
  return obj.value
}
\`\`\`

✅ **Good:**
\`\`\`typescript
interface HasValue {
  value: string
}

function isHasValue(obj: unknown): obj is HasValue {
  return typeof obj === "object" && obj !== null && "value" in obj
}

function getValue(obj: unknown): string | undefined {
  if (isHasValue(obj)) {
    return obj.value
  }
  return undefined
}
\`\`\`

### 3. Handle Null/Undefined

❌ **Bad:**
\`\`\`typescript
function getFirstItem(arr: string[]) {
  return arr[0].toUpperCase()
}
\`\`\`

✅ **Good:**
\`\`\`typescript
function getFirstItem(arr: string[]): string | undefined {
  return arr[0]?.toUpperCase()
}
\`\`\`

### 4. Validate Array Operations

❌ **Bad:**
\`\`\`typescript
function processRecords(records: any) {
  return records.map((r: any) => r.name)
}
\`\`\`

✅ **Good:**
\`\`\`typescript
interface Record {
  name: string
  id: number
}

function processRecords(records: unknown): string[] {
  if (!Array.isArray(records)) {
    console.error("Expected array, got:", typeof records)
    return []
  }
  
  return records
    .filter((r): r is Record => 
      typeof r === "object" && 
      r !== null && 
      "name" in r && 
      typeof r.name === "string"
    )
    .map((r) => r.name)
}
\`\`\`

### 5. Use Proper Error Handling

❌ **Bad:**
\`\`\`typescript
function parseJSON(str: string) {
  return JSON.parse(str)
}
\`\`\`

✅ **Good:**
\`\`\`typescript
function parseJSON<T>(str: string): T | null {
  try {
    return JSON.parse(str) as T
  } catch (error) {
    console.error("JSON parse error:", error)
    return null
  }
}
\`\`\`

## React Best Practices

### 1. Use Proper Prop Types

❌ **Bad:**
\`\`\`typescript
function Component({ data }: { data: any }) {
  return <div>{data.name}</div>
}
\`\`\`

✅ **Good:**
\`\`\`typescript
interface ComponentProps {
  data: {
    name: string
    id: number
  }
}

function Component({ data }: ComponentProps) {
  return <div>{data.name}</div>
}
\`\`\`

### 2. Handle Loading and Error States

❌ **Bad:**
\`\`\`typescript
function DataComponent() {
  const [data, setData] = useState([])
  
  useEffect(() => {
    fetch("/api/data").then((r) => r.json()).then(setData)
  }, [])
  
  return <div>{data.map((item) => <div key={item.id}>{item.name}</div>)}</div>
}
\`\`\`

✅ **Good:**
\`\`\`typescript
interface DataItem {
  id: number
  name: string
}

function DataComponent() {
  const [data, setData] = useState<DataItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    fetch("/api/data")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch")
        return r.json()
      })
      .then((data: DataItem[]) => {
        setData(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])
  
  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (data.length === 0) return <div>No data</div>
  
  return (
    <div>
      {data.map((item) => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  )
}
\`\`\`

### 3. Memoize Expensive Computations

❌ **Bad:**
\`\`\`typescript
function Component({ items }: { items: Item[] }) {
  const sortedItems = items.sort((a, b) => a.name.localeCompare(b.name))
  return <div>{sortedItems.map((item) => <div key={item.id}>{item.name}</div>)}</div>
}
\`\`\`

✅ **Good:**
\`\`\`typescript
function Component({ items }: { items: Item[] }) {
  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.name.localeCompare(b.name)),
    [items]
  )
  
  return (
    <div>
      {sortedItems.map((item) => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  )
}
\`\`\`

## localStorage Best Practices

### 1. Always Use Try-Catch

❌ **Bad:**
\`\`\`typescript
function saveData(key: string, data: any) {
  localStorage.setItem(key, JSON.stringify(data))
}
\`\`\`

✅ **Good:**
\`\`\`typescript
function saveData<T>(key: string, data: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(data))
    return true
  } catch (error) {
    console.error(`Failed to save data to localStorage:`, error)
    return false
  }
}
\`\`\`

### 2. Validate Retrieved Data

❌ **Bad:**
\`\`\`typescript
function loadData(key: string) {
  const data = localStorage.getItem(key)
  return JSON.parse(data!)
}
\`\`\`

✅ **Good:**
\`\`\`typescript
function loadData<T>(key: string, validator?: (data: unknown) => data is T): T | null {
  try {
    const data = localStorage.getItem(key)
    if (!data) return null
    
    const parsed = JSON.parse(data)
    
    if (validator && !validator(parsed)) {
      console.error(`Invalid data format for key: ${key}`)
      return null
    }
    
    return parsed as T
  } catch (error) {
    console.error(`Failed to load data from localStorage:`, error)
    return null
  }
}
\`\`\`

## Performance Best Practices

### 1. Debounce Expensive Operations

\`\`\`typescript
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }
    
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Usage
const debouncedSearch = debounce((query: string) => {
  // Expensive search operation
}, 300)
\`\`\`

### 2. Use Virtual Scrolling for Large Lists

For lists with 100+ items, consider using virtual scrolling libraries like `react-window` or `react-virtual`.

### 3. Lazy Load Components

\`\`\`typescript
import { lazy, Suspense } from "react"

const HeavyComponent = lazy(() => import("./HeavyComponent"))

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HeavyComponent />
    </Suspense>
  )
}
\`\`\`

## Security Best Practices

### 1. Sanitize User Input

Always sanitize user input before displaying or storing it. Use the validation utilities in `lib/validation.ts`.

### 2. Validate File Uploads

Use the `validateFile` function from `lib/validation.ts` to validate file uploads.

### 3. Implement Rate Limiting

Use the `RateLimiter` class from `lib/validation.ts` to prevent abuse.

### 4. Use Environment Variables for Secrets

Never commit secrets to the repository. Use environment variables and `.env.local`.

## Testing Best Practices

### 1. Test User Interactions

Focus on testing what users do, not implementation details.

### 2. Use Testing Library Queries

Prefer `getByRole`, `getByLabelText`, and `getByText` over `getByTestId`.

### 3. Test Error States

Always test error handling and edge cases.

### 4. Mock External Dependencies

Mock API calls, localStorage, and other external dependencies.

## Code Review Checklist

- [ ] No `any` types used
- [ ] Proper null/undefined checks
- [ ] Array operations validated
- [ ] Error handling implemented
- [ ] localStorage operations wrapped in try-catch
- [ ] Props properly typed
- [ ] Loading and error states handled
- [ ] Expensive operations memoized
- [ ] User input sanitized
- [ ] Tests written for new features
- [ ] No console.log statements (use logger instead)
- [ ] Accessibility attributes added
- [ ] Performance considered
- [ ] Security implications reviewed

# Testing Guide

This document provides guidelines for testing the Apparel Supply Chain Tracker application.

## Test Setup

The project uses Jest and React Testing Library for unit and integration tests.

### Running Tests

\`\`\`bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test

# Run tests in CI mode
pnpm test:ci
\`\`\`

## Test Structure

Tests should be placed in `__tests__` directories or alongside the files they test with a `.test.ts` or `.spec.ts` suffix.

\`\`\`
app/
  __tests__/
    page.test.tsx
components/
  ui/
    button.test.tsx
lib/
  __tests__/
    data-persistence.test.ts
\`\`\`

## Writing Tests

### Component Tests

\`\`\`typescript
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    screen.getByText('Click me').click()
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
\`\`\`

### Utility Function Tests

\`\`\`typescript
import { DataPersistence } from '@/lib/data-persistence'

describe('DataPersistence', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saves data to localStorage', () => {
    const testData = [{ id: '1', name: 'Test' }]
    DataPersistence.saveTable('test', testData)
    
    const saved = localStorage.getItem('table_test_data')
    expect(saved).toBeTruthy()
    expect(JSON.parse(saved!)).toEqual(testData)
  })
})
\`\`\`

### API Route Tests

\`\`\`typescript
import { POST } from '@/app/api/ai-assistant/route'
import { NextRequest } from 'next/server'

describe('AI Assistant API', () => {
  it('returns a response for valid input', async () => {
    const request = new NextRequest('http://localhost:3000/api/ai-assistant', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'show me all delayed orders' }]
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.content).toBeTruthy()
  })

  it('handles rate limiting', async () => {
    // Make multiple requests to trigger rate limit
    const requests = Array(25).fill(null).map(() => 
      new NextRequest('http://localhost:3000/api/ai-assistant', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'test' }]
        })
      })
    )

    const responses = await Promise.all(requests.map(req => POST(req)))
    const rateLimited = responses.some(res => res.status === 429)
    
    expect(rateLimited).toBe(true)
  })
})
\`\`\`

## Coverage Requirements

The project aims for the following coverage thresholds:
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

## Best Practices

1. **Test behavior, not implementation** - Focus on what the component does, not how it does it
2. **Use meaningful test descriptions** - Describe what the test is verifying
3. **Keep tests isolated** - Each test should be independent and not rely on others
4. **Mock external dependencies** - Use Jest mocks for API calls, localStorage, etc.
5. **Test edge cases** - Include tests for error states, empty data, and boundary conditions
6. **Use data-testid sparingly** - Prefer accessible queries (getByRole, getByLabelText)

## Continuous Integration

Tests run automatically on every push and pull request via GitHub Actions. The CI pipeline:
1. Installs dependencies with frozen lockfile
2. Runs linter
3. Runs type checking
4. Runs tests with coverage
5. Builds the application

All checks must pass before merging to main.

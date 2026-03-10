# Sentry Integration Guide

This guide explains how to integrate Sentry for error tracking and monitoring in production.

## Setup

### 1. Install Sentry SDK

\`\`\`bash
pnpm add @sentry/nextjs
\`\`\`

### 2. Initialize Sentry

Create `sentry.client.config.ts` in the root directory:

\`\`\`typescript
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  
  // Capture Replay for 10% of all sessions,
  // plus 100% of sessions with an error
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Note: if you want to override the automatic release value, do not set a
  // `release` value here - use the environment variable `SENTRY_RELEASE`, so
  // that it will also get attached to your source maps
  
  environment: process.env.NODE_ENV,
  
  beforeSend(event, hint) {
    // Filter out certain errors
    if (event.exception) {
      const error = hint.originalException
      
      // Don't send network errors in development
      if (process.env.NODE_ENV === "development" && error instanceof TypeError) {
        return null
      }
    }
    
    return event
  },
  
  integrations: [
    new Sentry.BrowserTracing({
      // Set sampling rate for performance monitoring
      tracePropagationTargets: ["localhost", /^https:\/\/yourapp\.com/],
    }),
    new Sentry.Replay({
      // Mask all text content, input values, and sensitive data
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
})
\`\`\`

Create `sentry.server.config.ts` in the root directory:

\`\`\`typescript
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  
  environment: process.env.NODE_ENV,
  
  beforeSend(event, hint) {
    // Don't send certain server errors
    if (event.exception) {
      const error = hint.originalException
      
      // Filter out expected errors
      if (error instanceof Error && error.message.includes("ECONNREFUSED")) {
        return null
      }
    }
    
    return event
  },
})
\`\`\`

Create `sentry.edge.config.ts` in the root directory:

\`\`\`typescript
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
})
\`\`\`

### 3. Update next.config.mjs

Add Sentry webpack plugin configuration:

\`\`\`javascript
import { withSentryConfig } from "@sentry/nextjs"

const nextConfig = {
  // ... existing config
}

export default withSentryConfig(
  nextConfig,
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    // Suppresses source map uploading logs during build
    silent: true,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
  },
  {
    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Transpiles SDK to be compatible with IE11 (increases bundle size)
    transpileClientSDK: false,

    // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
    tunnelRoute: "/monitoring",

    // Hides source maps from generated client bundles
    hideSourceMaps: true,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,
  }
)
\`\`\`

### 4. Environment Variables

Add to `.env.local`:

\`\`\`env
# Sentry Configuration
SENTRY_DSN=https://your-dsn@sentry.io/your-project-id
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/your-project-id
SENTRY_ORG=your-org-name
SENTRY_PROJECT=your-project-name
SENTRY_AUTH_TOKEN=your-auth-token
\`\`\`

Add to `.env.example`:

\`\`\`env
# Sentry Error Tracking (Optional - for production monitoring)
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=
\`\`\`

### 5. Update ErrorLogger

The `lib/error-handling.ts` file already has Sentry integration points. Update it to use Sentry:

\`\`\`typescript
import * as Sentry from "@sentry/nextjs"

// In the ErrorLogger.logError method:
if (process.env.NODE_ENV === "production" && typeof window !== "undefined") {
  try {
    Sentry.captureException(error, {
      level: severity,
      tags: {
        component: context,
        ...metadata,
      },
      extra: {
        metadata,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (e) {
    console.error("Failed to send error to Sentry:", e)
  }
}
\`\`\`

## Usage

### Capturing Errors

\`\`\`typescript
import { ErrorLogger } from "@/lib/error-handling"

try {
  // Your code
} catch (error) {
  ErrorLogger.logError(error, "ComponentName", "error", {
    userId: user.id,
    action: "submit_form",
  })
}
\`\`\`

### Capturing Messages

\`\`\`typescript
import * as Sentry from "@sentry/nextjs"

Sentry.captureMessage("Something important happened", "info")
\`\`\`

### Setting User Context

\`\`\`typescript
import * as Sentry from "@sentry/nextjs"

Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.name,
})
\`\`\`

### Adding Breadcrumbs

\`\`\`typescript
import * as Sentry from "@sentry/nextjs"

Sentry.addBreadcrumb({
  category: "auth",
  message: "User logged in",
  level: "info",
})
\`\`\`

## Testing

Test Sentry integration in development:

\`\`\`typescript
// Add a test button in your app
<Button onClick={() => {
  throw new Error("Test Sentry Error")
}}>
  Test Sentry
</Button>
\`\`\`

## Best Practices

1. **Filter Sensitive Data**: Use `beforeSend` to remove sensitive information
2. **Set Sample Rates**: Adjust `tracesSampleRate` based on traffic
3. **Use Breadcrumbs**: Add context before errors occur
4. **Tag Errors**: Use tags for better filtering and searching
5. **Monitor Performance**: Enable performance monitoring for slow operations
6. **Set User Context**: Identify users experiencing errors
7. **Create Alerts**: Set up alerts for critical errors
8. **Review Regularly**: Check Sentry dashboard weekly

## Troubleshooting

### Source Maps Not Uploading

Ensure `SENTRY_AUTH_TOKEN` is set and has the correct permissions.

### Too Many Events

Adjust sample rates or add filters in `beforeSend`.

### Missing Context

Add more breadcrumbs and metadata to error logs.

### Performance Issues

Reduce `tracesSampleRate` or disable certain integrations.

## Resources

- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Error Monitoring Best Practices](https://docs.sentry.io/product/best-practices/)
- [Sentry Performance Monitoring](https://docs.sentry.io/product/performance/)

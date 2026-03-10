export const DEPLOYMENT_CONFIG = {
  // Environment detection
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
  isPilot: process.env.NEXT_PUBLIC_DEPLOYMENT_STAGE === "pilot",

  // Feature flags for pilot version
  features: {
    // Core features (always enabled)
    authentication: true,
    dataManagement: true,
    basicAnalytics: true,

    // Pilot features (can be toggled)
    advancedAnalytics: process.env.NEXT_PUBLIC_ENABLE_ADVANCED_ANALYTICS === "true",
    aiAssistant: process.env.NEXT_PUBLIC_ENABLE_AI_ASSISTANT === "true",
    feedbackSystem: true, // Always enabled for pilot
    onboarding: true, // Always enabled for pilot

    // Future features (disabled in pilot)
    multiTenant: false,
    advancedReporting: false,
    apiIntegrations: false,
    mobileApp: false,
  },

  // Pilot-specific settings
  pilot: {
    maxUsers: 50,
    maxDataRows: 10000,
    enableBetaBadge: true,
    showFeedbackPrompts: true,
    enableDetailedLogging: true,
    restrictedFeatures: ["bulk-import", "advanced-exports", "custom-integrations"],
  },

  // Performance settings
  performance: {
    enableServiceWorker: process.env.NEXT_PUBLIC_ENABLE_SW === "true",
    enableAnalytics: true,
    enableErrorReporting: true,
    cacheStrategy: "stale-while-revalidate",
  },

  // Security settings
  security: {
    enableCSP: true,
    enableRateLimit: true,
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    maxLoginAttempts: 5,
  },

  // URLs and endpoints
  urls: {
    app: process.env.NEXT_PUBLIC_APP_URL || "https://sourcing-ninja.vercel.app",
    api: process.env.NEXT_PUBLIC_API_URL || "/api",
    support: "https://vercel.com/help",
    docs: "https://docs.sourcing-ninja.com",
    feedback: "/feedback",
  },

  // Contact information
  contact: {
    support: "support@sourcing-ninja.com",
    feedback: "feedback@sourcing-ninja.com",
    emergency: "urgent@sourcing-ninja.com",
  },

  // Version information
  version: {
    app: "1.0.0-pilot",
    api: "1.0.0",
    lastUpdated: new Date().toISOString(),
  },
}

// Feature flag helper
export function isFeatureEnabled(featureName: keyof typeof DEPLOYMENT_CONFIG.features): boolean {
  return DEPLOYMENT_CONFIG.features[featureName] === true
}

// Pilot restrictions helper
export function isPilotRestricted(featureName: string): boolean {
  return DEPLOYMENT_CONFIG.pilot.restrictedFeatures.includes(featureName)
}

// Environment helpers
export const env = {
  isDev: DEPLOYMENT_CONFIG.isDevelopment,
  isProd: DEPLOYMENT_CONFIG.isProduction,
  isPilot: DEPLOYMENT_CONFIG.isPilot,
}

export function getDeploymentConfig() {
  return DEPLOYMENT_CONFIG
}

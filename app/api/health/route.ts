import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { DEPLOYMENT_CONFIG } from "@/lib/deployment-config"

export async function GET() {
  const startTime = Date.now()

  try {
    // Check database connection
    const supabase = await createClient()
    const { data, error } = await supabase.from("user_onboarding").select("count").limit(1)

    if (error) {
      throw new Error(`Database check failed: ${error.message}`)
    }

    const responseTime = Date.now() - startTime

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: DEPLOYMENT_CONFIG.version.app,
      environment: DEPLOYMENT_CONFIG.isPilot ? "pilot" : "production",
      services: {
        database: "operational",
        authentication: "operational",
        api: "operational",
      },
      performance: {
        responseTime: `${responseTime}ms`,
        uptime: process.uptime(),
      },
      deployment: {
        stage: DEPLOYMENT_CONFIG.isPilot ? "pilot" : "production",
        features: Object.entries(DEPLOYMENT_CONFIG.features)
          .filter(([_, enabled]) => enabled)
          .map(([name]) => name),
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
        version: DEPLOYMENT_CONFIG.version.app,
      },
      { status: 503 },
    )
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { requireSection, runZyber } from "@/lib/api-route"
import { zyberPut } from "@/lib/zyber-api"
import { dbProd } from "@/db/prod/drizzle"
import { appVersionConfig } from "@/db/prod/schema"
import type { FeatureFlags, VersionConfig } from "@/lib/zyber-types"

export async function GET() {
  const auth = await requireSection("version")
  if (auth.error) return auth.error

  try {
    const rows = await dbProd
      .select()
      .from(appVersionConfig)
      .where(eq(appVersionConfig.id, 1))
      .limit(1)
    const row = rows[0]
    if (!row) {
      return NextResponse.json(
        { error: "version config not initialized" },
        { status: 500 },
      )
    }
    const payload: VersionConfig = {
      latest_version: row.latestVersion,
      min_supported_version: row.minSupportedVersion,
      force_update: row.forceUpdate,
      maintenance_mode: row.maintenanceMode,
      ios_update_url: row.iosUpdateUrl,
      android_update_url: row.androidUpdateUrl,
      featureFlags: row.featureFlags as FeatureFlags,
      workEmailOpen: row.workEmailOpen,
    }
    return NextResponse.json(payload)
  } catch (err) {
    const message = err instanceof Error ? err.message : "internal error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// PUT stays proxied: the Go server keeps an in-memory cache of the version
// config and serves it to mobile clients. Writing directly to Postgres would
// leave the Go process with stale data until restart.
export async function PUT(req: NextRequest) {
  const auth = await requireSection("version")
  if (auth.error) return auth.error
  const body = await req.json().catch(() => ({}))
  return runZyber(() => zyberPut<VersionConfig>("", body))
}

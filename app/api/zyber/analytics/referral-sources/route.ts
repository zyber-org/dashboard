import { NextResponse } from "next/server"
import { sql } from "drizzle-orm"
import { requireSection } from "@/lib/api-route"
import { dbProd } from "@/db/prod/drizzle"
import { userReferralSources } from "@/db/prod/schema"
import type { ReferralAnalytics } from "@/lib/zyber-types"

export async function GET() {
  const auth = await requireSection("telemetry")
  if (auth.error) return auth.error

  try {
    const rows = await dbProd
      .select({
        source: userReferralSources.source,
        count: sql<number>`count(*)::int`,
      })
      .from(userReferralSources)
      .groupBy(userReferralSources.source)

    const sources: Record<string, number> = {}
    for (const row of rows) {
      sources[row.source] = row.count
    }
    const payload: ReferralAnalytics = { sources }
    return NextResponse.json(payload)
  } catch (err) {
    const message = err instanceof Error ? err.message : "internal error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

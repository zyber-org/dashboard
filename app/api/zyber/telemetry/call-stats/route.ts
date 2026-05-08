import { type NextRequest } from "next/server"
import { requireSection, runZyber } from "@/lib/api-route"
import { zyberGet } from "@/lib/zyber-api"
import type { DailyCallStatsResponse } from "@/lib/zyber-types"

export async function GET(req: NextRequest) {
  const auth = await requireSection("telemetry")
  if (auth.error) return auth.error
  const days = req.nextUrl.searchParams.get("days") ?? "30"
  return runZyber(() =>
    zyberGet<DailyCallStatsResponse>("/admin/telemetry/call-stats", { days }),
  )
}

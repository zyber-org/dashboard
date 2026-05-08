import { requireSection, runZyber } from "@/lib/api-route"
import { zyberGet } from "@/lib/zyber-api"
import type { ReferralAnalytics } from "@/lib/zyber-types"

export async function GET() {
  const auth = await requireSection("telemetry")
  if (auth.error) return auth.error
  return runZyber(() =>
    zyberGet<ReferralAnalytics>("/admin/analytics/referral-sources"),
  )
}

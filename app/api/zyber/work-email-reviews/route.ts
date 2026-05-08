import { requireSection, runZyber } from "@/lib/api-route"
import { zyberGet } from "@/lib/zyber-api"
import type { WorkEmailReviewRequest } from "@/lib/zyber-types"

export async function GET() {
  const auth = await requireSection("work-email")
  if (auth.error) return auth.error
  return runZyber(() =>
    zyberGet<{ requests: WorkEmailReviewRequest[] }>(
      "/admin/work-email-reviews",
    ),
  )
}

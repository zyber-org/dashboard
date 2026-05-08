import { requireSection, runZyber } from "@/lib/api-route"
import { zyberGet } from "@/lib/zyber-api"
import type { PendingCommunity } from "@/lib/zyber-types"

export async function GET() {
  const auth = await requireSection("communities")
  if (auth.error) return auth.error
  return runZyber(() =>
    zyberGet<{ communities: PendingCommunity[] }>(
      "/admin/communities/pending",
    ),
  )
}

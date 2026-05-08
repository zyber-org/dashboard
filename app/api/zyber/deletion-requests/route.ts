import { type NextRequest } from "next/server"
import { requireSection, runZyber } from "@/lib/api-route"
import { zyberGet } from "@/lib/zyber-api"
import type { DeletionRequestsPage } from "@/lib/zyber-types"

export async function GET(req: NextRequest) {
  const auth = await requireSection("deletion-requests")
  if (auth.error) return auth.error
  const params = req.nextUrl.searchParams
  return runZyber(() =>
    zyberGet<DeletionRequestsPage>("/deletion-requests", {
      status: params.get("status") ?? "",
      limit: params.get("limit") ?? "20",
      offset: params.get("offset") ?? "0",
    }),
  )
}

import { type NextRequest } from "next/server"
import { requireSection, runZyber } from "@/lib/api-route"
import { zyberGet } from "@/lib/zyber-api"
import type { LiveUsersPage } from "@/lib/zyber-types"

export async function GET(req: NextRequest) {
  const auth = await requireSection("live")
  if (auth.error) return auth.error
  const params = req.nextUrl.searchParams
  return runZyber(() =>
    zyberGet<LiveUsersPage>("/admin/users/live", {
      page: params.get("page") ?? "1",
      limit: params.get("limit") ?? "50",
    }),
  )
}

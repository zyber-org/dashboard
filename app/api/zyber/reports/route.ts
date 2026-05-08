import { type NextRequest } from "next/server"
import { requireSection, runZyber } from "@/lib/api-route"
import { zyberGet } from "@/lib/zyber-api"
import type { UserReportsPage } from "@/lib/zyber-types"

export async function GET(req: NextRequest) {
  const auth = await requireSection("reports")
  if (auth.error) return auth.error
  const params = req.nextUrl.searchParams
  return runZyber(() =>
    zyberGet<UserReportsPage>("/reports", {
      status: params.get("status") ?? "",
      limit: params.get("limit") ?? "20",
      offset: params.get("offset") ?? "0",
    }),
  )
}

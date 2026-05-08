import { type NextRequest } from "next/server"
import { requireSection, runZyber } from "@/lib/api-route"
import { zyberGet } from "@/lib/zyber-api"
import type { AdminUsersPage } from "@/lib/zyber-types"

export async function GET(req: NextRequest) {
  const auth = await requireSection("users")
  if (auth.error) return auth.error
  const params = req.nextUrl.searchParams
  const query: Record<string, string> = {}
  for (const key of [
    "page",
    "limit",
    "search",
    "active",
    "disabled",
    "college",
    "work_email",
    "onboarding",
    "sort",
    "order",
  ]) {
    const v = params.get(key)
    if (v) query[key] = v
  }
  return runZyber(() => zyberGet<AdminUsersPage>("/admin/users", query))
}

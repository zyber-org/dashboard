import { type NextRequest, NextResponse } from "next/server"
import { requireSection, runZyber } from "@/lib/api-route"
import { zyberGet, zyberPost } from "@/lib/zyber-api"
import type {
  AdminCommunitiesPage,
  AdminCommunity,
} from "@/lib/zyber-types"

export async function GET(req: NextRequest) {
  const auth = await requireSection("communities")
  if (auth.error) return auth.error
  const params = req.nextUrl.searchParams
  return runZyber(() =>
    zyberGet<AdminCommunitiesPage>("/admin/communities", {
      page: params.get("page") ?? "1",
      limit: params.get("limit") ?? "50",
      search: params.get("search") ?? "",
      sort: params.get("sort") ?? "",
      order: params.get("order") ?? "",
    }),
  )
}

export async function POST(req: NextRequest) {
  const auth = await requireSection("communities")
  if (auth.error) return auth.error
  const body = (await req.json().catch(() => null)) as
    | {
        name?: string
        description?: string
        type?: string
        is_private?: boolean
        avatar_url?: string
        created_by?: string
      }
    | null
  if (!body?.name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 })
  }
  if (!body.created_by) {
    return NextResponse.json(
      { error: "created_by is required" },
      { status: 400 },
    )
  }
  return runZyber(() => zyberPost<AdminCommunity>("/admin/communities", body))
}

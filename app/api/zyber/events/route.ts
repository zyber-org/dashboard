import { type NextRequest, NextResponse } from "next/server"
import { requireSection, runZyber } from "@/lib/api-route"
import { zyberGet, zyberPost } from "@/lib/zyber-api"
import type { AdminEvent, AdminEventsPage } from "@/lib/zyber-types"

export async function GET(req: NextRequest) {
  const auth = await requireSection("events")
  if (auth.error) return auth.error
  const params = req.nextUrl.searchParams
  return runZyber(() =>
    zyberGet<AdminEventsPage>("/admin/events", {
      page: params.get("page") ?? "1",
      limit: params.get("limit") ?? "50",
      search: params.get("search") ?? "",
      community_id: params.get("community_id") ?? "",
    }),
  )
}

export async function POST(req: NextRequest) {
  const auth = await requireSection("events")
  if (auth.error) return auth.error
  const body = (await req.json().catch(() => null)) as
    | {
        community_id?: number
        title?: string
        description?: string
        location?: string
        created_by?: string
        start_time?: string
        end_time?: string
      }
    | null
  if (!body?.title || !body.community_id || !body.created_by) {
    return NextResponse.json(
      { error: "community_id, title, and created_by are required" },
      { status: 400 },
    )
  }
  return runZyber(() => zyberPost<AdminEvent>("/admin/events", body))
}

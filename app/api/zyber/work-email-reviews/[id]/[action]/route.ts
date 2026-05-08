import { type NextRequest, NextResponse } from "next/server"
import { requireSection, runZyber } from "@/lib/api-route"
import { zyberPost } from "@/lib/zyber-api"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; action: string }> },
) {
  const auth = await requireSection("work-email")
  if (auth.error) return auth.error
  const { id, action } = await params
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "invalid action" }, { status: 400 })
  }
  const body = (await req.json().catch(() => ({}))) as
    | { note?: string }
    | null
  return runZyber(() =>
    zyberPost<unknown>(
      `/admin/work-email-reviews/${encodeURIComponent(id)}/${action}`,
      { note: body?.note ?? "" },
    ),
  )
}

import { type NextRequest, NextResponse } from "next/server"
import { requireSection, runZyber } from "@/lib/api-route"
import { zyberPost } from "@/lib/zyber-api"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; action: string }> },
) {
  const auth = await requireSection("deletion-requests")
  if (auth.error) return auth.error
  const { id, action } = await params
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "invalid action" }, { status: 400 })
  }
  const body = (await req.json().catch(() => ({}))) as
    | { adminNotes?: string }
    | null
  return runZyber(() =>
    zyberPost<unknown>(
      `/deletion-requests/${encodeURIComponent(id)}/${action}`,
      action === "reject" ? { adminNotes: body?.adminNotes ?? "" } : {},
    ),
  )
}

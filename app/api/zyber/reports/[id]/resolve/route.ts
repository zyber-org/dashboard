import { type NextRequest, NextResponse } from "next/server"
import { requireSection, runZyber } from "@/lib/api-route"
import { zyberPost } from "@/lib/zyber-api"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSection("reports")
  if (auth.error) return auth.error
  const { id } = await params
  const body = (await req.json().catch(() => null)) as
    | { status?: string; adminNotes?: string }
    | null
  if (!body?.status) {
    return NextResponse.json({ error: "status is required" }, { status: 400 })
  }
  return runZyber(() =>
    zyberPost<unknown>(`/reports/${encodeURIComponent(id)}/resolve`, {
      status: body.status,
      adminNotes: body.adminNotes ?? "",
    }),
  )
}

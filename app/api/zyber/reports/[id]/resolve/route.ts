import { type NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { requireSection } from "@/lib/api-route"
import { dbProd } from "@/db/prod/drizzle"
import { userReports } from "@/db/prod/schema"

const ALLOWED_STATUSES = new Set(["reviewed", "dismissed"])

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSection("reports")
  if (auth.error) return auth.error

  const { id } = await params
  const numericId = Number.parseInt(id, 10)
  if (!Number.isFinite(numericId)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 })
  }

  const body = (await req.json().catch(() => null)) as
    | { status?: string; adminNotes?: string }
    | null
  if (!body?.status || !ALLOWED_STATUSES.has(body.status)) {
    return NextResponse.json(
      { error: "status must be 'reviewed' or 'dismissed'" },
      { status: 400 },
    )
  }

  try {
    const updated = await dbProd
      .update(userReports)
      .set({
        status: body.status,
        adminNotes: body.adminNotes ?? "",
        updatedAt: new Date(),
      })
      .where(eq(userReports.id, numericId))
      .returning({ id: userReports.id })

    if (updated.length === 0) {
      return NextResponse.json({ error: "report not found" }, { status: 404 })
    }
    return NextResponse.json({ id: updated[0].id })
  } catch (err) {
    const message = err instanceof Error ? err.message : "internal error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

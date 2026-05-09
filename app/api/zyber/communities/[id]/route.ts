import { type NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { requireSection, runZyber } from "@/lib/api-route"
import { zyberDelete } from "@/lib/zyber-api"
import { dbProd } from "@/db/prod/drizzle"
import { communities } from "@/db/prod/schema"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSection("communities")
  if (auth.error) return auth.error

  const { id } = await params
  const numericId = Number.parseInt(id, 10)
  if (!Number.isFinite(numericId)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 })
  }

  const body = (await req.json().catch(() => ({}))) as {
    name?: string
    description?: string
    type?: string
    is_private?: boolean
    avatar_url?: string
  }

  const update: Partial<typeof communities.$inferInsert> = {
    updatedAt: new Date(),
  }
  if (typeof body.name === "string") update.name = body.name
  if (typeof body.description === "string") update.description = body.description
  if (typeof body.type === "string") update.type = body.type
  if (typeof body.is_private === "boolean") update.isPrivate = body.is_private
  if (typeof body.avatar_url === "string") update.avatarUrl = body.avatar_url

  try {
    const updated = await dbProd
      .update(communities)
      .set(update)
      .where(eq(communities.id, numericId))
      .returning({ id: communities.id })

    if (updated.length === 0) {
      return NextResponse.json({ error: "community not found" }, { status: 404 })
    }
    return NextResponse.json({ id: updated[0].id })
  } catch (err) {
    const message = err instanceof Error ? err.message : "internal error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE stays proxied: the Go handler cascades across events, members,
// messages, and other related tables. Replicating that here would risk
// orphan rows.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSection("communities")
  if (auth.error) return auth.error
  const { id } = await params
  return runZyber(() =>
    zyberDelete<unknown>(`/admin/communities/${encodeURIComponent(id)}`),
  )
}

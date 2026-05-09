import { type NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { requireSection, runZyber } from "@/lib/api-route"
import { zyberPut } from "@/lib/zyber-api"
import { dbProd } from "@/db/prod/drizzle"
import { maintainers } from "@/db/prod/schema"

// PUT stays proxied when a password reset is requested (bcrypt hashing on the
// Go server). For display_name-only updates we could go direct, but the
// request shape is the same — keeping it proxied avoids a split.
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSection("maintainers")
  if (auth.error) return auth.error
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  return runZyber(() =>
    zyberPut<unknown>(`/admin/maintainers/${encodeURIComponent(id)}`, body),
  )
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSection("maintainers")
  if (auth.error) return auth.error

  const { id } = await params
  const numericId = Number.parseInt(id, 10)
  if (!Number.isFinite(numericId)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 })
  }

  try {
    const deleted = await dbProd
      .delete(maintainers)
      .where(eq(maintainers.id, numericId))
      .returning({ id: maintainers.id })

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: "maintainer not found" },
        { status: 404 },
      )
    }
    return NextResponse.json({ id: deleted[0].id })
  } catch (err) {
    const message = err instanceof Error ? err.message : "internal error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

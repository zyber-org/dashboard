import { type NextRequest, NextResponse } from "next/server"
import { asc, eq } from "drizzle-orm"
import { requireSection } from "@/lib/api-route"
import { dbProd } from "@/db/prod/drizzle"
import { maintainerColleges, maintainers } from "@/db/prod/schema"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSection("maintainers")
  if (auth.error) return auth.error

  const { id } = await params
  const numericId = Number.parseInt(id, 10)
  if (!Number.isFinite(numericId)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 })
  }

  const body = (await req.json().catch(() => ({}))) as
    | { colleges?: string[] }
    | null
  const incoming = (body?.colleges ?? [])
    .map((c) => c.trim())
    .filter((c) => c.length > 0)
  const unique = Array.from(new Set(incoming))

  try {
    const exists = await dbProd
      .select({ id: maintainers.id })
      .from(maintainers)
      .where(eq(maintainers.id, numericId))
      .limit(1)
    if (exists.length === 0) {
      return NextResponse.json(
        { error: "maintainer not found" },
        { status: 404 },
      )
    }

    await dbProd.transaction(async (tx) => {
      await tx
        .delete(maintainerColleges)
        .where(eq(maintainerColleges.maintainerId, numericId))
      if (unique.length > 0) {
        await tx
          .insert(maintainerColleges)
          .values(
            unique.map((college) => ({ maintainerId: numericId, college })),
          )
      }
    })

    const rows = await dbProd
      .select({ college: maintainerColleges.college })
      .from(maintainerColleges)
      .where(eq(maintainerColleges.maintainerId, numericId))
      .orderBy(asc(maintainerColleges.college))

    return NextResponse.json({ colleges: rows.map((r) => r.college) })
  } catch (err) {
    const message = err instanceof Error ? err.message : "internal error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { asc, desc, inArray } from "drizzle-orm"
import { requireSection, runZyber } from "@/lib/api-route"
import { zyberPost } from "@/lib/zyber-api"
import { dbProd } from "@/db/prod/drizzle"
import { maintainerColleges, maintainers } from "@/db/prod/schema"
import type { Maintainer } from "@/lib/zyber-types"

export async function GET() {
  const auth = await requireSection("maintainers")
  if (auth.error) return auth.error

  try {
    const maintRows = await dbProd
      .select({
        id: maintainers.id,
        username: maintainers.username,
        display_name: maintainers.displayName,
        is_active: maintainers.isActive,
        created_by: maintainers.createdBy,
        created_at: maintainers.createdAt,
        updated_at: maintainers.updatedAt,
      })
      .from(maintainers)
      .orderBy(desc(maintainers.createdAt))

    const ids = maintRows.map((m) => m.id)
    const collegeRows = ids.length
      ? await dbProd
          .select({
            maintainerId: maintainerColleges.maintainerId,
            college: maintainerColleges.college,
          })
          .from(maintainerColleges)
          .where(inArray(maintainerColleges.maintainerId, ids))
          .orderBy(asc(maintainerColleges.college))
      : []

    const collegesByMaintainer = new Map<number, string[]>()
    for (const row of collegeRows) {
      const arr = collegesByMaintainer.get(row.maintainerId) ?? []
      arr.push(row.college)
      collegesByMaintainer.set(row.maintainerId, arr)
    }

    const payload: { maintainers: Maintainer[] } = {
      maintainers: maintRows.map((m) => ({
        id: m.id,
        username: m.username,
        display_name: m.display_name,
        is_active: m.is_active,
        created_by: m.created_by,
        created_at: m.created_at.toISOString(),
        updated_at: m.updated_at.toISOString(),
        colleges: collegesByMaintainer.get(m.id) ?? [],
      })),
    }
    return NextResponse.json(payload)
  } catch (err) {
    const message = err instanceof Error ? err.message : "internal error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST stays proxied: maintainer creation generates a random password and
// bcrypt-hashes it on the Go server. Adding a bcrypt dependency to the
// dashboard for one write isn't worth it.
export async function POST(req: NextRequest) {
  const auth = await requireSection("maintainers")
  if (auth.error) return auth.error
  const body = (await req.json().catch(() => null)) as
    | { username?: string; display_name?: string }
    | null
  if (!body?.username) {
    return NextResponse.json({ error: "username is required" }, { status: 400 })
  }
  return runZyber(() =>
    zyberPost<{ maintainer: Maintainer; generated_password: string }>(
      "/admin/maintainers",
      body,
    ),
  )
}

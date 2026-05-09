import { type NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { requireSection } from "@/lib/api-route"
import { dbProd } from "@/db/prod/drizzle"
import { allowedWorkEmailDomains } from "@/db/prod/schema"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ domain: string }> },
) {
  const auth = await requireSection("work-email")
  if (auth.error) return auth.error

  const { domain } = await params
  const normalized = domain.trim().toLowerCase()
  if (!normalized) {
    return NextResponse.json({ error: "domain is required" }, { status: 400 })
  }

  try {
    const deleted = await dbProd
      .delete(allowedWorkEmailDomains)
      .where(eq(allowedWorkEmailDomains.domain, normalized))
      .returning({ domain: allowedWorkEmailDomains.domain })

    if (deleted.length === 0) {
      return NextResponse.json({ error: "domain not found" }, { status: 404 })
    }
    return NextResponse.json({ domain: deleted[0].domain })
  } catch (err) {
    const message = err instanceof Error ? err.message : "internal error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

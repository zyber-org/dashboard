import { type NextRequest, NextResponse } from "next/server"
import { asc } from "drizzle-orm"
import { requireSection } from "@/lib/api-route"
import { dbProd } from "@/db/prod/drizzle"
import { allowedWorkEmailDomains } from "@/db/prod/schema"

export async function GET() {
  const auth = await requireSection("work-email")
  if (auth.error) return auth.error

  try {
    const rows = await dbProd
      .select({ domain: allowedWorkEmailDomains.domain })
      .from(allowedWorkEmailDomains)
      .orderBy(asc(allowedWorkEmailDomains.domain))
    return NextResponse.json({ domains: rows.map((r) => r.domain) })
  } catch (err) {
    const message = err instanceof Error ? err.message : "internal error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireSection("work-email")
  if (auth.error) return auth.error

  const body = (await req.json().catch(() => null)) as
    | { domain?: string }
    | null
  const domain = body?.domain?.trim().toLowerCase()
  if (!domain) {
    return NextResponse.json({ error: "domain is required" }, { status: 400 })
  }

  try {
    await dbProd
      .insert(allowedWorkEmailDomains)
      .values({ domain, createdAt: new Date() })
      .onConflictDoNothing({ target: allowedWorkEmailDomains.domain })
    return NextResponse.json({ domain })
  } catch (err) {
    const message = err instanceof Error ? err.message : "internal error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

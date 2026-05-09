import { type NextRequest, NextResponse } from "next/server"
import { desc, eq, sql } from "drizzle-orm"
import { requireSection } from "@/lib/api-route"
import { dbProd } from "@/db/prod/drizzle"
import { userReports } from "@/db/prod/schema"
import type { UserReportsPage } from "@/lib/zyber-types"

export async function GET(req: NextRequest) {
  const auth = await requireSection("reports")
  if (auth.error) return auth.error

  const params = req.nextUrl.searchParams
  const status = params.get("status")?.trim() ?? ""
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(params.get("limit") ?? "20", 10) || 20),
  )
  const offset = Math.max(0, Number.parseInt(params.get("offset") ?? "0", 10) || 0)

  const whereClause = status ? eq(userReports.status, status) : undefined

  try {
    const [rows, totalRow] = await Promise.all([
      dbProd
        .select()
        .from(userReports)
        .where(whereClause)
        .orderBy(desc(userReports.createdAt))
        .limit(limit)
        .offset(offset),
      dbProd
        .select({ count: sql<number>`count(*)::int` })
        .from(userReports)
        .where(whereClause),
    ])

    const payload: UserReportsPage = {
      reports: rows.map((r) => ({
        id: r.id,
        reporterUsername: r.reporterUsername,
        reportedUsername: r.reportedUsername,
        reason: r.reason,
        notes: r.notes,
        status: r.status,
        adminNotes: r.adminNotes,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
      total: totalRow[0]?.count ?? 0,
      limit,
      offset,
    }
    return NextResponse.json(payload)
  } catch (err) {
    const message = err instanceof Error ? err.message : "internal error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

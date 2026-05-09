import { type NextRequest, NextResponse } from "next/server"
import { asc, eq, sql } from "drizzle-orm"
import { requireSection } from "@/lib/api-route"
import { dbProd } from "@/db/prod/drizzle"
import { accountDeletionRequests } from "@/db/prod/schema"
import type { DeletionRequestsPage } from "@/lib/zyber-types"

export async function GET(req: NextRequest) {
  const auth = await requireSection("deletion-requests")
  if (auth.error) return auth.error

  const params = req.nextUrl.searchParams
  const status = (params.get("status")?.trim() || "pending")
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(params.get("limit") ?? "20", 10) || 20),
  )
  const offset = Math.max(0, Number.parseInt(params.get("offset") ?? "0", 10) || 0)

  const whereClause = eq(accountDeletionRequests.status, status)

  try {
    const [rows, totalRow] = await Promise.all([
      dbProd
        .select()
        .from(accountDeletionRequests)
        .where(whereClause)
        .orderBy(asc(accountDeletionRequests.requestedAt))
        .limit(limit)
        .offset(offset),
      dbProd
        .select({ count: sql<number>`count(*)::int` })
        .from(accountDeletionRequests)
        .where(whereClause),
    ])

    const payload: DeletionRequestsPage = {
      requests: rows.map((r) => ({
        id: r.id,
        username: r.username,
        requestType: r.requestType,
        breakDurationDays: r.breakDurationDays ?? undefined,
        status: r.status,
        adminNotes: r.adminNotes,
        requestedAt: r.requestedAt.toISOString(),
        reviewedAt: r.reviewedAt?.toISOString(),
        reviewedBy: r.reviewedBy ?? undefined,
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

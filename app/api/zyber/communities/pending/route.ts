import { NextResponse } from "next/server"
import { asc, eq, sql } from "drizzle-orm"
import { requireSection } from "@/lib/api-route"
import { dbProd } from "@/db/prod/drizzle"
import { communities, communityMembers, users } from "@/db/prod/schema"
import type { PendingCommunity } from "@/lib/zyber-types"

export async function GET() {
  const auth = await requireSection("communities")
  if (auth.error) return auth.error

  const memberCount = sql<number>`(select count(*)::int from ${communityMembers} where ${communityMembers.communityId} = ${communities.id})`

  try {
    const rows = await dbProd
      .select({
        id: communities.id,
        slug: communities.slug,
        name: communities.name,
        description: communities.description,
        avatarUrl: communities.avatarUrl,
        type: communities.type,
        isPrivate: communities.isPrivate,
        requiresApproval: communities.requiresApproval,
        adminOnlyPosts: communities.adminOnlyPosts,
        inviteToken: communities.inviteToken,
        createdBy: communities.createdBy,
        memberCount,
        createdAt: communities.createdAt,
        updatedAt: communities.updatedAt,
        status: communities.status,
        ownerEmail: users.email,
        ownerFirstName: users.firstName,
      })
      .from(communities)
      .innerJoin(users, eq(users.username, communities.createdBy))
      .where(eq(communities.status, "pending"))
      .orderBy(asc(communities.createdAt))

    const payload: { communities: PendingCommunity[] } = {
      communities: rows.map((r) => ({
        id: r.id,
        slug: r.slug,
        name: r.name,
        description: r.description ?? "",
        icon: r.avatarUrl ?? "",
        type: r.type,
        isPrivate: r.isPrivate,
        requiresApproval: r.requiresApproval,
        adminOnlyPosts: r.adminOnlyPosts,
        inviteToken: r.inviteToken || undefined,
        createdBy: r.createdBy,
        memberCount: r.memberCount,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        status: r.status,
        ownerEmail: r.ownerEmail,
        ownerFirstName: r.ownerFirstName,
      })),
    }
    return NextResponse.json(payload)
  } catch (err) {
    const message = err instanceof Error ? err.message : "internal error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { requireSection } from "@/lib/api-route"
import { dbProd } from "@/db/prod/drizzle"
import { users } from "@/db/prod/schema"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  const auth = await requireSection("users")
  if (auth.error) return auth.error

  const { username } = await params
  const body = (await req.json().catch(() => null)) as
    | { verified?: boolean }
    | null
  const verified = !!body?.verified

  try {
    const updated = await dbProd
      .update(users)
      .set({ workEmailVerified: verified, updatedAt: new Date() })
      .where(eq(users.username, username))
      .returning({ username: users.username })

    if (updated.length === 0) {
      return NextResponse.json({ error: "user not found" }, { status: 404 })
    }
    return NextResponse.json({ username: updated[0].username, verified })
  } catch (err) {
    const message = err instanceof Error ? err.message : "internal error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

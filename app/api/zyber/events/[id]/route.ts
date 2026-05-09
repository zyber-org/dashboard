import { type NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { requireSection } from "@/lib/api-route"
import { dbProd } from "@/db/prod/drizzle"
import { communityEvents } from "@/db/prod/schema"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSection("events")
  if (auth.error) return auth.error

  const { id } = await params
  const numericId = Number.parseInt(id, 10)
  if (!Number.isFinite(numericId)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 })
  }

  const body = (await req.json().catch(() => ({}))) as {
    title?: string
    description?: string
    location?: string
    start_time?: string
    end_time?: string
  }

  const update: Partial<typeof communityEvents.$inferInsert> = {
    updatedAt: new Date(),
  }
  if (typeof body.title === "string") update.title = body.title
  if (typeof body.description === "string") update.description = body.description
  if (typeof body.location === "string") update.location = body.location
  if (typeof body.start_time === "string") {
    const t = new Date(body.start_time)
    if (Number.isNaN(t.getTime())) {
      return NextResponse.json(
        { error: "invalid start_time" },
        { status: 400 },
      )
    }
    update.startTime = t
  }
  if (typeof body.end_time === "string") {
    const t = new Date(body.end_time)
    if (Number.isNaN(t.getTime())) {
      return NextResponse.json({ error: "invalid end_time" }, { status: 400 })
    }
    update.endTime = t
  }

  try {
    const updated = await dbProd
      .update(communityEvents)
      .set(update)
      .where(eq(communityEvents.id, numericId))
      .returning({ id: communityEvents.id })

    if (updated.length === 0) {
      return NextResponse.json({ error: "event not found" }, { status: 404 })
    }
    return NextResponse.json({ id: updated[0].id })
  } catch (err) {
    const message = err instanceof Error ? err.message : "internal error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSection("events")
  if (auth.error) return auth.error

  const { id } = await params
  const numericId = Number.parseInt(id, 10)
  if (!Number.isFinite(numericId)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 })
  }

  try {
    const deleted = await dbProd
      .delete(communityEvents)
      .where(eq(communityEvents.id, numericId))
      .returning({ id: communityEvents.id })

    if (deleted.length === 0) {
      return NextResponse.json({ error: "event not found" }, { status: 404 })
    }
    return NextResponse.json({ id: deleted[0].id })
  } catch (err) {
    const message = err instanceof Error ? err.message : "internal error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

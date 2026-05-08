import { type NextRequest, NextResponse } from "next/server"
import { requireSection, runZyber } from "@/lib/api-route"
import { zyberPost } from "@/lib/zyber-api"

export async function POST(req: NextRequest) {
  const auth = await requireSection("users")
  if (auth.error) return auth.error

  const body = (await req.json().catch(() => null)) as {
    action?: "disable" | "enable"
  } | null

  if (!body?.action || (body.action !== "disable" && body.action !== "enable")) {
    return NextResponse.json({ error: "invalid action" }, { status: 400 })
  }

  const path = `/users/${body.action}/all`
  return runZyber(() => zyberPost<unknown>(path))
}

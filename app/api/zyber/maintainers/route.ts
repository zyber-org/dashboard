import { type NextRequest, NextResponse } from "next/server"
import { requireSection, runZyber } from "@/lib/api-route"
import { zyberGet, zyberPost } from "@/lib/zyber-api"
import type { Maintainer } from "@/lib/zyber-types"

export async function GET() {
  const auth = await requireSection("maintainers")
  if (auth.error) return auth.error
  return runZyber(() =>
    zyberGet<{ maintainers: Maintainer[] }>("/admin/maintainers"),
  )
}

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

import { type NextRequest, NextResponse } from "next/server"
import { requireSection, runZyber } from "@/lib/api-route"
import { zyberGet, zyberPost } from "@/lib/zyber-api"

export async function GET() {
  const auth = await requireSection("work-email")
  if (auth.error) return auth.error
  return runZyber(() =>
    zyberGet<{ domains: string[] }>("/admin/work-email-domains"),
  )
}

export async function POST(req: NextRequest) {
  const auth = await requireSection("work-email")
  if (auth.error) return auth.error
  const body = (await req.json().catch(() => null)) as
    | { domain?: string }
    | null
  if (!body?.domain) {
    return NextResponse.json({ error: "domain is required" }, { status: 400 })
  }
  return runZyber(() =>
    zyberPost<unknown>("/admin/work-email-domains", { domain: body.domain }),
  )
}

import { type NextRequest } from "next/server"
import { requireSection, runZyber } from "@/lib/api-route"
import { zyberGet, zyberPut } from "@/lib/zyber-api"
import type { VersionConfig } from "@/lib/zyber-types"

export async function GET() {
  const auth = await requireSection("version")
  if (auth.error) return auth.error
  return runZyber(() => zyberGet<VersionConfig>(""))
}

export async function PUT(req: NextRequest) {
  const auth = await requireSection("version")
  if (auth.error) return auth.error
  const body = await req.json().catch(() => ({}))
  return runZyber(() => zyberPut<VersionConfig>("", body))
}

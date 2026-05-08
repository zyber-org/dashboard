import { type NextRequest } from "next/server"
import { requireSection, runZyber } from "@/lib/api-route"
import { zyberPut } from "@/lib/zyber-api"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSection("maintainers")
  if (auth.error) return auth.error
  const { id } = await params
  const body = (await req.json().catch(() => ({}))) as
    | { colleges?: string[] }
    | null
  return runZyber(() =>
    zyberPut<{ colleges: string[] }>(
      `/admin/maintainers/${encodeURIComponent(id)}/colleges`,
      { colleges: body?.colleges ?? [] },
    ),
  )
}

import { type NextRequest } from "next/server"
import { requireSection, runZyber } from "@/lib/api-route"
import { zyberDelete } from "@/lib/zyber-api"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ domain: string }> },
) {
  const auth = await requireSection("work-email")
  if (auth.error) return auth.error
  const { domain } = await params
  return runZyber(() =>
    zyberDelete<unknown>(
      `/admin/work-email-domains/${encodeURIComponent(domain)}`,
    ),
  )
}

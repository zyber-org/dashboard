import { type NextRequest } from "next/server"
import { requireSection, runZyber } from "@/lib/api-route"
import { zyberPost } from "@/lib/zyber-api"

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
  return runZyber(() =>
    zyberPost<unknown>(
      `/admin/users/${encodeURIComponent(username)}/work-email-verified`,
      { verified: !!body?.verified },
    ),
  )
}

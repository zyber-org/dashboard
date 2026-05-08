import { type NextRequest } from "next/server"
import { requireSection, runZyber } from "@/lib/api-route"
import { zyberDelete, zyberPut } from "@/lib/zyber-api"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSection("communities")
  if (auth.error) return auth.error
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  return runZyber(() =>
    zyberPut<unknown>(`/admin/communities/${encodeURIComponent(id)}`, body),
  )
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSection("communities")
  if (auth.error) return auth.error
  const { id } = await params
  return runZyber(() =>
    zyberDelete<unknown>(`/admin/communities/${encodeURIComponent(id)}`),
  )
}

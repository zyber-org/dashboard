import { type NextRequest } from "next/server"
import { requireSection, runZyber } from "@/lib/api-route"
import { zyberDelete, zyberGet } from "@/lib/zyber-api"
import type { LogBackupsResponse } from "@/lib/zyber-types"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  const auth = await requireSection("logs")
  if (auth.error) return auth.error
  const { type } = await params
  return runZyber(() =>
    zyberGet<LogBackupsResponse>(
      `/admin/logs/${encodeURIComponent(type)}/backups`,
    ),
  )
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  const auth = await requireSection("logs")
  if (auth.error) return auth.error
  const { type } = await params
  return runZyber(() =>
    zyberDelete<unknown>(`/admin/logs/${encodeURIComponent(type)}/backups`),
  )
}

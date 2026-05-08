import { type NextRequest } from "next/server"
import { requireSection, runZyber } from "@/lib/api-route"
import { zyberDelete, zyberGet } from "@/lib/zyber-api"
import type { LogResponse } from "@/lib/zyber-types"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ type: string; file: string }> },
) {
  const auth = await requireSection("logs")
  if (auth.error) return auth.error
  const { type, file } = await params
  return runZyber(() =>
    zyberGet<LogResponse>(
      `/admin/logs/${encodeURIComponent(type)}/backups/${encodeURIComponent(file)}`,
    ),
  )
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ type: string; file: string }> },
) {
  const auth = await requireSection("logs")
  if (auth.error) return auth.error
  const { type, file } = await params
  return runZyber(() =>
    zyberDelete<unknown>(
      `/admin/logs/${encodeURIComponent(type)}/backups/${encodeURIComponent(file)}`,
    ),
  )
}

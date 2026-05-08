import "server-only"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { canAccess, type DashboardSection, type Role } from "@/lib/permissions"
import { ZyberApiError } from "@/lib/zyber-api"

export async function requireSection(section: DashboardSection) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return {
      error: NextResponse.json({ error: "unauthorized" }, { status: 401 }),
    }
  }
  const role = session.user.role as Role | undefined
  if (!canAccess(role, section)) {
    return {
      error: NextResponse.json({ error: "forbidden" }, { status: 403 }),
    }
  }
  return { session, role }
}

export async function runZyber<T>(
  fn: () => Promise<T>,
): Promise<NextResponse> {
  try {
    const data = await fn()
    return NextResponse.json(data)
  } catch (err) {
    if (err instanceof ZyberApiError) {
      return NextResponse.json(
        { error: err.message, payload: err.payload },
        { status: err.status },
      )
    }
    const message = err instanceof Error ? err.message : "internal error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

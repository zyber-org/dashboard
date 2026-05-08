import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { canAccess, type Role } from "@/lib/permissions"
import { LiveUsersClient } from "./live-users-client"

export default async function LiveUsersPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/sign-in")
  const role = session.user.role as Role | undefined
  if (!canAccess(role, "live")) redirect("/")

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Live users</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Currently online users (refreshes every 10s).
        </p>
      </header>
      <LiveUsersClient />
    </div>
  )
}

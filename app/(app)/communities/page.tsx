import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { canAccess, type Role } from "@/lib/permissions"
import { CommunitiesClient } from "./communities-client"

export default async function CommunitiesPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/sign-in")
  const role = session.user.role as Role | undefined
  if (!canAccess(role, "communities")) redirect("/")

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Communities</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage communities and review pending submissions.
        </p>
      </header>
      <CommunitiesClient />
    </div>
  )
}

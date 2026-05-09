import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { AppSidebar } from "@/components/app-sidebar"
import { ClientOnly } from "@/components/client-only"
import { Header } from "@/components/header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import type { Role } from "@/lib/permissions"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/sign-in")

  const role = session.user.role as Role | undefined

  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false"

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <ClientOnly
          fallback={
            <div
              aria-hidden
              className="hidden md:block w-(--sidebar-width) shrink-0"
            />
          }
        >
          <AppSidebar
            role={role}
            user={{
              name: session.user.name,
              email: session.user.email,
              image: session.user.image ?? null,
            }}
          />
        </ClientOnly>
        <SidebarInset>
          <ClientOnly
            fallback={
              <div
                aria-hidden
                className="h-14 shrink-0 border-b"
              />
            }
          >
            <Header />
          </ClientOnly>
          <div className="flex-1 px-8 py-8">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}

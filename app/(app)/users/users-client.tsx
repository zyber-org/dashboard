"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/fetcher"
import type { AdminUsersPage } from "@/lib/zyber-types"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"

const PAGE_LIMIT = 50

export function UsersClient() {
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [page, setPage] = useState(1)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["zyber", "users", search, page],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_LIMIT),
      })
      if (search) params.set("search", search)
      return apiFetch<AdminUsersPage>(`/api/zyber/users?${params.toString()}`)
    },
  })

  const action = useMutation({
    mutationFn: (input: { action: "disable" | "enable" | "delete"; email: string }) =>
      apiFetch<unknown>("/api/zyber/users/action", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: (_, input) => {
      toast.success(`User ${input.action}d`)
      qc.invalidateQueries({ queryKey: ["zyber", "users"] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const total = data?.total ?? 0
  const totalPages = data?.total_pages ?? 0

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Search</CardTitle>
          <CardDescription>
            Match by username, email, name, or college.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              setSearch(searchInput.trim())
              setPage(1)
            }}
          >
            <Input
              placeholder="username, email, college…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <Button type="submit">Search</Button>
            {search ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setSearch("")
                  setSearchInput("")
                  setPage(1)
                }}
              >
                Clear
              </Button>
            ) : null}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>
              {isLoading ? "Loading…" : `${total} users`}
            </CardTitle>
            <CardDescription>
              Page {page} of {Math.max(1, totalPages)}.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <BulkDialog />
            <AllToggleDialog />
          </div>
        </CardHeader>
        <CardContent className="px-0">
          {isLoading ? (
            <div className="space-y-2 px-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>College</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.users.map((u) => (
                  <TableRow key={u.username}>
                    <TableCell className="pl-6">
                      <div className="font-medium">
                        {u.first_name} {u.last_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        @{u.username}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {u.email}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {u.college || "—"}
                    </TableCell>
                    <TableCell>
                      {u.is_banned ? (
                        <Badge variant="destructive">Banned</Badge>
                      ) : !u.is_active ? (
                        <Badge variant="secondary">Disabled</Badge>
                      ) : (
                        <Badge>Active</Badge>
                      )}
                      {u.work_email_verified ? (
                        <Badge variant="outline" className="ml-1">
                          Verified
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="pr-6 text-right space-x-1">
                      {u.is_active ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={action.isPending}
                          onClick={() =>
                            action.mutate({ action: "disable", email: u.email })
                          }
                        >
                          Disable
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={action.isPending}
                          onClick={() =>
                            action.mutate({ action: "enable", email: u.email })
                          }
                        >
                          Enable
                        </Button>
                      )}
                      <DeleteUserButton
                        email={u.email}
                        username={u.username}
                        onConfirm={() =>
                          action.mutate({ action: "delete", email: u.email })
                        }
                        disabled={action.isPending}
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {data && data.users.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-12 text-center text-sm text-muted-foreground"
                    >
                      No users matched.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {page} / {Math.max(1, totalPages)}
        </span>
        <Button
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

function DeleteUserButton({
  email,
  username,
  onConfirm,
  disabled,
}: {
  email: string
  username: string
  onConfirm: () => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button size="sm" variant="destructive" disabled={disabled} />}
      >
        Delete
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete @{username}?</DialogTitle>
          <DialogDescription>
            This permanently deletes the account for {email}. This cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm()
              setOpen(false)
            }}
          >
            Delete account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function BulkDialog() {
  const [open, setOpen] = useState(false)
  const [emails, setEmails] = useState("")
  const qc = useQueryClient()

  const bulk = useMutation({
    mutationFn: (action: "disable" | "enable") =>
      apiFetch<{ updated_count?: number }>("/api/zyber/users/bulk", {
        method: "POST",
        body: JSON.stringify({ action, emails }),
      }),
    onSuccess: (data, action) => {
      toast.success(
        `Bulk ${action} done. Updated ${data.updated_count ?? 0} user(s).`,
      )
      qc.invalidateQueries({ queryKey: ["zyber", "users"] })
      setOpen(false)
      setEmails("")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        Bulk
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk enable / disable</DialogTitle>
          <DialogDescription>
            Paste emails separated by commas, semicolons, or new lines.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="disable">
          <TabsList>
            <TabsTrigger value="disable">Disable</TabsTrigger>
            <TabsTrigger value="enable">Enable</TabsTrigger>
          </TabsList>
          <TabsContent value="disable" className="space-y-3">
            <Textarea
              rows={6}
              placeholder="alice@example.com, bob@example.com"
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
            />
            <DialogFooter>
              <Button
                variant="destructive"
                disabled={!emails.trim() || bulk.isPending}
                onClick={() => bulk.mutate("disable")}
              >
                Disable all
              </Button>
            </DialogFooter>
          </TabsContent>
          <TabsContent value="enable" className="space-y-3">
            <Textarea
              rows={6}
              placeholder="alice@example.com, bob@example.com"
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
            />
            <DialogFooter>
              <Button
                disabled={!emails.trim() || bulk.isPending}
                onClick={() => bulk.mutate("enable")}
              >
                Enable all
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function AllToggleDialog() {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState<"disable" | "enable" | null>(null)
  const qc = useQueryClient()

  const all = useMutation({
    mutationFn: (action: "disable" | "enable") =>
      apiFetch<{ updated_count?: number }>("/api/zyber/users/all", {
        method: "POST",
        body: JSON.stringify({ action }),
      }),
    onSuccess: (data, action) => {
      toast.success(
        `${action === "disable" ? "Disabled" : "Enabled"} ${data.updated_count ?? 0} user(s).`,
      )
      qc.invalidateQueries({ queryKey: ["zyber", "users"] })
      setOpen(false)
      setPending(null)
    },
    onError: (err: Error) => {
      toast.error(err.message)
      setPending(null)
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        All users
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Toggle every account</DialogTitle>
          <DialogDescription>
            This affects every non-admin user in the database. Use with care.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={all.isPending}
            onClick={() => {
              setPending("enable")
              all.mutate("enable")
            }}
          >
            Enable all{pending === "enable" ? "…" : ""}
          </Button>
          <Button
            variant="destructive"
            disabled={all.isPending}
            onClick={() => {
              setPending("disable")
              all.mutate("disable")
            }}
          >
            Disable all{pending === "disable" ? "…" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

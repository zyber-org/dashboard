"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/fetcher"
import type {
  AdminCommunitiesPage,
  AdminCommunity,
  PendingCommunity,
} from "@/lib/zyber-types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"

export function CommunitiesClient() {
  return (
    <Tabs defaultValue="all">
      <TabsList>
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="pending">Pending approvals</TabsTrigger>
      </TabsList>
      <TabsContent value="all" className="pt-4">
        <AllCommunities />
      </TabsContent>
      <TabsContent value="pending" className="pt-4">
        <PendingCommunities />
      </TabsContent>
    </Tabs>
  )
}

function AllCommunities() {
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [page, setPage] = useState(1)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["zyber", "communities", search, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: "50" })
      if (search) params.set("search", search)
      return apiFetch<AdminCommunitiesPage>(
        `/api/zyber/communities?${params.toString()}`,
      )
    },
  })

  const remove = useMutation({
    mutationFn: (id: number) =>
      apiFetch<unknown>(`/api/zyber/communities/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Community deleted")
      qc.invalidateQueries({ queryKey: ["zyber", "communities"] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>{data ? `${data.total} communities` : "Loading…"}</CardTitle>
            <CardDescription>Search by name or slug.</CardDescription>
          </div>
          <CreateCommunityDialog />
        </CardHeader>
        <CardContent className="space-y-4 px-0">
          <form
            className="flex gap-2 px-6"
            onSubmit={(e) => {
              e.preventDefault()
              setSearch(searchInput.trim())
              setPage(1)
            }}
          >
            <Input
              placeholder="Search…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <Button type="submit">Search</Button>
          </form>

          {isLoading ? (
            <div className="space-y-2 px-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Community</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead className="pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.communities.map((c) => (
                  <CommunityRow
                    key={c.id}
                    community={c}
                    onDelete={() => remove.mutate(c.id)}
                    deleting={remove.isPending}
                  />
                ))}
                {data && data.communities.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-12 text-center text-sm text-muted-foreground"
                    >
                      No communities matched.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {data && data.total_pages > 1 ? (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} / {data.total_pages}
          </span>
          <Button
            variant="outline"
            disabled={page >= data.total_pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function CommunityRow({
  community,
  onDelete,
  deleting,
}: {
  community: AdminCommunity
  onDelete: () => void
  deleting: boolean
}) {
  return (
    <TableRow>
      <TableCell className="pl-6">
        <div className="font-medium">{community.name}</div>
        <div className="text-xs text-muted-foreground">/{community.slug}</div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="capitalize">
          {community.type}
        </Badge>
        {community.is_private ? (
          <Badge variant="secondary" className="ml-1">
            Private
          </Badge>
        ) : null}
      </TableCell>
      <TableCell>{community.member_count}</TableCell>
      <TableCell className="text-muted-foreground">@{community.created_by}</TableCell>
      <TableCell className="pr-6 text-right space-x-1">
        <EditCommunityDialog community={community} />
        <DeleteConfirm onConfirm={onDelete} disabled={deleting} />
      </TableCell>
    </TableRow>
  )
}

function CreateCommunityDialog() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: "",
    description: "",
    type: "social",
    is_private: false,
    avatar_url: "",
    created_by: "",
  })

  const create = useMutation({
    mutationFn: () =>
      apiFetch<AdminCommunity>("/api/zyber/communities", {
        method: "POST",
        body: JSON.stringify(form),
      }),
    onSuccess: () => {
      toast.success("Community created")
      setOpen(false)
      setForm({
        name: "",
        description: "",
        type: "social",
        is_private: false,
        avatar_url: "",
        created_by: "",
      })
      qc.invalidateQueries({ queryKey: ["zyber", "communities"] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>New community</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create community</DialogTitle>
          <DialogDescription>
            The owner is set by username and cannot be changed later.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Name">
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </Field>
          <Field label="Owner username">
            <Input
              value={form.created_by}
              onChange={(e) =>
                setForm((f) => ({ ...f, created_by: e.target.value }))
              }
            />
          </Field>
          <Field label="Description">
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </Field>
          <Field label="Type">
            <Input
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              placeholder="social"
            />
          </Field>
          <Field label="Avatar URL">
            <Input
              value={form.avatar_url}
              onChange={(e) =>
                setForm((f) => ({ ...f, avatar_url: e.target.value }))
              }
            />
          </Field>
          <div className="flex items-center justify-between">
            <Label>Private</Label>
            <Switch
              checked={form.is_private}
              onCheckedChange={(v) =>
                setForm((f) => ({ ...f, is_private: !!v }))
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={!form.name || !form.created_by || create.isPending}
            onClick={() => create.mutate()}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EditCommunityDialog({ community }: { community: AdminCommunity }) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: community.name,
    description: community.description,
    type: community.type,
    is_private: community.is_private,
    avatar_url: community.icon,
  })

  const update = useMutation({
    mutationFn: () =>
      apiFetch<unknown>(`/api/zyber/communities/${community.id}`, {
        method: "PUT",
        body: JSON.stringify(form),
      }),
    onSuccess: () => {
      toast.success("Community updated")
      setOpen(false)
      qc.invalidateQueries({ queryKey: ["zyber", "communities"] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        Edit
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {community.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Name">
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </Field>
          <Field label="Description">
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </Field>
          <Field label="Type">
            <Input
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            />
          </Field>
          <Field label="Avatar URL">
            <Input
              value={form.avatar_url}
              onChange={(e) =>
                setForm((f) => ({ ...f, avatar_url: e.target.value }))
              }
            />
          </Field>
          <div className="flex items-center justify-between">
            <Label>Private</Label>
            <Switch
              checked={form.is_private}
              onCheckedChange={(v) =>
                setForm((f) => ({ ...f, is_private: !!v }))
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button disabled={!form.name || update.isPending} onClick={() => update.mutate()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DeleteConfirm({
  onConfirm,
  disabled,
}: {
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
          <DialogTitle>Delete community?</DialogTitle>
          <DialogDescription>
            All members and posts will be removed. This cannot be undone.
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
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PendingCommunities() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ["zyber", "communities-pending"],
    queryFn: () =>
      apiFetch<{ communities: PendingCommunity[] }>(
        "/api/zyber/communities/pending",
      ),
  })

  const review = useMutation({
    mutationFn: (input: { id: number; action: "approve" | "reject"; message?: string }) =>
      apiFetch<unknown>(`/api/zyber/communities/${input.id}/${input.action}`, {
        method: "POST",
        body: JSON.stringify({ message: input.message ?? "" }),
      }),
    onSuccess: (_, input) => {
      toast.success(`Community ${input.action}d`)
      qc.invalidateQueries({ queryKey: ["zyber", "communities-pending"] })
      qc.invalidateQueries({ queryKey: ["zyber", "communities"] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {data ? `${data.communities.length} pending` : "Loading…"}
        </CardTitle>
        <CardDescription>
          Communities awaiting admin approval before going live.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        {isLoading ? (
          <div className="space-y-2 px-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Community</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="pr-6 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.communities.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="pl-6">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">
                      /{c.slug}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>@{c.createdBy}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.ownerEmail}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="pr-6 text-right space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={review.isPending}
                      onClick={() =>
                        review.mutate({ id: c.id, action: "reject" })
                      }
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      disabled={review.isPending}
                      onClick={() =>
                        review.mutate({ id: c.id, action: "approve" })
                      }
                    >
                      Approve
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {data && data.communities.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-12 text-center text-sm text-muted-foreground"
                  >
                    No pending communities.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

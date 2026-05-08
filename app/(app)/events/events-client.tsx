"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/fetcher"
import type { AdminEvent, AdminEventsPage } from "@/lib/zyber-types"
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"

export function EventsClient() {
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [page, setPage] = useState(1)

  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ["zyber", "events", search, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: "50" })
      if (search) params.set("search", search)
      return apiFetch<AdminEventsPage>(
        `/api/zyber/events?${params.toString()}`,
      )
    },
  })

  const remove = useMutation({
    mutationFn: (id: number) =>
      apiFetch<unknown>(`/api/zyber/events/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Event deleted")
      qc.invalidateQueries({ queryKey: ["zyber", "events"] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>{data ? `${data.total} events` : "Loading…"}</CardTitle>
            <CardDescription>
              Page {page} of {Math.max(1, data?.total_pages ?? 1)}.
            </CardDescription>
          </div>
          <CreateEventDialog />
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
              placeholder="title, location…"
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
                  <TableHead className="pl-6">Event</TableHead>
                  <TableHead>Community</TableHead>
                  <TableHead>When</TableHead>
                  <TableHead>RSVPs</TableHead>
                  <TableHead className="pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.events.map((e) => (
                  <EventRow
                    key={e.id}
                    event={e}
                    onDelete={() => remove.mutate(e.id)}
                    deleting={remove.isPending}
                  />
                ))}
                {data && data.events.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-12 text-center text-sm text-muted-foreground"
                    >
                      No events.
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

function EventRow({
  event,
  onDelete,
  deleting,
}: {
  event: AdminEvent
  onDelete: () => void
  deleting: boolean
}) {
  return (
    <TableRow>
      <TableCell className="pl-6">
        <div className="font-medium">{event.title}</div>
        {event.location ? (
          <div className="text-xs text-muted-foreground">{event.location}</div>
        ) : null}
      </TableCell>
      <TableCell>
        <div className="font-medium">{event.community_name}</div>
        <div className="text-xs text-muted-foreground">
          /{event.community_slug}
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {new Date(event.start_time).toLocaleString()}
      </TableCell>
      <TableCell>{event.attendee_count}</TableCell>
      <TableCell className="pr-6 text-right space-x-1">
        <EditEventDialog event={event} />
        <Button
          size="sm"
          variant="destructive"
          disabled={deleting}
          onClick={onDelete}
        >
          Delete
        </Button>
      </TableCell>
    </TableRow>
  )
}

function CreateEventDialog() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    community_id: "",
    title: "",
    description: "",
    location: "",
    created_by: "",
    start_time: "",
    end_time: "",
  })

  const create = useMutation({
    mutationFn: () =>
      apiFetch<AdminEvent>("/api/zyber/events", {
        method: "POST",
        body: JSON.stringify({
          community_id: Number(form.community_id),
          title: form.title,
          description: form.description,
          location: form.location,
          created_by: form.created_by,
          start_time: toRFC3339(form.start_time),
          end_time: toRFC3339(form.end_time),
        }),
      }),
    onSuccess: () => {
      toast.success("Event created")
      setOpen(false)
      qc.invalidateQueries({ queryKey: ["zyber", "events"] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>New event</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create event</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Community ID">
            <Input
              type="number"
              value={form.community_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, community_id: e.target.value }))
              }
            />
          </Field>
          <Field label="Creator username">
            <Input
              value={form.created_by}
              onChange={(e) =>
                setForm((f) => ({ ...f, created_by: e.target.value }))
              }
            />
          </Field>
          <Field label="Title">
            <Input
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
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
          <Field label="Location">
            <Input
              value={form.location}
              onChange={(e) =>
                setForm((f) => ({ ...f, location: e.target.value }))
              }
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start">
              <Input
                type="datetime-local"
                value={form.start_time}
                onChange={(e) =>
                  setForm((f) => ({ ...f, start_time: e.target.value }))
                }
              />
            </Field>
            <Field label="End">
              <Input
                type="datetime-local"
                value={form.end_time}
                onChange={(e) =>
                  setForm((f) => ({ ...f, end_time: e.target.value }))
                }
              />
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={
              !form.title ||
              !form.community_id ||
              !form.created_by ||
              !form.start_time ||
              !form.end_time ||
              create.isPending
            }
            onClick={() => create.mutate()}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EditEventDialog({ event }: { event: AdminEvent }) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    title: event.title,
    description: event.description,
    location: event.location,
    start_time: toLocalInput(event.start_time),
    end_time: toLocalInput(event.end_time),
  })

  const update = useMutation({
    mutationFn: () =>
      apiFetch<unknown>(`/api/zyber/events/${event.id}`, {
        method: "PUT",
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          location: form.location,
          start_time: toRFC3339(form.start_time),
          end_time: toRFC3339(form.end_time),
        }),
      }),
    onSuccess: () => {
      toast.success("Event updated")
      setOpen(false)
      qc.invalidateQueries({ queryKey: ["zyber", "events"] })
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
          <DialogTitle>Edit event</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Title">
            <Input
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
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
          <Field label="Location">
            <Input
              value={form.location}
              onChange={(e) =>
                setForm((f) => ({ ...f, location: e.target.value }))
              }
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start">
              <Input
                type="datetime-local"
                value={form.start_time}
                onChange={(e) =>
                  setForm((f) => ({ ...f, start_time: e.target.value }))
                }
              />
            </Field>
            <Field label="End">
              <Input
                type="datetime-local"
                value={form.end_time}
                onChange={(e) =>
                  setForm((f) => ({ ...f, end_time: e.target.value }))
                }
              />
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button disabled={update.isPending} onClick={() => update.mutate()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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

function toRFC3339(local: string): string {
  if (!local) return ""
  return new Date(local).toISOString()
}

function toLocalInput(iso: string): string {
  if (!iso) return ""
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

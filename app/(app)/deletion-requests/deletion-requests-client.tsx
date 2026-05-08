"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/fetcher"
import type {
  DeletionRequest,
  DeletionRequestsPage,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

const STATUSES = ["pending", "approved", "rejected"] as const

export function DeletionRequestsClient() {
  const [status, setStatus] =
    useState<(typeof STATUSES)[number]>("pending")

  const { data, isLoading } = useQuery({
    queryKey: ["zyber", "deletion-requests", status],
    queryFn: () =>
      apiFetch<DeletionRequestsPage>(
        `/api/zyber/deletion-requests?status=${status}&limit=50`,
      ),
  })

  return (
    <div className="space-y-4">
      <Tabs
        value={status}
        onValueChange={(v) => v && setStatus(v as (typeof STATUSES)[number])}
      >
        <TabsList>
          {STATUSES.map((s) => (
            <TabsTrigger key={s} value={s} className="capitalize">
              {s}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>{data ? `${data.total} requests` : "Loading…"}</CardTitle>
          <CardDescription>
            Take-break and account deletion requests.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
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
                  <TableHead className="pl-6">User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead className="pr-6 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.requests.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="pl-6 font-medium">
                      @{r.username}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {r.requestType === "take_break"
                          ? `Break (${r.breakDurationDays ?? "?"}d)`
                          : "Delete"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          r.status === "pending"
                            ? "default"
                            : r.status === "approved"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(r.requestedAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <ReviewActions request={r} />
                    </TableCell>
                  </TableRow>
                ))}
                {data && data.requests.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-12 text-center text-sm text-muted-foreground"
                    >
                      No {status} requests.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ReviewActions({ request }: { request: DeletionRequest }) {
  const qc = useQueryClient()

  const review = useMutation({
    mutationFn: (input: { action: "approve" | "reject"; adminNotes?: string }) =>
      apiFetch<unknown>(
        `/api/zyber/deletion-requests/${request.id}/${input.action}`,
        {
          method: "POST",
          body: JSON.stringify({ adminNotes: input.adminNotes ?? "" }),
        },
      ),
    onSuccess: (_, input) => {
      toast.success(`Request ${input.action}d`)
      qc.invalidateQueries({ queryKey: ["zyber", "deletion-requests"] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  if (request.status !== "pending") {
    return (
      <span className="text-xs text-muted-foreground">
        {request.reviewedBy ? `by @${request.reviewedBy}` : "—"}
      </span>
    )
  }

  return (
    <div className="flex justify-end gap-2">
      <RejectDialog
        onSubmit={(notes) => review.mutate({ action: "reject", adminNotes: notes })}
        disabled={review.isPending}
      />
      <Button
        size="sm"
        variant="destructive"
        disabled={review.isPending}
        onClick={() => review.mutate({ action: "approve" })}
      >
        {request.requestType === "delete" ? "Delete account" : "Approve"}
      </Button>
    </div>
  )
}

function RejectDialog({
  onSubmit,
  disabled,
}: {
  onSubmit: (notes: string) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState("")
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button size="sm" variant="outline" disabled={disabled} />}
      >
        Reject
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject request</DialogTitle>
          <DialogDescription>
            The user will be restored. Notes are visible to admins only.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          rows={4}
          placeholder="Admin notes (optional)…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSubmit(notes)
              setOpen(false)
            }}
          >
            Reject
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/fetcher"
import type { UserReport, UserReportsPage } from "@/lib/zyber-types"
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
import {
  Tabs,
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
import { Skeleton } from "@/components/ui/skeleton"

const STATUSES = ["pending", "reviewed", "dismissed"] as const

export function ReportsClient() {
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("pending")

  const { data, isLoading } = useQuery({
    queryKey: ["zyber", "reports", status],
    queryFn: () =>
      apiFetch<UserReportsPage>(`/api/zyber/reports?status=${status}&limit=50`),
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
          <CardTitle>{data ? `${data.total} reports` : "Loading…"}</CardTitle>
          <CardDescription>
            Showing {data?.reports.length ?? 0} on this page.
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
                  <TableHead className="pl-6">Reporter → Reported</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="pr-6 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.reports.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="pl-6 font-medium">
                      @{r.reporterUsername} → @{r.reportedUsername}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate">{r.reason}</div>
                      {r.notes ? (
                        <div className="truncate text-xs text-muted-foreground">
                          {r.notes}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          r.status === "pending"
                            ? "default"
                            : r.status === "reviewed"
                              ? "outline"
                              : "secondary"
                        }
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <ResolveDialog report={r} />
                    </TableCell>
                  </TableRow>
                ))}
                {data && data.reports.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-12 text-center text-sm text-muted-foreground"
                    >
                      No {status} reports.
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

function ResolveDialog({ report }: { report: UserReport }) {
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState(report.adminNotes ?? "")
  const qc = useQueryClient()

  const resolve = useMutation({
    mutationFn: (status: "reviewed" | "dismissed") =>
      apiFetch<unknown>(`/api/zyber/reports/${report.id}/resolve`, {
        method: "POST",
        body: JSON.stringify({ status, adminNotes: notes }),
      }),
    onSuccess: (_, status) => {
      toast.success(`Report ${status}`)
      qc.invalidateQueries({ queryKey: ["zyber", "reports"] })
      setOpen(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  if (report.status !== "pending") {
    return <span className="text-xs text-muted-foreground">—</span>
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        Resolve
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resolve report</DialogTitle>
          <DialogDescription>
            @{report.reporterUsername} reported @{report.reportedUsername} for:
            <br />
            <span className="text-foreground">{report.reason}</span>
          </DialogDescription>
        </DialogHeader>
        {report.notes ? (
          <div className="rounded-md border p-3 text-sm">
            <div className="text-xs font-medium text-muted-foreground">
              Reporter notes
            </div>
            {report.notes}
          </div>
        ) : null}
        <Textarea
          rows={4}
          placeholder="Admin notes (optional)…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => resolve.mutate("dismissed")}
            disabled={resolve.isPending}
          >
            Dismiss
          </Button>
          <Button
            onClick={() => resolve.mutate("reviewed")}
            disabled={resolve.isPending}
          >
            Mark reviewed
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

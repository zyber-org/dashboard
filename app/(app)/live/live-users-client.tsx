"use client"

import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { apiFetch } from "@/lib/fetcher"
import type { LiveUsersPage } from "@/lib/zyber-types"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

export function LiveUsersClient() {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ["zyber", "live-users", page],
    queryFn: () =>
      apiFetch<LiveUsersPage>(`/api/zyber/users/live?page=${page}&limit=50`),
    refetchInterval: 10_000,
  })

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{data ? `${data.total} online` : "Loading…"}</CardTitle>
          <CardDescription>
            Sorted by last activity (most recent first).
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {isLoading ? (
            <div className="space-y-2 px-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead className="pr-6">Last seen</TableHead>
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
                      {u.email ?? "—"}
                    </TableCell>
                    <TableCell>
                      {u.is_banned ? (
                        <Badge variant="destructive">Banned</Badge>
                      ) : u.is_active === false ? (
                        <Badge variant="secondary">Disabled</Badge>
                      ) : (
                        <Badge>Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="pr-6 text-muted-foreground">
                      {formatLastSeen(u.last_seen)}
                    </TableCell>
                  </TableRow>
                ))}
                {data && data.users.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-12 text-center text-sm text-muted-foreground"
                    >
                      Nobody is online right now.
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

function formatLastSeen(score: number): string {
  if (!score) return "—"
  const seconds = Math.max(0, Math.floor(Date.now() / 1000) - score)
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  return `${Math.floor(seconds / 3600)}h ago`
}

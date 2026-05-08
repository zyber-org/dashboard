"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"
import { CopyIcon, TrashIcon } from "lucide-react"
import { apiFetch } from "@/lib/fetcher"
import type { Maintainer } from "@/lib/zyber-types"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"

export function MaintainersClient() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ["zyber", "maintainers"],
    queryFn: () =>
      apiFetch<{ maintainers: Maintainer[] }>("/api/zyber/maintainers"),
  })

  const remove = useMutation({
    mutationFn: (id: number) =>
      apiFetch<unknown>(`/api/zyber/maintainers/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Maintainer deleted")
      qc.invalidateQueries({ queryKey: ["zyber", "maintainers"] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>
              {data ? `${data.maintainers.length} maintainers` : "Loading…"}
            </CardTitle>
            <CardDescription>
              Maintainers can review work-email requests for their colleges.
            </CardDescription>
          </div>
          <CreateMaintainerDialog />
        </CardHeader>
        <CardContent className="px-0">
          {isLoading ? (
            <div className="space-y-2 px-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Username</TableHead>
                  <TableHead>Display name</TableHead>
                  <TableHead>Colleges</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.maintainers.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="pl-6">
                      <div className="font-medium">@{m.username}</div>
                      <div className="text-xs text-muted-foreground">
                        by @{m.created_by}
                      </div>
                    </TableCell>
                    <TableCell>{m.display_name || "—"}</TableCell>
                    <TableCell>
                      {m.colleges.length === 0 ? (
                        <Badge variant="secondary">none</Badge>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {m.colleges.map((c) => (
                            <Badge key={c} variant="outline">
                              {c}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(m.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="pr-6 text-right space-x-1">
                      <CollegesDialog maintainer={m} />
                      <EditMaintainerDialog maintainer={m} />
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={remove.isPending}
                        onClick={() => remove.mutate(m.id)}
                      >
                        <TrashIcon className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {data && data.maintainers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-12 text-center text-sm text-muted-foreground"
                    >
                      No maintainers.
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

function CreateMaintainerDialog() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [username, setUsername] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null)

  const create = useMutation({
    mutationFn: () =>
      apiFetch<{ maintainer: Maintainer; generated_password: string }>(
        "/api/zyber/maintainers",
        {
          method: "POST",
          body: JSON.stringify({
            username,
            display_name: displayName,
          }),
        },
      ),
    onSuccess: (data) => {
      setGeneratedPassword(data.generated_password)
      qc.invalidateQueries({ queryKey: ["zyber", "maintainers"] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  function reset() {
    setUsername("")
    setDisplayName("")
    setGeneratedPassword(null)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) reset()
      }}
    >
      <DialogTrigger render={<Button size="sm" />}>New maintainer</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create maintainer</DialogTitle>
          <DialogDescription>
            A random password is generated. Save it before closing this dialog —
            it will not be shown again.
          </DialogDescription>
        </DialogHeader>
        {generatedPassword ? (
          <div className="space-y-2">
            <Label>Generated password</Label>
            <div className="flex gap-2">
              <Input value={generatedPassword} readOnly />
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(generatedPassword)
                  toast.success("Copied")
                }}
              >
                <CopyIcon className="size-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Share this securely with @{username}.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Username</Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Display name (optional)</Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
          </div>
        )}
        <DialogFooter>
          {generatedPassword ? (
            <Button onClick={() => setOpen(false)}>Done</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={!username.trim() || create.isPending}
                onClick={() => create.mutate()}
              >
                Create
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EditMaintainerDialog({ maintainer }: { maintainer: Maintainer }) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [displayName, setDisplayName] = useState(maintainer.display_name)
  const [resetPassword, setResetPassword] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null)

  const update = useMutation({
    mutationFn: () =>
      apiFetch<{ generated_password?: string }>(
        `/api/zyber/maintainers/${maintainer.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            display_name: displayName,
            reset_password: resetPassword,
          }),
        },
      ),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["zyber", "maintainers"] })
      if (data.generated_password) {
        setGeneratedPassword(data.generated_password)
      } else {
        toast.success("Maintainer updated")
        setOpen(false)
      }
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) {
          setGeneratedPassword(null)
          setResetPassword(false)
        }
      }}
    >
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        Edit
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit @{maintainer.username}</DialogTitle>
        </DialogHeader>
        {generatedPassword ? (
          <div className="space-y-2">
            <Label>New password</Label>
            <div className="flex gap-2">
              <Input value={generatedPassword} readOnly />
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(generatedPassword)
                  toast.success("Copied")
                }}
              >
                <CopyIcon className="size-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Display name</Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="reset-pwd"
                type="checkbox"
                checked={resetPassword}
                onChange={(e) => setResetPassword(e.target.checked)}
              />
              <Label htmlFor="reset-pwd">
                Reset password (will display new password)
              </Label>
            </div>
          </div>
        )}
        <DialogFooter>
          {generatedPassword ? (
            <Button onClick={() => setOpen(false)}>Done</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={update.isPending}
                onClick={() => update.mutate()}
              >
                Save
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CollegesDialog({ maintainer }: { maintainer: Maintainer }) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState(maintainer.colleges.join("\n"))

  const save = useMutation({
    mutationFn: () => {
      const colleges = text
        .split(/\n|,/)
        .map((s) => s.trim())
        .filter(Boolean)
      return apiFetch<{ colleges: string[] }>(
        `/api/zyber/maintainers/${maintainer.id}/colleges`,
        {
          method: "PUT",
          body: JSON.stringify({ colleges }),
        },
      )
    },
    onSuccess: () => {
      toast.success("Colleges updated")
      qc.invalidateQueries({ queryKey: ["zyber", "maintainers"] })
      setOpen(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        Colleges
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Colleges for @{maintainer.username}</DialogTitle>
          <DialogDescription>
            One per line, or comma-separated.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button disabled={save.isPending} onClick={() => save.mutate()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

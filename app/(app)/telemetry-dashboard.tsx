"use client"

import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { apiFetch } from "@/lib/fetcher"
import type {
  DailyCallStatsResponse,
  ReferralAnalytics,
  Telemetry,
} from "@/lib/zyber-types"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

export function TelemetryDashboard() {
  const [days, setDays] = useState("30")

  const telemetry = useQuery({
    queryKey: ["zyber", "telemetry"],
    queryFn: () => apiFetch<Telemetry>("/api/zyber/telemetry"),
    refetchInterval: 30_000,
  })

  const callStats = useQuery({
    queryKey: ["zyber", "call-stats", days],
    queryFn: () =>
      apiFetch<DailyCallStatsResponse>(
        `/api/zyber/telemetry/call-stats?days=${days}`,
      ),
  })

  const referrals = useQuery({
    queryKey: ["zyber", "referrals"],
    queryFn: () =>
      apiFetch<ReferralAnalytics>("/api/zyber/analytics/referral-sources"),
  })

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Users</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            label="Total"
            value={telemetry.data?.users.total}
            isLoading={telemetry.isLoading}
          />
          <StatCard
            label="Active"
            value={telemetry.data?.users.active}
            isLoading={telemetry.isLoading}
          />
          <StatCard
            label="Disabled"
            value={telemetry.data?.users.disabled}
            isLoading={telemetry.isLoading}
          />
          <StatCard
            label="Live now"
            value={telemetry.data?.users.live}
            highlight
            isLoading={telemetry.isLoading}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          New users
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            label="Last 24h"
            value={telemetry.data?.users.new_24h}
            isLoading={telemetry.isLoading}
          />
          <StatCard
            label="Last 7d"
            value={telemetry.data?.users.new_7d}
            isLoading={telemetry.isLoading}
          />
          <StatCard
            label="Last 30d"
            value={telemetry.data?.users.new_30d}
            isLoading={telemetry.isLoading}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Communities & calls
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            label="Communities"
            value={telemetry.data?.community.total}
            isLoading={telemetry.isLoading}
          />
          <StatCard
            label="Total members"
            value={telemetry.data?.community.total_members}
            isLoading={telemetry.isLoading}
          />
          <StatCard
            label="Active calls"
            value={telemetry.data?.calls.active}
            highlight
            isLoading={telemetry.isLoading}
          />
          <StatCard
            label="Total call minutes"
            value={
              telemetry.data
                ? Math.round(telemetry.data.calls.total_seconds / 60)
                : undefined
            }
            isLoading={telemetry.isLoading}
          />
        </div>
      </section>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Daily call seconds</CardTitle>
            <CardDescription>Aggregated call duration per day.</CardDescription>
          </div>
          <Select value={days} onValueChange={(v) => v && setDays(v)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
              <SelectItem value="365">1 year</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {callStats.isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : callStats.data && callStats.data.stats.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={callStats.data.stats}
                  margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="date"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="total_seconds"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No data.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Referral sources</CardTitle>
          <CardDescription>
            How users discovered Zyber, by self-reported source.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {referrals.isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : referrals.data && Object.keys(referrals.data.sources).length > 0 ? (
            <ReferralBars sources={referrals.data.sources} />
          ) : (
            <p className="text-sm text-muted-foreground">No referral data yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  label,
  value,
  highlight,
  isLoading,
}: {
  label: string
  value: number | undefined
  highlight?: boolean
  isLoading?: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle
          className={`text-3xl ${highlight ? "text-primary" : ""}`}
        >
          {isLoading ? <Skeleton className="h-8 w-20" /> : value ?? "—"}
        </CardTitle>
      </CardHeader>
    </Card>
  )
}

function ReferralBars({ sources }: { sources: Record<string, number> }) {
  const entries = Object.entries(sources).sort((a, b) => b[1] - a[1])
  const max = Math.max(...entries.map(([, v]) => v), 1)
  return (
    <ul className="space-y-3">
      {entries.map(([source, count]) => (
        <li key={source} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium capitalize">{source || "(unspecified)"}</span>
            <span className="text-muted-foreground tabular-nums">{count}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary"
              style={{ width: `${(count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

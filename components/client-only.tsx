"use client"

import { useEffect, useState } from "react"

// Renders children only after mount, returning the fallback during SSR and the
// first client render. Use this around subtrees that are known to produce
// hydration ID mismatches (e.g. base-ui Tooltip / Dialog / Dropdown stacks).
export function ClientOnly({
  children,
  fallback = null,
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted ? <>{children}</> : <>{fallback}</>
}

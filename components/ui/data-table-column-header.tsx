"use client"

import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronsUpDownIcon,
  EyeOffIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Props = {
  title: string
  className?: string
  sort?: "asc" | "desc" | null
  onSort?: (next: "asc" | "desc") => void
  canSort?: boolean
  canHide?: boolean
  onHide?: () => void
}

export function DataTableColumnHeader({
  title,
  className,
  sort,
  onSort,
  canSort = false,
  canHide = false,
  onHide,
}: Props) {
  if (!canSort && !canHide) {
    return <span className={cn("text-foreground", className)}>{title}</span>
  }

  return (
    <div className={cn("flex items-center -ml-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="sm"
              className="-ml-1 h-8 data-[state=open]:bg-accent"
            />
          }
        >
          <span>{title}</span>
          {canSort ? (
            sort === "desc" ? (
              <ArrowDownIcon className="ml-2 size-3.5" />
            ) : sort === "asc" ? (
              <ArrowUpIcon className="ml-2 size-3.5" />
            ) : (
              <ChevronsUpDownIcon className="ml-2 size-3.5 opacity-60" />
            )
          ) : null}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {canSort && onSort ? (
            <>
              <DropdownMenuItem onClick={() => onSort("asc")}>
                <ArrowUpIcon className="size-3.5" /> Asc
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSort("desc")}>
                <ArrowDownIcon className="size-3.5" /> Desc
              </DropdownMenuItem>
            </>
          ) : null}
          {canHide && canSort ? <DropdownMenuSeparator /> : null}
          {canHide && onHide ? (
            <DropdownMenuItem onClick={onHide}>
              <EyeOffIcon className="size-3.5" /> Hide
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

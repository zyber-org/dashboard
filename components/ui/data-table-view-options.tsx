"use client"

import type { Table } from "@tanstack/react-table"
import { SettingsIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function DataTableViewOptions<TData>({
  table,
}: {
  table: Table<TData>
}) {
  const hideable = table
    .getAllColumns()
    .filter((c) => typeof c.accessorFn !== "undefined" && c.getCanHide())

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" className="ml-auto">
            <SettingsIcon className="size-4" />
            <span className="hidden sm:inline">Columns</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {hideable.map((column) => {
            const meta = column.columnDef.meta as { label?: string } | undefined
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {meta?.label ?? column.id}
              </DropdownMenuCheckboxItem>
            )
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

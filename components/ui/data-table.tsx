"use client"

import {
  flexRender,
  type Table as TanStackTable,
} from "@tanstack/react-table"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

type ColumnMeta = {
  label?: string
  truncate?: boolean
}

type Props<TData> = {
  table: TanStackTable<TData>
  isLoading?: boolean
  /** Rendered when there are no rows to show. */
  emptyState?: React.ReactNode
  /** Number of skeleton rows to show while loading. */
  loadingRowCount?: number
}

export function DataTable<TData>({
  table,
  isLoading = false,
  emptyState = "No results.",
  loadingRowCount = 8,
}: Props<TData>) {
  const columnCount = table.getAllLeafColumns().length

  return (
    <Table className="table-fixed">
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              const canResize = header.column.getCanResize()
              return (
                <TableHead
                  key={header.id}
                  colSpan={header.colSpan}
                  style={{ width: header.getSize() }}
                  className="relative select-none"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                  {canResize ? (
                    <div
                      onMouseDown={header.getResizeHandler()}
                      onTouchStart={header.getResizeHandler()}
                      onDoubleClick={() => header.column.resetSize()}
                      role="separator"
                      aria-orientation="vertical"
                      aria-label="Resize column"
                      className={cn(
                        "absolute -right-px top-0 z-10 h-full w-2 cursor-col-resize touch-none select-none",
                        "after:absolute after:right-1 after:top-1/4 after:h-1/2 after:w-px after:bg-border",
                        "hover:after:w-0.5 hover:after:bg-foreground/40",
                        header.column.getIsResizing() &&
                          "after:bg-primary after:w-0.5",
                      )}
                    />
                  ) : null}
                </TableHead>
              )
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {isLoading ? (
          Array.from({ length: loadingRowCount }).map((_, i) => (
            <TableRow key={`s${i}`}>
              {table.getVisibleLeafColumns().map((column) => (
                <TableCell
                  key={column.id}
                  style={{ width: column.getSize() }}
                >
                  <Skeleton className="h-5 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : table.getRowModel().rows.length > 0 ? (
          table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              data-state={row.getIsSelected() ? "selected" : undefined}
            >
              {row.getVisibleCells().map((cell) => {
                const meta = cell.column.columnDef.meta as
                  | ColumnMeta
                  | undefined
                const truncate = meta?.truncate !== false
                return (
                  <TableCell
                    key={cell.id}
                    style={{ width: cell.column.getSize() }}
                    className="overflow-hidden"
                  >
                    {truncate ? (
                      <div className="truncate">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </div>
                    ) : (
                      flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )
                    )}
                  </TableCell>
                )
              })}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell
              colSpan={columnCount}
              className="py-12 text-center text-sm text-muted-foreground"
            >
              {emptyState}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}

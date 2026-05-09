"use client"

import type { Table } from "@tanstack/react-table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Props<TData> = {
  table: Table<TData>
  pageSizes?: number[]
  totalLabel?: (count: number) => string
}

export function DataTablePagination<TData>({
  table,
  pageSizes = [10, 25, 50, 100],
  totalLabel,
}: Props<TData>) {
  const pageIndex = table.getState().pagination.pageIndex
  const pageCount = table.getPageCount()
  const pageSize = table.getState().pagination.pageSize
  const total =
    table.options.rowCount ?? table.getFilteredRowModel().rows.length

  const items = paginationItems(pageIndex + 1, pageCount)
  const goto = (e: React.MouseEvent, target: number) => {
    e.preventDefault()
    if (target < 1 || target > pageCount || target === pageIndex + 1) return
    table.setPageIndex(target - 1)
  }

  return (
    <div className="flex flex-col gap-3 px-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-muted-foreground">
        {totalLabel
          ? totalLabel(total)
          : `${total.toLocaleString()} ${total === 1 ? "row" : "rows"}`}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => v && table.setPageSize(Number(v))}
          >
            <SelectTrigger size="sm" className="w-[72px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizes.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {pageCount > 1 ? (
          <Pagination className="mx-0 w-auto justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  aria-disabled={!table.getCanPreviousPage()}
                  className={
                    !table.getCanPreviousPage()
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                  onClick={(e) => goto(e, pageIndex)}
                />
              </PaginationItem>
              {items.map((item, i) =>
                item === "ellipsis" ? (
                  <PaginationItem key={`e${i}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={item}>
                    <PaginationLink
                      href="#"
                      isActive={item === pageIndex + 1}
                      onClick={(e) => goto(e, item)}
                    >
                      {item}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  aria-disabled={!table.getCanNextPage()}
                  className={
                    !table.getCanNextPage()
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                  onClick={(e) => goto(e, pageIndex + 2)}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        ) : null}
      </div>
    </div>
  )
}

function paginationItems(
  page: number,
  totalPages: number,
): Array<number | "ellipsis"> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  const items: Array<number | "ellipsis"> = [1]
  const start = Math.max(2, page - 1)
  const end = Math.min(totalPages - 1, page + 1)
  if (start > 2) items.push("ellipsis")
  for (let p = start; p <= end; p++) items.push(p)
  if (end < totalPages - 1) items.push("ellipsis")
  items.push(totalPages)
  return items
}

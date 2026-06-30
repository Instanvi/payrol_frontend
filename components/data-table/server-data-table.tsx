"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type VisibilityState,
} from "@tanstack/react-table"

import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import {
  DataTableFacetedFilter,
  ServerDataTableToolbar,
} from "@/components/data-table/data-table-faceted-filter"
import {
  getDataTableRowId,
  withSelectColumn,
} from "@/components/data-table/data-table-select-column"
import type { ListParams, PaginationMeta, SortOrder } from "@/lib/api/types"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface FacetedFilterConfig {
  key: "status" | "role" | "level"
  title: string
  options: { label: string; value: string }[]
}

interface ServerDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  meta?: PaginationMeta
  params: ListParams
  onParamsChange: (updates: Partial<ListParams>) => void
  isLoading?: boolean
  isFetching?: boolean
  searchPlaceholder?: string
  filters?: FacetedFilterConfig[]
  enableRowSelection?: boolean
  onRowSelectionChange?: (selection: RowSelectionState) => void
  toolbarChildren?: React.ReactNode
  toolbarActions?: React.ReactNode
  emptyMessage?: string
  hidePagination?: boolean
  renderMobileRow?: (row: TData) => React.ReactNode
}

export function ServerDataTable<TData, TValue>({
  columns,
  data,
  meta,
  params,
  onParamsChange,
  isLoading = false,
  isFetching = false,
  searchPlaceholder,
  filters,
  enableRowSelection = true,
  onRowSelectionChange,
  toolbarChildren,
  toolbarActions,
  emptyMessage = "No results.",
  hidePagination = false,
  renderMobileRow,
}: ServerDataTableProps<TData, TValue>) {
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [searchInput, setSearchInput] = React.useState(params.search ?? "")

  const tableColumns = React.useMemo(
    () => withSelectColumn(columns, enableRowSelection),
    [columns, enableRowSelection]
  )

  React.useEffect(() => {
    setSearchInput(params.search ?? "")
  }, [params.search])

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== (params.search ?? "")) {
        onParamsChange({ search: searchInput, page: 1 })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput, params.search, onParamsChange])

  const pageIndex = (params.page ?? 1) - 1
  const pageSize = params.pageSize ?? 10
  const pageCount = meta?.totalPages ?? 1

  const table = useReactTable({
    data,
    columns: tableColumns,
    pageCount,
    state: {
      pagination: { pageIndex, pageSize },
      columnVisibility,
      rowSelection,
    },
    enableRowSelection,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(rowSelection) : updater
      setRowSelection(next)
      onRowSelectionChange?.(next)
    },
    onPaginationChange: (updater) => {
      const current = { pageIndex, pageSize }
      const next = typeof updater === "function" ? updater(current) : updater
      onParamsChange({
        page: next.pageIndex + 1,
        pageSize: next.pageSize,
      })
    },
    getCoreRowModel: getCoreRowModel(),
    getRowId: getDataTableRowId,
  })

  function handleSortChange(sortBy: string, sortOrder: SortOrder) {
    onParamsChange({ sortBy, sortOrder, page: 1 })
  }

  return (
    <div className="space-y-4">
      <ServerDataTableToolbar
        search={searchInput}
        searchPlaceholder={searchPlaceholder}
        onSearchChange={setSearchInput}
        actions={toolbarActions}
      >
        {filters?.map((filter) => (
          <DataTableFacetedFilter
            key={filter.key}
            title={filter.title}
            options={filter.options}
            value={params[filter.key] as string | undefined}
            onChange={(value) =>
              onParamsChange({ [filter.key]: value, page: 1 })
            }
          />
        ))}
        {toolbarChildren}
      </ServerDataTableToolbar>

      <div className={cn(isFetching && !isLoading && "opacity-70 transition-opacity")}>
        {renderMobileRow ? (
          <div className="space-y-3 md:hidden">
            {isLoading
              ? Array.from({ length: Math.min(pageSize, 5) }).map((_, i) => (
                  <Skeleton key={i} className="h-28 w-full rounded-lg" />
                ))
              : data.length > 0
                ? data.map((row, index) => (
                    <React.Fragment key={getDataTableRowId(row, index)}>
                      {renderMobileRow(row)}
                    </React.Fragment>
                  ))
                : (
                    <div className="rounded-xl bg-card py-10 text-center text-sm text-muted-foreground">
                      {emptyMessage}
                    </div>
                  )}
          </div>
        ) : null}

        <div
          className={cn(
            "overflow-hidden rounded-xl bg-card",
            renderMobileRow && "hidden md:block"
          )}
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: pageSize }).map((_, i) => (
                    <TableRow key={i}>
                      {tableColumns.map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={tableColumns.length}
                      className="h-24 text-center"
                    >
                      {emptyMessage}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {!hidePagination && meta && (
        <DataTablePagination table={table} />
      )}

      {meta && meta.total > 0 && (
        <p className="text-xs text-muted-foreground">
          Showing {data.length} of {meta.total} result(s)
        </p>
      )}
    </div>
  )
}

export { type FacetedFilterConfig }

"use client"

import type { Table } from "@tanstack/react-table"

import { Input } from "@/components/ui/input"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  searchKey?: string
  searchPlaceholder?: string
  children?: React.ReactNode
}

export function DataTableToolbar<TData>({
  table,
  searchKey,
  searchPlaceholder = "Search...",
  children,
}: DataTableToolbarProps<TData>) {
  return (
    <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1">
      {searchKey && (
        <Input
          placeholder={searchPlaceholder}
          value={
            (table.getColumn(searchKey)?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn(searchKey)?.setFilterValue(event.target.value)
          }
          className="w-[150px] shrink-0 lg:w-[220px]"
        />
      )}
      {children}
    </div>
  )
}

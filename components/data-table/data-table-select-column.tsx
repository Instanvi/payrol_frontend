import type { ColumnDef } from "@tanstack/react-table"

import { Checkbox } from "@/components/ui/checkbox"

export function dataTableSelectColumn<TData>(): ColumnDef<TData> {
  return {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        disabled={!table.getRowModel().rows.some((row) => row.getCanSelect())}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  }
}

export function withSelectColumn<TData, TValue = unknown>(
  columns: ColumnDef<TData, TValue>[],
  enableRowSelection: boolean
): ColumnDef<TData, TValue>[] {
  if (!enableRowSelection) return columns
  if (columns.some((column) => column.id === "select")) return columns
  return [dataTableSelectColumn<TData>() as ColumnDef<TData, TValue>, ...columns]
}

export function getDataTableRowId<TData>(row: TData, index: number) {
  const record = row as { id?: string }
  return record.id ?? String(index)
}

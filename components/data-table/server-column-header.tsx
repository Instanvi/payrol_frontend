"use client"

import type { Column } from "@tanstack/react-table"
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { SortOrder } from "@/lib/api/types"
import { cn } from "@/lib/utils"

interface ServerColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>
  title: string
  sortBy?: string
  sortOrder?: SortOrder
  onSortChange?: (sortBy: string, sortOrder: SortOrder) => void
  className?: string
}

export function ServerColumnHeader<TData, TValue>({
  column,
  title,
  sortBy,
  sortOrder,
  onSortChange,
  className,
}: ServerColumnHeaderProps<TData, TValue>) {
  const columnId = column.id
  const isSorted = sortBy === columnId
  const canSort = column.getCanSort() && onSortChange

  if (!canSort) {
    return <div className={cn(className)}>{title}</div>
  }

  function toggleSort() {
    if (!onSortChange) return
    if (!isSorted) {
      onSortChange(columnId, "asc")
      return
    }
    if (sortOrder === "asc") {
      onSortChange(columnId, "desc")
      return
    }
    onSortChange("createdAt", "desc")
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8"
        onClick={toggleSort}
      >
        <span>{title}</span>
        {!isSorted ? (
          <ChevronsUpDownIcon className="size-4" />
        ) : sortOrder === "desc" ? (
          <ArrowDownIcon className="size-4" />
        ) : (
          <ArrowUpIcon className="size-4" />
        )}
      </Button>
    </div>
  )
}

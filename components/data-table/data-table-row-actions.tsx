"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontalIcon } from "lucide-react"

export interface RowAction {
  label: string
  onClick: () => void
  destructive?: boolean
  disabled?: boolean
}

interface DataTableRowActionsProps {
  actions: RowAction[]
}

export function DataTableRowActions({ actions }: DataTableRowActionsProps) {
  const visibleActions = actions.filter((a) => !a.disabled)

  if (visibleActions.length === 0) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="size-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontalIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        {visibleActions.map((action, index) => (
          <div key={action.label}>
            {index > 0 && action.destructive && <DropdownMenuSeparator />}
            <DropdownMenuItem
              variant={action.destructive ? "destructive" : "default"}
              onClick={action.onClick}
            >
              {action.label}
            </DropdownMenuItem>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

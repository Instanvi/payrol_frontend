"use client"

import type { Table } from "@tanstack/react-table"
import { CheckIcon, PlusCircleIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface FacetedFilterOption {
  label: string
  value: string
  icon?: React.ReactNode
}

interface DataTableFacetedFilterProps {
  title: string
  options: FacetedFilterOption[]
  value?: string
  onChange: (value: string | undefined) => void
}

export function DataTableFacetedFilter({
  title,
  options,
  value,
  onChange,
}: DataTableFacetedFilterProps) {
  const selected = options.find((option) => option.value === value)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="border-dashed">
          <PlusCircleIcon className="size-4" />
          {title}
          {selected && (
            <>
              <span className="mx-2 hidden h-4 w-px bg-border sm:block" />
              <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                {selected.label}
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = value === option.value
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() =>
                      onChange(isSelected ? undefined : option.value)
                    }
                  >
                    <div
                      className={cn(
                        "flex size-4 items-center justify-center rounded-sm border border-primary",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <CheckIcon className="size-3" />
                    </div>
                    {option.icon}
                    <span>{option.label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {value && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => onChange(undefined)}
                    className="justify-center text-center"
                  >
                    Clear filter
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

interface ServerDataTableToolbarProps {
  search: string
  searchPlaceholder?: string
  onSearchChange: (value: string) => void
  children?: React.ReactNode
  actions?: React.ReactNode
  table?: Table<unknown>
}

export function ServerDataTableToolbar({
  search,
  searchPlaceholder = "Search...",
  onSearchChange,
  children,
  actions,
}: ServerDataTableToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        className="min-w-0 flex-1 basis-[8rem] sm:flex-none sm:basis-auto sm:w-[150px] lg:w-[250px]"
        placeholder={searchPlaceholder}
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      {children}
      {actions ? (
        <div className="ml-auto flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  )
}

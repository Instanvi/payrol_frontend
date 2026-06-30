"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/api/query-keys"
import type { ListParams } from "@/lib/api/types"
import { useDebounce } from "@/hooks/use-debounce"
import { dashboardService, employeesService } from "@/lib/services/employees.service"

export function useEmployeesQuery(params: ListParams) {
  const debouncedSearch = useDebounce(params.search ?? "", 300)
  const queryParams = { ...params, search: debouncedSearch }

  return useQuery({
    queryKey: queryKeys.employees.list(queryParams),
    queryFn: () => employeesService.list(queryParams),
    placeholderData: keepPreviousData,
  })
}

export function useEmployeeQuery(id: string | null) {
  return useQuery({
    queryKey: queryKeys.employees.detail(id ?? ""),
    queryFn: () => employeesService.get(id!),
    enabled: !!id,
  })
}

export function useActiveEmployeesQuery() {
  return useQuery({
    queryKey: queryKeys.employees.active(),
    queryFn: () => employeesService.listActive(),
    staleTime: 60_000,
  })
}

export function useDashboardStatsQuery() {
  return useQuery({
    queryKey: queryKeys.dashboard.stats,
    queryFn: () => dashboardService.getStats(),
  })
}

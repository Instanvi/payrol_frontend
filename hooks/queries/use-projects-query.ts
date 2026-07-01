"use client"

import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/api/query-keys"
import { projectsService } from "@/lib/services/projects.service"

export function useProjectsQuery(status?: "active" | "inactive") {
  return useQuery({
    queryKey: queryKeys.projects.list(status),
    queryFn: () => projectsService.list(status),
  })
}

export function useProjectQuery(id: string | null) {
  return useQuery({
    queryKey: queryKeys.projects.detail(id ?? ""),
    queryFn: () => projectsService.get(id!),
    enabled: Boolean(id),
  })
}

export function useProjectEmployeesQuery(id: string | null) {
  return useQuery({
    queryKey: queryKeys.projects.employees(id ?? ""),
    queryFn: () => projectsService.listEmployees(id!),
    enabled: Boolean(id),
  })
}

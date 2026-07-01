"use client"

import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/api/query-keys"
import { companiesService } from "@/lib/services/companies.service"

export function useInstanviIntegrationQuery() {
  return useQuery({
    queryKey: queryKeys.companies.instanviIntegration(),
    queryFn: () => companiesService.getInstanviIntegration(),
    staleTime: 30_000,
  })
}

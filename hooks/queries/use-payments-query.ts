"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/api/query-keys"
import type { ListParams } from "@/lib/api/types"
import { useDebounce } from "@/hooks/use-debounce"
import { paymentsService } from "@/lib/services/payments.service"
import { transactionsService } from "@/lib/services/transactions.service"

export function usePaymentsQuery(params: ListParams) {
  const debouncedSearch = useDebounce(params.search ?? "", 300)
  const queryParams = { ...params, search: debouncedSearch }

  return useQuery({
    queryKey: queryKeys.payments.list(queryParams),
    queryFn: () => paymentsService.list(queryParams),
    placeholderData: keepPreviousData,
  })
}

export function usePaymentQuery(id: string | null) {
  return useQuery({
    queryKey: queryKeys.payments.detail(id ?? ""),
    queryFn: () => paymentsService.get(id!),
    enabled: !!id,
  })
}

export function usePayRunTransactionsQuery(payRunId: string | null) {
  return useQuery({
    queryKey: queryKeys.payments.transactions(payRunId ?? ""),
    queryFn: () => transactionsService.listByPayRun(payRunId!),
    enabled: !!payRunId,
    refetchInterval: (query) => {
      const rows = query.state.data
      if (rows?.some((row) => row.status === "processing")) {
        return 10_000
      }
      return false
    },
  })
}

export function usePayRunMobileValidationQuery(payRunId: string | null) {
  return useQuery({
    queryKey: queryKeys.payments.mobileValidation(payRunId ?? ""),
    queryFn: () => paymentsService.getMobileValidation(payRunId!),
    enabled: !!payRunId,
  })
}

export function useTransactionsQuery(params: ListParams) {
  const debouncedSearch = useDebounce(params.search ?? "", 300)
  const queryParams = { ...params, search: debouncedSearch }

  return useQuery({
    queryKey: queryKeys.transactions.list(queryParams),
    queryFn: () => transactionsService.list(queryParams),
    placeholderData: keepPreviousData,
  })
}

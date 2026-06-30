"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/api/query-keys"
import type { ListParams } from "@/lib/api/types"
import { useDebounce } from "@/hooks/use-debounce"
import { membersService } from "@/lib/services/members.service"

export function useMembersQuery(params: ListParams) {
  const debouncedSearch = useDebounce(params.search ?? "", 300)
  const queryParams = { ...params, search: debouncedSearch }

  return useQuery({
    queryKey: queryKeys.members.list(queryParams),
    queryFn: () => membersService.list(queryParams),
    placeholderData: keepPreviousData,
  })
}

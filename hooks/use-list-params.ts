"use client"

import { useCallback, useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import type { ListParams, SortOrder } from "@/lib/api/types"
import { DEFAULT_LIST_PARAMS } from "@/lib/api/types"

export function useListParams(defaults: Partial<ListParams> = {}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const params = useMemo<ListParams>(() => {
    const page = Number(searchParams.get("page") ?? defaults.page ?? DEFAULT_LIST_PARAMS.page)
    const pageSize = Number(
      searchParams.get("pageSize") ?? defaults.pageSize ?? DEFAULT_LIST_PARAMS.pageSize
    )

    return {
      page: Number.isFinite(page) ? page : DEFAULT_LIST_PARAMS.page,
      pageSize: Number.isFinite(pageSize) ? pageSize : DEFAULT_LIST_PARAMS.pageSize,
      search: searchParams.get("search") ?? defaults.search ?? DEFAULT_LIST_PARAMS.search,
      sortBy: searchParams.get("sortBy") ?? defaults.sortBy ?? DEFAULT_LIST_PARAMS.sortBy,
      sortOrder:
        (searchParams.get("sortOrder") as SortOrder) ??
        defaults.sortOrder ??
        DEFAULT_LIST_PARAMS.sortOrder,
      status: searchParams.get("status") ?? defaults.status,
      role: searchParams.get("role") ?? defaults.role,
      payRunId: searchParams.get("payRunId") ?? defaults.payRunId,
      projectId: searchParams.get("projectId") ?? defaults.projectId,
      level: searchParams.get("level") ?? defaults.level,
      mobileAccountStatus:
        searchParams.get("mobileAccountStatus") ?? defaults.mobileAccountStatus,
      carrier: searchParams.get("carrier") ?? defaults.carrier,
    }
  }, [searchParams, defaults])

  const setParams = useCallback(
    (updates: Partial<ListParams>, options?: { replace?: boolean }) => {
      const next = { ...params, ...updates }
      const urlParams = new URLSearchParams(searchParams.toString())

      urlParams.set("page", String(next.page ?? DEFAULT_LIST_PARAMS.page))
      urlParams.set("pageSize", String(next.pageSize ?? DEFAULT_LIST_PARAMS.pageSize))

      if (next.search) urlParams.set("search", next.search)
      else urlParams.delete("search")

      if (next.sortBy) urlParams.set("sortBy", next.sortBy)
      else urlParams.delete("sortBy")

      if (next.sortOrder) urlParams.set("sortOrder", next.sortOrder)
      else urlParams.delete("sortOrder")

      if (next.status) urlParams.set("status", next.status)
      else urlParams.delete("status")

      if (next.role) urlParams.set("role", next.role)
      else urlParams.delete("role")

      if (next.payRunId) urlParams.set("payRunId", next.payRunId)
      else urlParams.delete("payRunId")

      if (next.projectId) urlParams.set("projectId", next.projectId)
      else urlParams.delete("projectId")

      if (next.level) urlParams.set("level", next.level)
      else urlParams.delete("level")

      if (next.mobileAccountStatus) {
        urlParams.set("mobileAccountStatus", next.mobileAccountStatus)
      } else urlParams.delete("mobileAccountStatus")

      if (next.carrier) urlParams.set("carrier", next.carrier)
      else urlParams.delete("carrier")

      const query = urlParams.toString()
      const url = query ? `${pathname}?${query}` : pathname
      router.replace(url, { scroll: false })
    },
    [params, pathname, router, searchParams]
  )

  const resetParams = useCallback(() => {
    router.replace(pathname, { scroll: false })
  }, [pathname, router])

  return { params, setParams, resetParams }
}

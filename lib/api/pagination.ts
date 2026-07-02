import type { ListParams, PaginatedResponse, PaginationMeta } from "@/lib/api/types"
import { DEFAULT_LIST_PARAMS } from "@/lib/api/types"

export function normalizeListParams(params: ListParams = {}) {
  return {
    page: Math.max(1, params.page ?? DEFAULT_LIST_PARAMS.page),
    pageSize: Math.max(1, Math.min(100, params.pageSize ?? DEFAULT_LIST_PARAMS.pageSize)),
    search: (params.search ?? DEFAULT_LIST_PARAMS.search).trim().toLowerCase(),
    sortBy: params.sortBy ?? DEFAULT_LIST_PARAMS.sortBy,
    sortOrder: params.sortOrder ?? DEFAULT_LIST_PARAMS.sortOrder,
    status: params.status?.trim() || undefined,
    role: params.role?.trim() || undefined,
    payRunId: params.payRunId?.trim() || undefined,
    projectId: params.projectId?.trim() || undefined,
    level: params.level?.trim() || undefined,
    mobileAccountStatus: params.mobileAccountStatus?.trim() || undefined,
    carrier: params.carrier?.trim() || undefined,
  }
}

export function paginateList<T>(
  items: T[],
  params: ListParams,
  options?: {
    searchKeys?: (keyof T)[]
    filter?: (item: T, normalized: ReturnType<typeof normalizeListParams>) => boolean
  }
): PaginatedResponse<T> {
  const normalized = normalizeListParams(params)
  let filtered = [...items]

  if (normalized.search && options?.searchKeys?.length) {
    filtered = filtered.filter((item) =>
      options.searchKeys!.some((key) => {
        const value = item[key]
        return (
          typeof value === "string" &&
          value.toLowerCase().includes(normalized.search)
        )
      })
    )
  }

  if (options?.filter) {
    filtered = filtered.filter((item) => options.filter!(item, normalized))
  }

  filtered.sort((a, b) => {
    const aVal = (a as Record<string, unknown>)[normalized.sortBy]
    const bVal = (b as Record<string, unknown>)[normalized.sortBy]

    if (aVal == null && bVal == null) return 0
    if (aVal == null) return 1
    if (bVal == null) return -1

    let cmp = 0
    if (typeof aVal === "number" && typeof bVal === "number") {
      cmp = aVal - bVal
    } else {
      cmp = String(aVal).localeCompare(String(bVal))
    }

    return normalized.sortOrder === "asc" ? cmp : -cmp
  })

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / normalized.pageSize))
  const page = Math.min(normalized.page, totalPages)
  const start = (page - 1) * normalized.pageSize
  const data = filtered.slice(start, start + normalized.pageSize)

  const meta: PaginationMeta = {
    page,
    pageSize: normalized.pageSize,
    total,
    totalPages,
  }

  return { data, meta }
}

export function listParamsToSearchParams(params: ListParams): URLSearchParams {
  const normalized = normalizeListParams(params)
  const searchParams = new URLSearchParams()

  searchParams.set("page", String(normalized.page))
  searchParams.set("pageSize", String(normalized.pageSize))
  if (normalized.search) searchParams.set("search", normalized.search)
  if (normalized.sortBy) searchParams.set("sortBy", normalized.sortBy)
  if (normalized.sortOrder) searchParams.set("sortOrder", normalized.sortOrder)
  if (normalized.status) searchParams.set("status", normalized.status)
  if (normalized.role) searchParams.set("role", normalized.role)
  if (normalized.payRunId) searchParams.set("payRunId", normalized.payRunId)
  if (normalized.projectId) searchParams.set("projectId", normalized.projectId)
  if (normalized.level) searchParams.set("level", normalized.level)
  if (normalized.mobileAccountStatus) {
    searchParams.set("mobileAccountStatus", normalized.mobileAccountStatus)
  }
  if (normalized.carrier) searchParams.set("carrier", normalized.carrier)

  return searchParams
}

export type SortOrder = "asc" | "desc"

export interface ListParams {
  page?: number
  pageSize?: number
  search?: string
  sortBy?: string
  sortOrder?: SortOrder
  status?: string
  role?: string
  payRunId?: string
  projectId?: string
  level?: string
  mobileAccountStatus?: string
  carrier?: string
}

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

export interface ApiErrorResponse {
  message: string
  code?: string
}

export interface DashboardStats {
  employees: number
  activeEmployees: number
  pendingPayRuns: number
  totalPayRuns: number
  totalTransactions: number
  pendingTransactions: number
}

export const DEFAULT_LIST_PARAMS: Required<
  Pick<ListParams, "page" | "pageSize" | "search" | "sortBy" | "sortOrder">
> = {
  page: 1,
  pageSize: 10,
  search: "",
  sortBy: "createdAt",
  sortOrder: "desc",
}

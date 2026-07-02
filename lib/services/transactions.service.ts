import { api } from "@/lib/api/axios"
import { listParamsToSearchParams } from "@/lib/api/pagination"
import type { ListParams, PaginatedResponse } from "@/lib/api/types"
import type { PayrollTransaction } from "@/lib/types"

export const transactionsService = {
  list(params: ListParams = {}) {
    return api
      .get<PaginatedResponse<PayrollTransaction>>("/transactions", {
        params: listParamsToSearchParams(params),
      })
      .then((res) => res.data)
  },

  async listAll(params: ListParams = {}) {
    const pageSize = 100
    const first = await this.list({ ...params, page: 1, pageSize })
    const rows = [...first.data]

    for (let page = 2; page <= first.meta.totalPages; page++) {
      const next = await this.list({ ...params, page, pageSize })
      rows.push(...next.data)
    }

    return rows
  },

  listByPayRun(payRunId: string) {
    return api
      .get<{ data: PayrollTransaction[] }>(`/payments/${payRunId}/transactions`)
      .then((res) => res.data.data)
  },
}

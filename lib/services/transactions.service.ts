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

  listByPayRun(payRunId: string) {
    return api
      .get<{ data: PayrollTransaction[] }>(`/payments/${payRunId}/transactions`)
      .then((res) => res.data.data)
  },
}

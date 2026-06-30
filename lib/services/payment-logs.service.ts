import { api } from "@/lib/api/axios"
import { listParamsToSearchParams } from "@/lib/api/pagination"
import type { ListParams, PaginatedResponse } from "@/lib/api/types"
import type { PaymentLog } from "@/lib/types"

export const paymentLogsService = {
  list(params: ListParams = {}) {
    return api
      .get<PaginatedResponse<PaymentLog>>("/payment-logs", {
        params: listParamsToSearchParams(params),
      })
      .then((res) => res.data)
  },
}

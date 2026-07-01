import { api } from "@/lib/api/axios"
import { listParamsToSearchParams } from "@/lib/api/pagination"
import type { ListParams, PaginatedResponse } from "@/lib/api/types"
import type {
  BulkDisburseResult,
  MobilePayRunValidation,
  PaymentBatch,
  PaymentStatus,
} from "@/lib/types"

export const paymentsService = {
  list(params: ListParams = {}) {
    return api
      .get<PaginatedResponse<PaymentBatch>>("/payments", {
        params: listParamsToSearchParams(params),
      })
      .then((res) => res.data)
  },

  get(id: string) {
    return api.get<PaymentBatch>(`/payments/${id}`).then((res) => res.data)
  },

  create(
    data: Omit<
      PaymentBatch,
      "id" | "createdAt" | "status" | "employeeCount"
    > & { projectId: string }
  ) {
    return api.post<PaymentBatch>("/payments", data).then((res) => res.data)
  },

  updateStatus(id: string, status: PaymentStatus) {
    return api
      .patch<PaymentBatch>(`/payments/${id}/status`, { status })
      .then((res) => res.data)
  },

  getMobileValidation(id: string) {
    return api
      .get<MobilePayRunValidation>(`/payments/${id}/mobile-validation`)
      .then((res) => res.data)
  },

  bulkDisburse(
    id: string,
    data: { currency?: string; employeeIds?: string[]; transactionIds?: string[] },
    idempotencyKey: string
  ) {
    return api
      .post<BulkDisburseResult>(`/payments/${id}/bulk-disburse`, data, {
        headers: { "Idempotency-Key": idempotencyKey },
      })
      .then((res) => res.data)
  },
}

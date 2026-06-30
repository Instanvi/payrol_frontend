"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { queryKeys } from "@/lib/api/query-keys"
import type { PaymentFormInput } from "@/lib/validations/payment.schema"
import { paymentFormToPayload } from "@/lib/validations/payment.schema"
import { paymentsService } from "@/lib/services/payments.service"
import type { PaymentStatus } from "@/lib/types"
import { ApiError } from "@/lib/types"

function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Something went wrong. Please try again."
}

export function useCreatePaymentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: PaymentFormInput) =>
      paymentsService.create(paymentFormToPayload(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

export function useUpdatePaymentStatusMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: PaymentStatus }) =>
      paymentsService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

export function useBulkDisburseMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      payRunId,
      idempotencyKey,
      employeeIds,
      transactionIds,
    }: {
      payRunId: string
      idempotencyKey: string
      employeeIds?: string[]
      transactionIds?: string[]
    }) =>
      paymentsService.bulkDisburse(
        payRunId,
        { employeeIds, transactionIds },
        idempotencyKey
      ),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all })
      queryClient.invalidateQueries({
        queryKey: queryKeys.payments.mobileValidation(result.payRunId),
      })
      toast.success(
        `Queued ${result.queuedCount} mobile payment(s)${result.skippedCount ? `, skipped ${result.skippedCount}` : ""}`
      )
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

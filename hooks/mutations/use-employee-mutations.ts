"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { queryKeys } from "@/lib/api/query-keys"
import type { CsvEmployeeRow } from "@/lib/validations/employee.schema"
import type { EmployeeFormValues } from "@/lib/validations/employee.schema"
import { employeesService } from "@/lib/services/employees.service"
import { ApiError } from "@/lib/types"

function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Something went wrong. Please try again."
}

export function useCreateEmployeeMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: EmployeeFormValues) => employeesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

export function useUpdateEmployeeMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EmployeeFormValues }) =>
      employeesService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.detail(id) })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

export function useDeactivateEmployeeMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => employeesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

export function useImportEmployeesMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (rows: CsvEmployeeRow[]) => employeesService.importCsv(rows),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

export function useValidateEmployeeAccountMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => employeesService.validateAccount(id),
    onSuccess: (employee) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all })
      queryClient.invalidateQueries({
        queryKey: queryKeys.employees.detail(employee.id),
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all })
      const label = employee.mobileAccountValid ? "valid" : "invalid"
      const holder = employee.mobileAccountHolderName
        ? ` — MoMo: ${employee.mobileAccountHolderName}`
        : ""
      toast.success(`${employee.name}: mobile account is ${label}${holder}`)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

export function useValidateEmployeeAccountsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (employeeIds?: string[]) =>
      employeesService.validateAccounts(employeeIds),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all })
      const { summary } = result
      toast.success(
        `Validated ${summary.total} account(s): ${summary.valid} valid, ${summary.invalid} invalid`
      )
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

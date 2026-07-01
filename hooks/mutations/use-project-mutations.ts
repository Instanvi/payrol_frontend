"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { queryKeys } from "@/lib/api/query-keys"
import { projectsService } from "@/lib/services/projects.service"
import { ApiError } from "@/lib/types"

function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Something went wrong. Please try again."
}

export function useCreateProjectMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: projectsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

export function useUpdateProjectMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      ...input
    }: {
      id: string
      name?: string
      code?: string
      description?: string
      status?: "active" | "inactive"
    }) => projectsService.update(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(variables.id),
      })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

export function useSetProjectEmployeesMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      projectId,
      employeeIds,
    }: {
      projectId: string
      employeeIds: string[]
    }) => projectsService.setEmployees(projectId, employeeIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.employees(variables.projectId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(variables.projectId),
      })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

export function useExportProjectPayrollMutation() {
  return useMutation({
    mutationFn: (projectId: string) => projectsService.exportPayroll(projectId),
    onSuccess: () => toast.success("Payroll export downloaded"),
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

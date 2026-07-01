"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { queryKeys } from "@/lib/api/query-keys"
import { companiesService } from "@/lib/services/companies.service"
import { ApiError } from "@/lib/types"

export function useSaveInstanviIntegrationMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: companiesService.saveInstanviIntegration,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.companies.instanviIntegration(), data)
      toast.success("Instanvi keys saved")
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Failed to save Instanvi keys"
      )
    },
  })
}

export function useTestInstanviIntegrationMutation() {
  return useMutation({
    mutationFn: companiesService.testInstanviIntegration,
    onSuccess: () => {
      toast.success("Instanvi connection verified")
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Instanvi connection test failed"
      )
    },
  })
}

export function useRemoveInstanviIntegrationMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: companiesService.removeInstanviIntegration,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.companies.instanviIntegration(), data)
      toast.success("Instanvi keys removed")
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Failed to remove Instanvi keys"
      )
    },
  })
}

"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { queryKeys } from "@/lib/api/query-keys"
import { membersService } from "@/lib/services/members.service"
import type {
  MemberAddFormValues,
  MemberInviteFormValues,
} from "@/lib/validations/member.schema"
import type { Role } from "@/lib/types"
import { ApiError } from "@/lib/types"

function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Something went wrong. Please try again."
}

export function useInviteMemberMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: MemberInviteFormValues) => membersService.invite(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members.all })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

export function useAddMemberMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: MemberAddFormValues) => membersService.add(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members.all })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

export function useResendMemberInviteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => membersService.resendInvite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members.all })
      toast.success("Invitation resent")
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

export function useUpdateMemberRoleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) =>
      membersService.updateRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members.all })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

export function useRemoveMemberMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => membersService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members.all })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

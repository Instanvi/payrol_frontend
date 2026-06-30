import { api } from "@/lib/api/axios"
import { listParamsToSearchParams } from "@/lib/api/pagination"
import type { ListParams, PaginatedResponse } from "@/lib/api/types"
import type {
  MemberAddFormValues,
  MemberInviteFormValues,
} from "@/lib/validations/member.schema"
import type { CompanyMember, Role } from "@/lib/types"

export interface InvitePreview {
  email: string
  name: string
  role: Role
  companyName: string
  expiresAt: string
}

export const membersService = {
  list(params: ListParams = {}) {
    return api
      .get<PaginatedResponse<CompanyMember>>("/members", {
        params: listParamsToSearchParams(params),
      })
      .then((res) => res.data)
  },

  invite(data: MemberInviteFormValues) {
    return api
      .post<CompanyMember>("/members", data)
      .then((res) => res.data)
  },

  add(data: MemberAddFormValues) {
    return api
      .post<CompanyMember>("/members/add", data)
      .then((res) => res.data)
  },

  resendInvite(id: string) {
    return api
      .post<CompanyMember>(`/members/${id}/resend-invite`)
      .then((res) => res.data)
  },

  updateRole(id: string, role: Role) {
    return api
      .patch<CompanyMember>(`/members/${id}`, { role })
      .then((res) => res.data)
  },

  remove(id: string) {
    return api.delete(`/members/${id}`).then((res) => res.data)
  },

  getInvitePreview(token: string) {
    return api
      .get<InvitePreview>(`/auth/invites/${token}`)
      .then((res) => res.data)
  },
}

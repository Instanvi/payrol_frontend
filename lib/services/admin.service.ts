import { api } from "@/lib/api/axios"
import type {
  AdminCompanyDetail,
  Charge,
  ChargeBreakdown,
  CompanyStatus,
  CompanyWithOwners,
} from "@/lib/types"

export const adminService = {
  listCompanies(status?: CompanyStatus) {
    return api
      .get<{ data: CompanyWithOwners[] }>("/admin/companies", {
        params: status ? { status } : undefined,
      })
      .then((res) => res.data.data)
  },

  getCompanyDetail(companyId: string) {
    return api
      .get<AdminCompanyDetail>(`/admin/companies/${companyId}`)
      .then((res) => res.data)
  },

  approveCompany(
    companyId: string,
    chargeId?: string,
    forceApprove?: boolean
  ) {
    return api
      .post<AdminCompanyDetail>(`/admin/companies/${companyId}/approve`, {
        chargeId,
        forceApprove,
      })
      .then((res) => res.data)
  },

  rejectCompany(companyId: string, reason: string) {
    return api
      .post<AdminCompanyDetail>(`/admin/companies/${companyId}/reject`, {
        reason,
      })
      .then((res) => res.data)
  },

  assignCharge(companyId: string, chargeId: string) {
    return api
      .post(`/admin/companies/${companyId}/charge`, { chargeId })
      .then((res) => res.data)
  },

  previewCharge(companyId: string, amount: number) {
    return api
      .get<ChargeBreakdown>(`/admin/companies/${companyId}/charge-preview`, {
        params: { amount },
      })
      .then((res) => res.data)
  },

  listCharges() {
    return api
      .get<{ data: Charge[] }>("/admin/charges")
      .then((res) => res.data.data)
  },

  getStats() {
    return api
      .get<{ pendingReviews: number }>("/admin/stats")
      .then((res) => res.data)
  },

  createCharge(input: {
    name: string
    description?: string
    isDefault?: boolean
    fixedFee: number
    percentFee: number
    minFee?: number
    maxFee?: number
    currency?: string
  }) {
    return api.post<Charge>("/admin/charges", input).then((res) => res.data)
  },
}

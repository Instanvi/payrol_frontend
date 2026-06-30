import { api } from "@/lib/api/axios"
import { listParamsToSearchParams } from "@/lib/api/pagination"
import type { DashboardStats, ListParams, PaginatedResponse } from "@/lib/api/types"
import type { CsvEmployeeRow } from "@/lib/validations/employee.schema"
import type {
  BulkAccountValidationResult,
  Employee,
} from "@/lib/types"

export const employeesService = {
  list(params: ListParams = {}) {
    return api
      .get<PaginatedResponse<Employee>>("/employees", {
        params: listParamsToSearchParams(params),
      })
      .then((res) => res.data)
  },

  listActive() {
    return api
      .get<PaginatedResponse<Employee>>("/employees", {
        params: listParamsToSearchParams({
          page: 1,
          pageSize: 100,
          status: "active",
          sortBy: "name",
          sortOrder: "asc",
        }),
      })
      .then((res) => res.data.data)
  },

  get(id: string) {
    return api.get<Employee>(`/employees/${id}`).then((res) => res.data)
  },

  create(data: Omit<Employee, "id" | "createdAt">) {
    return api.post<Employee>("/employees", data).then((res) => res.data)
  },

  update(id: string, data: Partial<Omit<Employee, "id" | "createdAt">>) {
    return api.patch<Employee>(`/employees/${id}`, data).then((res) => res.data)
  },

  delete(id: string) {
    return api.delete(`/employees/${id}`).then((res) => res.data)
  },

  importCsv(rows: CsvEmployeeRow[]) {
    return api
      .post<{ imported: number; skipped: number }>("/employees/import", { rows })
      .then((res) => res.data)
  },

  validateAccount(id: string) {
    return api
      .post<Employee>(`/employees/${id}/validate-account`)
      .then((res) => res.data)
  },

  validateAccounts(employeeIds?: string[]) {
    return api
      .post<BulkAccountValidationResult>("/employees/validate-accounts", {
        employeeIds,
      })
      .then((res) => res.data)
  },
}

export function parseCsv(text: string): {
  headers: string[]
  rows: Record<string, string>[]
} {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length === 0) return { headers: [], rows: [] }

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())
  const rows = lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim())
    return headers.reduce<Record<string, string>>((acc, header, i) => {
      acc[header] = values[i] ?? ""
      return acc
    }, {})
  })

  return { headers, rows }
}

export const dashboardService = {
  getStats() {
    return api.get<DashboardStats>("/dashboard/stats").then((res) => res.data)
  },
}

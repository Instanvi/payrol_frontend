import type { ListParams } from "@/lib/api/types"

export const queryKeys = {
  dashboard: {
    stats: ["dashboard", "stats"] as const,
  },
  employees: {
    all: ["employees"] as const,
    lists: () => [...queryKeys.employees.all, "list"] as const,
    list: (params: ListParams) =>
      [...queryKeys.employees.lists(), params] as const,
    details: () => [...queryKeys.employees.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.employees.details(), id] as const,
    active: () => [...queryKeys.employees.all, "active"] as const,
  },
  projects: {
    all: ["projects"] as const,
    lists: () => [...queryKeys.projects.all, "list"] as const,
    list: (status?: string) =>
      [...queryKeys.projects.lists(), status ?? "all"] as const,
    details: () => [...queryKeys.projects.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.projects.details(), id] as const,
    employees: (id: string) =>
      [...queryKeys.projects.all, "employees", id] as const,
  },
  payments: {
    all: ["payments"] as const,
    lists: () => [...queryKeys.payments.all, "list"] as const,
    list: (params: ListParams) =>
      [...queryKeys.payments.lists(), params] as const,
    details: () => [...queryKeys.payments.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.payments.details(), id] as const,
    transactions: (id: string) =>
      [...queryKeys.payments.all, "transactions", id] as const,
    mobileValidation: (id: string) =>
      [...queryKeys.payments.all, "mobile-validation", id] as const,
  },
  transactions: {
    all: ["transactions"] as const,
    lists: () => [...queryKeys.transactions.all, "list"] as const,
    list: (params: ListParams) =>
      [...queryKeys.transactions.lists(), params] as const,
  },
  paymentLogs: {
    all: ["payment-logs"] as const,
    lists: () => [...queryKeys.paymentLogs.all, "list"] as const,
    list: (params: ListParams) =>
      [...queryKeys.paymentLogs.lists(), params] as const,
  },
  members: {
    all: ["members"] as const,
    lists: () => [...queryKeys.members.all, "list"] as const,
    list: (params: ListParams) =>
      [...queryKeys.members.lists(), params] as const,
  },
}

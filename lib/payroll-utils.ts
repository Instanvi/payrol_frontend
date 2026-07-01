import type { PaymentStatus, TransactionStatus } from "@/lib/types"
import { format } from "date-fns"

export function generatePayRunReference(date = new Date()) {
  const stamp = format(date, "yyyyMMdd")
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `PAYROLL-${stamp}-${suffix}`
}

export function mapPayRunStatusToTransactionStatus(
  status: PaymentStatus
): TransactionStatus {
  switch (status) {
    case "draft":
      return "pending"
    case "pending":
      return "processing"
    case "completed":
      return "completed"
    case "failed":
      return "failed"
  }
}

/** Split a total payroll amount evenly across employees (last gets remainder). */
export function splitPayrollAmount(total: number, count: number): number[] {
  if (count <= 0) return []
  const base = Math.floor((total / count) * 100) / 100
  const amounts = Array.from({ length: count }, () => base)
  const distributed = base * count
  amounts[count - 1] = Math.round((total - distributed + base) * 100) / 100
  return amounts
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100
}

export interface PayrollLinePreview {
  grossAmount: number
  deductions: number
  netPay: number
}

export function computePayrollFromNetPay(
  netPay: number,
  taxRatePercent = 0
): PayrollLinePreview {
  if (taxRatePercent <= 0) {
    return {
      grossAmount: roundMoney(netPay),
      deductions: 0,
      netPay: roundMoney(netPay),
    }
  }

  const rate = taxRatePercent / 100
  if (rate >= 1) {
    return {
      grossAmount: roundMoney(netPay),
      deductions: 0,
      netPay: roundMoney(netPay),
    }
  }

  const gross = roundMoney(netPay / (1 - rate))
  const deductions = roundMoney(gross - netPay)

  return { grossAmount: gross, deductions, netPay: roundMoney(netPay) }
}

export function payrollLinesFromEmployees(
  employees: { baseSalary?: number | null }[],
  totalNetAmount: number,
  taxRatePercent = 0
): PayrollLinePreview[] {
  const salaries = employees.map((e) => e.baseSalary ?? 0)
  const hasSalaries = salaries.some((s) => s > 0)

  const netPerEmployee = hasSalaries
    ? salaries.map((s) => (s > 0 ? s : 0))
    : splitPayrollAmount(totalNetAmount, employees.length)

  return netPerEmployee.map((net) =>
    computePayrollFromNetPay(net, taxRatePercent)
  )
}

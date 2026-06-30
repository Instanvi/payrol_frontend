import type { PaymentStatus, TransactionStatus } from "@/lib/types"

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

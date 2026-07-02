import type { ListParams } from "@/lib/api/types"
import { buildCsv, type CsvColumn } from "@/lib/export-csv"
import { formatDisplayDateTime } from "@/lib/date-utils"
import type { PayrollTransaction } from "@/lib/types"

function accountStatusLabel(txn: PayrollTransaction) {
  if (txn.mobileAccountValid === true) return "valid"
  if (txn.mobileAccountValid === false) return "invalid"
  return "unchecked"
}

export const TRANSACTION_EXPORT_COLUMNS: CsvColumn<PayrollTransaction>[] = [
  {
    header: "Created",
    value: (row) => formatDisplayDateTime(row.createdAt),
  },
  { header: "Reference", value: (row) => row.reference },
  { header: "Pay run", value: (row) => row.payRunReference },
  { header: "Pay period", value: (row) => row.payPeriod },
  { header: "Employee", value: (row) => row.employeeName },
  { header: "Email", value: (row) => row.employeeEmail },
  { header: "Phone", value: (row) => row.employeePhone },
  { header: "MoMo account name", value: (row) => row.mobileAccountHolderName },
  { header: "Carrier", value: (row) => row.mobileCarrier },
  { header: "Account status", value: accountStatusLabel },
  { header: "Gross", value: (row) => row.grossAmount },
  { header: "Deductions", value: (row) => row.deductions },
  { header: "Net pay", value: (row) => row.amount },
  { header: "Currency", value: (row) => row.currency },
  { header: "Status", value: (row) => row.status },
  { header: "Failure reason", value: (row) => row.failureReason },
  {
    header: "Paid at",
    value: (row) => (row.paidAt ? formatDisplayDateTime(row.paidAt) : ""),
  },
  {
    header: "Updated",
    value: (row) => formatDisplayDateTime(row.updatedAt),
  },
  { header: "Provider", value: (row) => row.paymentProvider },
  { header: "External ID", value: (row) => row.paymentExternalId },
  {
    header: "Financial transaction ID",
    value: (row) => row.paymentFinancialTransactionId,
  },
]

export function buildTransactionsCsv(rows: PayrollTransaction[]) {
  return buildCsv(rows, TRANSACTION_EXPORT_COLUMNS)
}

export function transactionsExportFilename(params: ListParams) {
  const date = new Date().toISOString().slice(0, 10)
  const parts = ["transactions", date]
  if (params.status) parts.push(params.status)
  if (params.projectId) parts.push("project")
  return `${parts.join("-")}.csv`
}

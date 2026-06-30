"use client"

import type { ColumnDef } from "@tanstack/react-table"

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { DataTable } from "@/components/data-table/data-table"
import { PayRunMobileValidationPanel } from "@/components/pay-run-mobile-validation-panel"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  usePaymentQuery,
  usePayRunTransactionsQuery,
} from "@/hooks/queries/use-payments-query"
import { formatDisplayDate } from "@/lib/date-utils"
import type { PaymentStatus, PayrollTransaction, TransactionStatus } from "@/lib/types"

const PAY_RUN_STATUS_VARIANT: Record<
  PaymentStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  completed: "default",
  pending: "secondary",
  draft: "outline",
  failed: "destructive",
}

const TXN_STATUS_VARIANT: Record<
  TransactionStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  completed: "default",
  processing: "secondary",
  pending: "outline",
  failed: "destructive",
}

export function PayRunDetailContent({ payRunId }: { payRunId: string }) {
  const { data: payRun, isLoading: payRunLoading } = usePaymentQuery(payRunId)
  const { data: transactions = [], isLoading: txnsLoading } =
    usePayRunTransactionsQuery(payRunId)

  const columns: ColumnDef<PayrollTransaction>[] = [
    {
      accessorKey: "reference",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Transaction ref" />
      ),
    },
    {
      accessorKey: "employeeName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Employee" />
      ),
    },
    {
      accessorKey: "employeeEmail",
      header: "Email",
    },
    {
      accessorKey: "grossAmount",
      header: "Gross",
      cell: ({ row }) =>
        `${row.original.currency} ${row.original.grossAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    },
    {
      accessorKey: "deductions",
      header: "Deductions",
      cell: ({ row }) =>
        `${row.original.currency} ${row.original.deductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    },
    {
      accessorKey: "amount",
      header: "Net pay",
      cell: ({ row }) =>
        `${row.original.currency} ${row.original.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    },
    {
      accessorKey: "employeePhone",
      header: "Mobile number",
      cell: ({ row }) => row.original.employeePhone ?? "—",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={TXN_STATUS_VARIANT[row.original.status]}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "failureReason",
      header: "Failure",
      cell: ({ row }) => row.original.failureReason ?? "—",
    },
    {
      accessorKey: "paidAt",
      header: "Paid at",
      cell: ({ row }) => formatDisplayDate(row.original.paidAt),
    },
  ]

  if (payRunLoading) {
    return <Skeleton className="h-32 w-full" />
  }

  if (!payRun) {
    return (
      <p className="text-sm text-muted-foreground">Pay run not found.</p>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 rounded-xl bg-card p-4 text-sm sm:grid-cols-2">
        <div>
          <p className="text-muted-foreground">Reference</p>
          <p className="font-medium">{payRun.reference}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Pay period</p>
          <p className="font-medium">{payRun.payPeriod}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Total payroll</p>
          <p className="font-medium">
            {payRun.currency}{" "}
            {payRun.amount.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Status</p>
          <Badge variant={PAY_RUN_STATUS_VARIANT[payRun.status]}>
            {payRun.status}
          </Badge>
        </div>
        <div>
          <p className="text-muted-foreground">Employees</p>
          <p className="font-medium">{payRun.employeeCount}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Pay date</p>
          <p className="font-medium">{formatDisplayDate(payRun.scheduledAt)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Created</p>
          <p className="font-medium">{formatDisplayDate(payRun.createdAt)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Transactions</p>
          <p className="font-medium">{transactions.length}</p>
        </div>
      </div>

      <PayRunMobileValidationPanel
        payRunId={payRunId}
        payRunStatus={payRun.status}
      />

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Payment transactions</h3>
        <p className="text-xs text-muted-foreground">
          One mobile money disbursement per employee in this pay run
        </p>
        {txnsLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <DataTable
            columns={columns}
            data={transactions}
            hidePagination={transactions.length <= 10}
            emptyMessage="No transactions for this pay run."
          />
        )}
      </div>
    </div>
  )
}

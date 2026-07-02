"use client"

import { EmployeeMobileAccountBadge } from "@/components/employee-mobile-account-badge"
import { Badge } from "@/components/ui/badge"
import { FullPageModal } from "@/components/ui/full-page-modal"
import { formatDisplayDateTime } from "@/lib/date-utils"
import type { PayrollTransaction, TransactionStatus } from "@/lib/types"

const TXN_STATUS_VARIANT: Record<
  TransactionStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  completed: "default",
  processing: "secondary",
  pending: "outline",
  failed: "destructive",
}

function DetailField({
  label,
  value,
  mono = false,
}: {
  label: string
  value?: string | null
  mono?: boolean
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`text-sm font-medium ${mono ? "break-all font-mono text-xs" : ""}`}
      >
        {value?.trim() ? value : "—"}
      </p>
    </div>
  )
}

export function TransactionDetailModal({
  transaction,
  open,
  onOpenChange,
  onViewPayRun,
}: {
  transaction: PayrollTransaction | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onViewPayRun?: (payRunId: string) => void
}) {
  if (!transaction) return null

  return (
    <FullPageModal
      open={open}
      onOpenChange={onOpenChange}
      title={transaction.reference}
      contentClassName="max-w-3xl"
    >
      <div className="space-y-6 text-sm">
        <p className="text-muted-foreground">
          {transaction.employeeName} · {transaction.currency}{" "}
          {transaction.amount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={TXN_STATUS_VARIANT[transaction.status]}>
            {transaction.status}
          </Badge>
          {transaction.failureReason && (
            <span className="text-destructive">{transaction.failureReason}</span>
          )}
        </div>

        <section className="space-y-3">
          <h3 className="font-medium">Timeline</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <DetailField
              label="Created"
              value={formatDisplayDateTime(transaction.createdAt)}
            />
            <DetailField
              label="Paid"
              value={
                transaction.paidAt
                  ? formatDisplayDateTime(transaction.paidAt)
                  : "—"
              }
            />
            <DetailField
              label="Updated"
              value={formatDisplayDateTime(transaction.updatedAt)}
            />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="font-medium">Employee & payee</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailField label="Employee" value={transaction.employeeName} />
            <DetailField label="Email" value={transaction.employeeEmail} />
            <DetailField label="Phone" value={transaction.employeePhone} mono />
            <DetailField
              label="MoMo account name"
              value={transaction.mobileAccountHolderName}
            />
            <div className="sm:col-span-2">
              <p className="mb-2 text-xs text-muted-foreground">Account status</p>
              <EmployeeMobileAccountBadge
                employee={{
                  mobileAccountValid: transaction.mobileAccountValid,
                  mobileAccountValidationError:
                    transaction.mobileAccountValidationError ?? undefined,
                  mobileAccountHolderName:
                    transaction.mobileAccountHolderName ?? undefined,
                  mobileCarrier: transaction.mobileCarrier,
                  accountChecked: transaction.mobileAccountValid != null,
                }}
                showCarrier
              />
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="font-medium">Amounts</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <DetailField
              label="Gross"
              value={`${transaction.currency} ${transaction.grossAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            />
            <DetailField
              label="Deductions"
              value={`${transaction.currency} ${transaction.deductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            />
            <DetailField
              label="Net pay"
              value={`${transaction.currency} ${transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="font-medium">Pay run</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailField label="Reference" value={transaction.payRunReference} />
            <DetailField label="Pay period" value={transaction.payPeriod} />
            <DetailField label="Transaction ref" value={transaction.reference} mono />
            {onViewPayRun && (
              <div className="flex items-end">
                <button
                  type="button"
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                  onClick={() => onViewPayRun(transaction.payRunId)}
                >
                  Open pay run
                </button>
              </div>
            )}
          </div>
        </section>

        {(transaction.paymentProvider ||
          transaction.paymentExternalId ||
          transaction.paymentFinancialTransactionId) && (
          <section className="space-y-3">
            <h3 className="font-medium">Provider payment</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailField label="Provider" value={transaction.paymentProvider} />
              <DetailField
                label="Provider status"
                value={transaction.paymentProviderStatus}
              />
              <DetailField
                label="External ID"
                value={transaction.paymentExternalId}
                mono
              />
              <DetailField
                label="Financial transaction ID"
                value={transaction.paymentFinancialTransactionId}
                mono
              />
            </div>
          </section>
        )}
      </div>
    </FullPageModal>
  )
}

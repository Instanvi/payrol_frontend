"use client"

import {
  EmployeeMobileAccountBadge,
  MobileCarrierBadge,
} from "@/components/employee-mobile-account-badge"
import type { PayrollTransaction } from "@/lib/types"

export function TransactionMobileCell({
  transaction,
}: {
  transaction: Pick<
    PayrollTransaction,
    | "employeePhone"
    | "mobileCarrier"
    | "mobileAccountValid"
    | "mobileAccountHolderName"
    | "mobileAccountValidationError"
  >
}) {
  if (!transaction.employeePhone) {
    return <span className="text-muted-foreground">—</span>
  }

  return (
    <div className="min-w-[10rem] space-y-1">
      <p className="font-mono text-xs whitespace-nowrap">
        {transaction.employeePhone}
      </p>
      {transaction.mobileAccountHolderName && (
        <p className="text-xs text-muted-foreground leading-snug">
          MoMo: {transaction.mobileAccountHolderName}
        </p>
      )}
      <EmployeeMobileAccountBadge
        employee={{
          mobileAccountValid: transaction.mobileAccountValid,
          mobileAccountValidationError:
            transaction.mobileAccountValidationError ?? undefined,
          mobileCarrier: transaction.mobileCarrier,
          accountChecked: transaction.mobileAccountValid != null,
        }}
        showCarrier
        showHolderName={false}
      />
    </div>
  )
}

export function TransactionCarrierOnly({
  carrier,
}: {
  carrier?: PayrollTransaction["mobileCarrier"]
}) {
  return <MobileCarrierBadge carrier={carrier} />
}

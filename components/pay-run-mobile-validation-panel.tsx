"use client"

import * as React from "react"
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table"
import { RefreshCwIcon, SmartphoneIcon } from "lucide-react"
import { toast } from "sonner"

import { DataTable } from "@/components/data-table/data-table"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import {
  EmployeeMobileAccountBadge,
  MobileCarrierBadge,
} from "@/components/employee-mobile-account-badge"
import { PermissionGate } from "@/components/permission-gate"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FullPageModal } from "@/components/ui/full-page-modal"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useValidateEmployeeAccountMutation,
  useValidateEmployeeAccountsMutation,
} from "@/hooks/mutations/use-employee-mutations"
import { useBulkDisburseMutation } from "@/hooks/mutations/use-payment-mutations"
import { usePayRunMobileValidationQuery } from "@/hooks/queries/use-payments-query"
import type { MobilePayRunLine } from "@/lib/types"

interface PayRunMobileValidationPanelProps {
  payRunId: string
  payRunStatus: string
}

export function PayRunMobileValidationPanel({
  payRunId,
  payRunStatus,
}: PayRunMobileValidationPanelProps) {
  const { data, isLoading, isFetching, refetch } =
    usePayRunMobileValidationQuery(payRunId)
  const validateOne = useValidateEmployeeAccountMutation()
  const validateMany = useValidateEmployeeAccountsMutation()
  const bulkDisburse = useBulkDisburseMutation()
  const [disburseOpen, setDisburseOpen] = React.useState(false)
  const [validatingId, setValidatingId] = React.useState<string | null>(null)
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})

  const eligibleLines = data?.lines.filter((line) => line.mobileEligible) ?? []
  const selectedTransactionIds = React.useMemo(() => {
    if (!data) return []
    return data.lines
      .filter((line) => rowSelection[line.transactionId])
      .map((line) => line.transactionId)
  }, [data, rowSelection])

  const disburseTargetIds =
    selectedTransactionIds.length > 0
      ? selectedTransactionIds
      : eligibleLines.map((line) => line.transactionId)

  const disburseTargetAmount = React.useMemo(() => {
    if (!data) return 0
    const ids = new Set(disburseTargetIds)
    return data.lines
      .filter((line) => ids.has(line.transactionId))
      .reduce((sum, line) => sum + line.amount, 0)
  }, [data, disburseTargetIds])

  const disburseTargetCount = disburseTargetIds.length

  const uncheckedIds =
    data?.lines
      .filter((line) => !line.accountChecked)
      .map((line) => line.employeeId) ?? []

  async function handleValidateOne(employeeId: string) {
    setValidatingId(employeeId)
    try {
      await validateOne.mutateAsync(employeeId)
      await refetch()
    } finally {
      setValidatingId(null)
    }
  }

  async function handleValidateUnchecked() {
    if (uncheckedIds.length === 0) {
      toast.message("All employees in this pay run are already checked")
      return
    }
    await validateMany.mutateAsync(uncheckedIds)
    await refetch()
  }

  async function handleBulkDisburse() {
    const idempotencyKey = crypto.randomUUID()
    await bulkDisburse.mutateAsync({
      payRunId,
      idempotencyKey,
      transactionIds: disburseTargetIds,
    })
    setDisburseOpen(false)
    setRowSelection({})
    await refetch()
  }

  const columns: ColumnDef<MobilePayRunLine>[] = [
    {
      accessorKey: "employeeName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Employee" />
      ),
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => row.original.phone ?? "—",
    },
    {
      accessorKey: "carrier",
      header: "Carrier",
      cell: ({ row }) => <MobileCarrierBadge carrier={row.original.carrier} />,
    },
    {
      id: "account",
      header: "Account",
      cell: ({ row }) => (
        <EmployeeMobileAccountBadge
          employee={{
            accountChecked: row.original.accountChecked,
            mobileAccountValid: row.original.mobileAccountValid,
            mobileAccountValidationError: row.original.error,
            mobileCarrier: row.original.carrier,
          }}
        />
      ),
    },
    {
      accessorKey: "mobileEligible",
      header: "Mobile",
      cell: ({ row }) =>
        row.original.mobileEligible ? (
          <Badge variant="default">Eligible</Badge>
        ) : (
          <Badge variant="outline">No</Badge>
        ),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) =>
        `${row.original.currency} ${row.original.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    },
    {
      id: "actions",
      cell: ({ row }) =>
        !row.original.accountChecked ? (
          <PermissionGate permission="employees:write">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={
                validateOne.isPending && validatingId === row.original.employeeId
              }
              onClick={() => handleValidateOne(row.original.employeeId)}
            >
              Validate
            </Button>
          </PermissionGate>
        ) : null,
    },
  ]

  if (isLoading) {
    return <Skeleton className="h-40 w-full" />
  }

  if (!data) {
    return (
      <p className="text-sm text-muted-foreground">
        Mobile validation is unavailable for this pay run.
      </p>
    )
  }

  const canDisburse =
    payRunStatus !== "completed" &&
    disburseTargetCount > 0 &&
    data.summary.pending > 0

  return (
    <div className="space-y-4 rounded-xl bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <SmartphoneIcon className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Mobile money validation</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            MTN and Orange mobile money eligibility per employee before bulk
            disbursement
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isFetching}
            onClick={() => refetch()}
          >
            <RefreshCwIcon className={isFetching ? "animate-spin" : ""} />
            Refresh
          </Button>
          <PermissionGate permission="employees:write">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={validateMany.isPending || uncheckedIds.length === 0}
              onClick={handleValidateUnchecked}
            >
              {validateMany.isPending
                ? "Validating..."
                : `Validate unchecked (${uncheckedIds.length})`}
            </Button>
          </PermissionGate>
          <PermissionGate permission="payments:write">
            <Button
              type="button"
              size="sm"
              disabled={!canDisburse || bulkDisburse.isPending}
              onClick={() => setDisburseOpen(true)}
            >
              Disburse
              {selectedTransactionIds.length > 0
                ? ` selected (${selectedTransactionIds.length})`
                : ` all eligible (${eligibleLines.length})`}
            </Button>
          </PermissionGate>
        </div>
      </div>

      <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <SummaryStat label="Total" value={data.summary.total} />
        <SummaryStat label="Unchecked" value={data.summary.unchecked} />
        <SummaryStat label="Valid accounts" value={data.summary.accountValid} />
        <SummaryStat
          label="Mobile eligible"
          value={data.summary.mobileEligible}
        />
        <SummaryStat label="MTN" value={data.summary.mtn} />
        <SummaryStat label="Orange" value={data.summary.orange} />
        <SummaryStat label="Invalid" value={data.summary.invalid} />
        <SummaryStat
          label="Mobile total"
          value={`${data.lines[0]?.currency ?? ""} ${data.summary.totalMobileAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`.trim()}
        />
      </div>

      <DataTable
        columns={columns}
        data={data.lines.map((line) => ({ ...line, id: line.transactionId }))}
        enableRowSelection
        onRowSelectionChange={setRowSelection}
        hidePagination={data.lines.length <= 10}
        emptyMessage="No payroll lines to validate."
      />

      <FullPageModal
        open={disburseOpen}
        onOpenChange={setDisburseOpen}
        title="Disburse mobile money?"
        contentClassName="max-w-lg"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              disabled={bulkDisburse.isPending}
              onClick={() => setDisburseOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={bulkDisburse.isPending}
              onClick={() => void handleBulkDisburse()}
            >
              {bulkDisburse.isPending ? "Queuing..." : "Confirm disbursement"}
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            This will queue mobile money payments for{" "}
            <strong>{disburseTargetCount}</strong> employee(s) totalling{" "}
            <strong>
              {data.lines[0]?.currency}{" "}
              {disburseTargetAmount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </strong>
            .
          </p>
          {selectedTransactionIds.length > 0 ? (
            <p>Only the employees you selected will be paid.</p>
          ) : (
            <p>All mobile-money-eligible employees will be paid.</p>
          )}
        </div>
      </FullPageModal>
    </div>
  )
}

function SummaryStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-card px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  )
}

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
import { InstanviConnectionGate } from "@/components/instanvi-connection-gate"
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

const TXN_STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  completed: "default",
  processing: "secondary",
  pending: "outline",
  failed: "destructive",
}

function PayStatusBadge({ line }: { line: MobilePayRunLine }) {
  if (line.mobileEligible) {
    return (
      <Badge variant="default" className="font-normal">
        {line.transactionStatus === "failed" ? "Retry" : "Ready"}
      </Badge>
    )
  }

  if (line.transactionStatus === "processing") {
    return (
      <Badge variant="secondary" className="font-normal">
        Processing
      </Badge>
    )
  }

  if (line.transactionStatus === "completed") {
    return (
      <Badge variant="default" className="font-normal">
        Paid
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="font-normal">
      No
    </Badge>
  )
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

  const selectedEligibleIds = React.useMemo(() => {
    if (!data) return []
    return data.lines
      .filter(
        (line) => rowSelection[line.transactionId] && line.mobileEligible
      )
      .map((line) => line.transactionId)
  }, [data, rowSelection])

  const disburseTargetIds =
    selectedEligibleIds.length > 0
      ? selectedEligibleIds
      : eligibleLines.map((line) => line.transactionId)

  const disburseTargetAmount = React.useMemo(() => {
    if (!data) return 0
    const ids = new Set(disburseTargetIds)
    return data.lines
      .filter((line) => ids.has(line.transactionId))
      .reduce((sum, line) => sum + line.amount, 0)
  }, [data, disburseTargetIds])

  const disburseTargetFees = React.useMemo(() => {
    if (!data) return 0
    const ids = new Set(disburseTargetIds)
    return data.lines
      .filter((line) => ids.has(line.transactionId))
      .reduce((sum, line) => sum + (line.platformFee ?? 0), 0)
  }, [data, disburseTargetIds])

  const disburseTargetTotal = disburseTargetAmount + disburseTargetFees

  const disburseTargetCount = disburseTargetIds.length
  const retryCount = eligibleLines.filter(
    (line) => line.transactionStatus === "failed"
  ).length

  const uncheckedIds =
    data?.lines
      .filter((line) => !line.accountChecked)
      .map((line) => line.employeeId) ?? []

  React.useEffect(() => {
    if (!data) return
    setRowSelection((current) => {
      const next: RowSelectionState = {}
      for (const [id, selected] of Object.entries(current)) {
        const line = data.lines.find((row) => row.transactionId === id)
        if (selected && line?.mobileEligible) {
          next[id] = true
        }
      }
      return next
    })
  }, [data])

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
    if (disburseTargetIds.length === 0) {
      toast.error("No eligible employees selected for disbursement")
      return
    }

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
      accessorKey: "transactionStatus",
      header: "Pay status",
      cell: ({ row }) => (
        <Badge variant={TXN_STATUS_VARIANT[row.original.transactionStatus] ?? "outline"}>
          {row.original.transactionStatus}
        </Badge>
      ),
    },
    {
      accessorKey: "mobileEligible",
      header: "Mobile",
      cell: ({ row }) => <PayStatusBadge line={row.original} />,
    },
    {
      accessorKey: "amount",
      header: "Net pay",
      cell: ({ row }) =>
        `${row.original.currency} ${row.original.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    },
    {
      accessorKey: "platformFee",
      header: "Fee",
      cell: ({ row }) =>
        row.original.platformFee != null
          ? `${row.original.currency} ${row.original.platformFee.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
          : "—",
    },
    {
      id: "totalCharge",
      header: "Total",
      cell: ({ row }) =>
        row.original.totalCharge != null
          ? `${row.original.currency} ${row.original.totalCharge.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
          : "—",
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
    payRunStatus !== "completed" && disburseTargetCount > 0

  const disburseButtonLabel =
    selectedEligibleIds.length > 0
      ? retryCount > 0 && selectedEligibleIds.length === retryCount
        ? `Retry selected (${selectedEligibleIds.length})`
        : `Disburse selected (${selectedEligibleIds.length})`
      : retryCount > 0 && retryCount === eligibleLines.length
        ? `Retry failed (${retryCount})`
        : `Disburse all eligible (${eligibleLines.length})`

  return (
    <div className="space-y-4 rounded-xl bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <SmartphoneIcon className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Mobile money validation</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Select pending or failed lines to disburse via Instanvi. Employees
            receive net pay; platform fees are added on top.
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
            <InstanviConnectionGate>
              <Button
                type="button"
                size="sm"
                disabled={!canDisburse || bulkDisburse.isPending}
                onClick={() => setDisburseOpen(true)}
              >
                {disburseButtonLabel}
              </Button>
            </InstanviConnectionGate>
          </PermissionGate>
        </div>
      </div>

      <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <SummaryStat label="Total" value={data.summary.total} />
        <SummaryStat label="Ready" value={data.summary.mobileEligible} />
        <SummaryStat label="Processing" value={data.summary.processing} />
        <SummaryStat label="Failed" value={data.summary.failed} />
        <SummaryStat label="Paid" value={data.summary.completed} />
        <SummaryStat label="MTN" value={data.summary.mtn} />
        <SummaryStat label="Orange" value={data.summary.orange} />
        <SummaryStat
          label="Ready total (net)"
          value={`${data.lines[0]?.currency ?? ""} ${data.summary.totalMobileAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`.trim()}
        />
        <SummaryStat
          label="Platform fees"
          value={`${data.lines[0]?.currency ?? ""} ${data.summary.totalPlatformFees.toLocaleString(undefined, { minimumFractionDigits: 2 })}`.trim()}
        />
        <SummaryStat
          label="Total with fees"
          value={`${data.lines[0]?.currency ?? ""} ${data.summary.totalWithFees.toLocaleString(undefined, { minimumFractionDigits: 2 })}`.trim()}
        />
      </div>

      <DataTable
        columns={columns}
        data={data.lines.map((line) => ({ ...line, id: line.transactionId }))}
        enableRowSelection
        canSelectRow={(line) => line.mobileEligible}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        hidePagination={data.lines.length <= 10}
        emptyMessage="No payroll lines to validate."
      />

      <FullPageModal
        open={disburseOpen}
        onOpenChange={setDisburseOpen}
        title={
          retryCount > 0 && disburseTargetCount === retryCount
            ? "Retry failed disbursements?"
            : "Disburse mobile money?"
        }
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
              {bulkDisburse.isPending ? "Queuing..." : "Confirm"}
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            This will send mobile money to{" "}
            <strong>{disburseTargetCount}</strong> employee(s) via Instanvi.
          </p>
          <div className="rounded-xl bg-muted/40 p-3 text-foreground">
            <div className="flex justify-between gap-4">
              <span>Net pay to employees</span>
              <strong>
                {data.lines[0]?.currency}{" "}
                {disburseTargetAmount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </strong>
            </div>
            <div className="mt-2 flex justify-between gap-4">
              <span>Platform fees (on top)</span>
              <strong>
                {data.lines[0]?.currency}{" "}
                {disburseTargetFees.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </strong>
            </div>
            <div className="mt-2 flex justify-between gap-4 border-t border-border pt-2">
              <span>Total</span>
              <strong>
                {data.lines[0]?.currency}{" "}
                {disburseTargetTotal.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </strong>
            </div>
          </div>
          <p className="text-xs">
            Payment is funded from your Instanvi account. Each employee receives
            only their net pay amount.
          </p>
          {selectedEligibleIds.length > 0 ? (
            <p>Only the eligible employees you selected will be paid.</p>
          ) : (
            <p>All ready employees (pending or failed) will be paid.</p>
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

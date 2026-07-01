"use client"

import * as React from "react"
import { Suspense } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"

import { CompanyApprovalGate } from "@/components/company-approval-gate"
import { InstanviConnectionGate } from "@/components/instanvi-connection-gate"
import { DataTableRowActions } from "@/components/data-table/data-table-row-actions"
import { ServerColumnHeader } from "@/components/data-table/server-column-header"
import { ServerDataTable } from "@/components/data-table/server-data-table"
import { PaymentForm } from "@/components/forms/payment-form"
import { PageHeader } from "@/components/page-header"
import { ProjectFilter } from "@/components/project-filter"
import { PayRunDetailContent } from "@/components/pay-run-detail-content"
import { PermissionGate } from "@/components/permission-gate"
import { Button } from "@/components/ui/button"
import {
  ConfirmFullPageModal,
  FullPageModal,
} from "@/components/ui/full-page-modal"
import { useUpdatePaymentStatusMutation } from "@/hooks/mutations/use-payment-mutations"
import { useModalParam } from "@/hooks/use-modal-param"
import { useListParams } from "@/hooks/use-list-params"
import { usePaymentsQuery } from "@/hooks/queries/use-payments-query"
import { formatDisplayDate } from "@/lib/date-utils"
import type { PaymentBatch } from "@/lib/types"
import { PlusIcon } from "lucide-react"

function formatPayRunStatus(status: PaymentBatch["status"]) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function PaymentsPageContent() {
  const modal = useModalParam()
  const { params, setParams } = useListParams()
  const { data: payRunsData, isLoading, isFetching } = usePaymentsQuery(params)
  const cancelMutation = useUpdatePaymentStatusMutation()
  const [cancelId, setCancelId] = React.useState<string | null>(null)

  const payments = payRunsData?.data ?? []
  const payRunMeta = payRunsData?.meta
  const viewPayRunId = modal.isOpen("view") ? modal.id : null

  const payRunColumns: ColumnDef<PaymentBatch>[] = React.useMemo(
    () => [
      {
        accessorKey: "reference",
        id: "reference",
        header: ({ column }) => (
          <ServerColumnHeader
            column={column}
            title="Reference"
            sortBy={params.sortBy}
            sortOrder={params.sortOrder}
            onSortChange={(sortBy, sortOrder) =>
              setParams({ sortBy, sortOrder, page: 1 })
            }
          />
        ),
      },
      {
        accessorKey: "payPeriod",
        id: "payPeriod",
        header: ({ column }) => (
          <ServerColumnHeader
            column={column}
            title="Pay period"
            sortBy={params.sortBy}
            sortOrder={params.sortOrder}
            onSortChange={(sortBy, sortOrder) =>
              setParams({ sortBy, sortOrder, page: 1 })
            }
          />
        ),
      },
      {
        accessorKey: "amount",
        id: "amount",
        header: ({ column }) => (
          <ServerColumnHeader
            column={column}
            title="Total payroll"
            sortBy={params.sortBy}
            sortOrder={params.sortOrder}
            onSortChange={(sortBy, sortOrder) =>
              setParams({ sortBy, sortOrder, page: 1 })
            }
          />
        ),
        cell: ({ row }) =>
          `${row.original.currency} ${row.original.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      },
      {
        accessorKey: "employeeCount",
        header: "Employees",
        enableSorting: false,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <span className="text-sm font-medium">
            {formatPayRunStatus(row.original.status)}
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "scheduledAt",
        header: "Pay date",
        cell: ({ row }) => formatDisplayDate(row.original.scheduledAt),
        enableSorting: false,
      },
      {
        accessorKey: "createdAt",
        id: "createdAt",
        header: ({ column }) => (
          <ServerColumnHeader
            column={column}
            title="Created"
            sortBy={params.sortBy}
            sortOrder={params.sortOrder}
            onSortChange={(sortBy, sortOrder) =>
              setParams({ sortBy, sortOrder, page: 1 })
            }
          />
        ),
        cell: ({ row }) => formatDisplayDate(row.original.createdAt),
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <DataTableRowActions
            actions={[
              {
                label: "View transactions",
                onClick: () => modal.open("view", row.original.id),
              },
              {
                label: "Cancel draft",
                destructive: true,
                disabled: row.original.status !== "draft",
                onClick: () => setCancelId(row.original.id),
              },
            ]}
          />
        ),
      },
    ],
    [modal, params.sortBy, params.sortOrder, setParams]
  )

  const cancelTarget = payments.find((p) => p.id === cancelId)

  async function handleCancelDraft() {
    if (!cancelId) return
    await cancelMutation.mutateAsync({ id: cancelId, status: "failed" })
    toast.success("Pay run cancelled")
    setCancelId(null)
  }

  const renderMobileRow = React.useCallback(
    (payRun: PaymentBatch) => (
      <div className="space-y-3 rounded-xl bg-card p-4 md:hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-medium">{payRun.reference}</p>
            <p className="text-sm text-muted-foreground">{payRun.payPeriod}</p>
          </div>
          <span className="shrink-0 text-sm font-medium">
            {formatPayRunStatus(payRun.status)}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">Total</p>
            <p className="font-medium">
              {payRun.currency}{" "}
              {payRun.amount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Employees</p>
            <p className="font-medium">{payRun.employeeCount}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => modal.open("view", payRun.id)}
          >
            View
          </Button>
          {payRun.status === "draft" && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="flex-1 text-destructive"
              onClick={() => setCancelId(payRun.id)}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    ),
    [modal]
  )

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Pay runs"
        description="Create and manage payroll batches for your team"
      />

      <ServerDataTable
        columns={payRunColumns}
        data={payments}
        meta={payRunMeta}
        params={params}
        onParamsChange={setParams}
        isLoading={isLoading}
        isFetching={isFetching}
        searchPlaceholder="Search by reference or pay period..."
        toolbarChildren={
          <ProjectFilter
            value={params.projectId}
            onChange={(projectId) => setParams({ projectId, page: 1 })}
          />
        }
        toolbarActions={
          <PermissionGate permission="payments:write">
            <CompanyApprovalGate action="run payroll">
              <InstanviConnectionGate>
                <Button size="sm" onClick={() => modal.open("create")}>
                  <PlusIcon />
                  Run payroll
                </Button>
              </InstanviConnectionGate>
            </CompanyApprovalGate>
          </PermissionGate>
        }
        renderMobileRow={renderMobileRow}
        filters={[
          {
            key: "status",
            title: "Status",
            options: [
              { label: "Draft", value: "draft" },
              { label: "Pending", value: "pending" },
              { label: "Completed", value: "completed" },
              { label: "Failed", value: "failed" },
            ],
          },
        ]}
      />

      <FullPageModal
        open={modal.isOpen("create")}
        onOpenChange={(open) => !open && modal.close()}
        title="Run payroll"
        className="lg:inset-4"
        contentClassName="max-w-4xl"
      >
        <CompanyApprovalGate>
          <InstanviConnectionGate>
            <PaymentForm
              onSuccess={() => {
                modal.close()
                toast.success("Payroll run created with transactions")
              }}
              onCancel={modal.close}
            />
          </InstanviConnectionGate>
        </CompanyApprovalGate>
      </FullPageModal>

      <FullPageModal
        open={!!viewPayRunId}
        onOpenChange={(open) => !open && modal.close()}
        title="Pay run details"
        contentClassName="max-w-5xl"
      >
        {viewPayRunId && <PayRunDetailContent payRunId={viewPayRunId} />}
      </FullPageModal>

      <ConfirmFullPageModal
        open={!!cancelId}
        onOpenChange={(open) => !open && setCancelId(null)}
        title="Cancel pay run?"
        description={
          cancelTarget
            ? `Draft pay run ${cancelTarget.reference} and its transactions will be marked as failed.`
            : "This draft pay run and its transactions will be cancelled."
        }
        confirmLabel="Cancel pay run"
        destructive
        loading={cancelMutation.isPending}
        onConfirm={handleCancelDraft}
      />
    </div>
  )
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading...</p>}>
      <PaymentsPageContent />
    </Suspense>
  )
}

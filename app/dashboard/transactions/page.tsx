"use client"

import * as React from "react"
import { Suspense } from "react"
import type { ColumnDef } from "@tanstack/react-table"

import { DataTableRowActions } from "@/components/data-table/data-table-row-actions"
import { ServerColumnHeader } from "@/components/data-table/server-column-header"
import { ServerDataTable } from "@/components/data-table/server-data-table"
import { PageHeader } from "@/components/page-header"
import { ProjectFilter } from "@/components/project-filter"
import { PayRunDetailContent } from "@/components/pay-run-detail-content"
import { Badge } from "@/components/ui/badge"
import { FullPageModal } from "@/components/ui/full-page-modal"
import { useModalParam } from "@/hooks/use-modal-param"
import { useListParams } from "@/hooks/use-list-params"
import { useTransactionsQuery } from "@/hooks/queries/use-payments-query"
import { formatDisplayDate } from "@/lib/date-utils"
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

function TransactionsPageContent() {
  const modal = useModalParam()
  const { params, setParams } = useListParams({
    sortBy: "createdAt",
    sortOrder: "desc",
  })
  const { data, isLoading, isFetching } = useTransactionsQuery(params)

  const transactions = data?.data ?? []
  const meta = data?.meta
  const viewPayRunId = modal.isOpen("view") ? modal.id : null

  const columns: ColumnDef<PayrollTransaction>[] = React.useMemo(
    () => [
      {
        accessorKey: "reference",
        id: "reference",
        header: ({ column }) => (
          <ServerColumnHeader
            column={column}
            title="Transaction"
            sortBy={params.sortBy}
            sortOrder={params.sortOrder}
            onSortChange={(sortBy, sortOrder) =>
              setParams({ sortBy, sortOrder, page: 1 })
            }
          />
        ),
      },
      {
        accessorKey: "payRunReference",
        header: "Pay run",
      },
      {
        accessorKey: "employeeName",
        id: "employeeName",
        header: ({ column }) => (
          <ServerColumnHeader
            column={column}
            title="Employee"
            sortBy={params.sortBy}
            sortOrder={params.sortOrder}
            onSortChange={(sortBy, sortOrder) =>
              setParams({ sortBy, sortOrder, page: 1 })
            }
          />
        ),
      },
      {
        accessorKey: "employeeEmail",
        header: "Email",
        enableSorting: false,
      },
      {
        accessorKey: "payPeriod",
        header: "Pay period",
      },
      {
        accessorKey: "grossAmount",
        header: "Gross",
        cell: ({ row }) =>
          `${row.original.currency} ${row.original.grossAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        enableSorting: false,
      },
      {
        accessorKey: "deductions",
        header: "Deductions",
        cell: ({ row }) =>
          `${row.original.currency} ${row.original.deductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        enableSorting: false,
      },
      {
        accessorKey: "amount",
        id: "amount",
        header: ({ column }) => (
          <ServerColumnHeader
            column={column}
            title="Net pay"
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
        accessorKey: "employeePhone",
        header: "Mobile",
        cell: ({ row }) => row.original.employeePhone ?? "—",
        enableSorting: false,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={TXN_STATUS_VARIANT[row.original.status]}>
            {row.original.status}
          </Badge>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "failureReason",
        header: "Failure",
        cell: ({ row }) => row.original.failureReason ?? "—",
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
        accessorKey: "paidAt",
        header: "Paid",
        cell: ({ row }) => formatDisplayDate(row.original.paidAt),
        enableSorting: false,
      },
      {
        accessorKey: "updatedAt",
        header: "Updated",
        cell: ({ row }) => formatDisplayDate(row.original.updatedAt),
        enableSorting: false,
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <DataTableRowActions
            actions={[
              {
                label: "View pay run",
                onClick: () => modal.open("view", row.original.payRunId),
              },
            ]}
          />
        ),
      },
    ],
    [modal, params.sortBy, params.sortOrder, setParams]
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transaction log"
        description="All employee mobile money payment transactions across pay runs"
      />

      <ServerDataTable
        columns={columns}
        data={transactions}
        meta={meta}
        params={params}
        onParamsChange={setParams}
        isLoading={isLoading}
        isFetching={isFetching}
        searchPlaceholder="Search employee, reference, pay run..."
        toolbarChildren={
          <ProjectFilter
            value={params.projectId}
            onChange={(projectId) => setParams({ projectId, page: 1 })}
          />
        }
        filters={[
          {
            key: "status",
            title: "Status",
            options: [
              { label: "Pending", value: "pending" },
              { label: "Processing", value: "processing" },
              { label: "Completed", value: "completed" },
              { label: "Failed", value: "failed" },
            ],
          },
        ]}
      />

      <FullPageModal
        open={!!viewPayRunId}
        onOpenChange={(open) => !open && modal.close()}
        title="Pay run details"
        contentClassName="max-w-5xl"
      >
        {viewPayRunId && <PayRunDetailContent payRunId={viewPayRunId} />}
      </FullPageModal>
    </div>
  )
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading...</p>}>
      <TransactionsPageContent />
    </Suspense>
  )
}

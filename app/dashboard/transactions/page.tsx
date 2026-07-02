"use client"

import * as React from "react"
import { Suspense } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { DownloadIcon } from "lucide-react"
import { toast } from "sonner"

import { DataTableRowActions } from "@/components/data-table/data-table-row-actions"
import { ServerColumnHeader } from "@/components/data-table/server-column-header"
import { ServerDataTable } from "@/components/data-table/server-data-table"
import { PageHeader } from "@/components/page-header"
import { ProjectFilter } from "@/components/project-filter"
import { PayRunDetailContent } from "@/components/pay-run-detail-content"
import { TransactionDetailModal } from "@/components/transactions/transaction-detail-modal"
import { TransactionMobileCell } from "@/components/transactions/transaction-mobile-cell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FullPageModal } from "@/components/ui/full-page-modal"
import { useModalParam } from "@/hooks/use-modal-param"
import { useListParams } from "@/hooks/use-list-params"
import { useTransactionsQuery } from "@/hooks/queries/use-payments-query"
import { downloadCsv } from "@/lib/export-csv"
import { formatDisplayDateTime } from "@/lib/date-utils"
import { transactionsService } from "@/lib/services/transactions.service"
import {
  buildTransactionsCsv,
  transactionsExportFilename,
} from "@/lib/transactions-export"
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
  const [selectedTransaction, setSelectedTransaction] =
    React.useState<PayrollTransaction | null>(null)
  const [isExporting, setIsExporting] = React.useState(false)

  const transactions = data?.data ?? []
  const meta = data?.meta
  const viewPayRunId = modal.isOpen("view") ? modal.id : null

  async function handleExport() {
    setIsExporting(true)
    try {
      const rows = await transactionsService.listAll(params)
      if (rows.length === 0) {
        toast.message("No transactions match the current filters")
        return
      }
      downloadCsv(
        transactionsExportFilename(params),
        buildTransactionsCsv(rows)
      )
      toast.success(`Exported ${rows.length} transaction(s)`)
    } catch {
      toast.error("Export failed")
    } finally {
      setIsExporting(false)
    }
  }

  const columns: ColumnDef<PayrollTransaction>[] = React.useMemo(
    () => [
      {
        accessorKey: "createdAt",
        id: "createdAt",
        header: ({ column }) => (
          <ServerColumnHeader
            column={column}
            title="Date"
            sortBy={params.sortBy}
            sortOrder={params.sortOrder}
            onSortChange={(sortBy, sortOrder) =>
              setParams({ sortBy, sortOrder, page: 1 })
            }
          />
        ),
        cell: ({ row }) => (
          <span
            className="font-mono text-xs whitespace-nowrap"
            title={row.original.createdAt}
          >
            {formatDisplayDateTime(row.original.createdAt)}
          </span>
        ),
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
        cell: ({ row }) => (
          <div className="min-w-[8rem]">
            <p className="font-medium">{row.original.employeeName}</p>
            {row.original.mobileAccountHolderName &&
              row.original.mobileAccountHolderName !== row.original.employeeName && (
                <p className="text-xs text-muted-foreground">
                  MoMo: {row.original.mobileAccountHolderName}
                </p>
              )}
          </div>
        ),
      },
      {
        id: "payee",
        header: "Phone / account",
        cell: ({ row }) => <TransactionMobileCell transaction={row.original} />,
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
        accessorKey: "payRunReference",
        header: "Pay run",
        cell: ({ row }) => (
          <span className="text-xs whitespace-nowrap">
            {row.original.payRunReference}
          </span>
        ),
        enableSorting: false,
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <DataTableRowActions
            actions={[
              {
                label: "View details",
                onClick: () => setSelectedTransaction(row.original),
              },
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
        description="Employee mobile money disbursements with payee account details"
      />

      <ServerDataTable
        columns={columns}
        data={transactions}
        meta={meta}
        params={params}
        onParamsChange={setParams}
        isLoading={isLoading}
        isFetching={isFetching}
        searchPlaceholder="Search name, phone, MoMo account, reference, pay run..."
        toolbarActions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 whitespace-nowrap"
            disabled={isExporting}
            onClick={() => void handleExport()}
          >
            <DownloadIcon className="size-4" />
            {isExporting ? "Exporting..." : "Export CSV"}
          </Button>
        }
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
          {
            key: "mobileAccountStatus",
            title: "Account",
            options: [
              { label: "Valid", value: "valid" },
              { label: "Invalid", value: "invalid" },
              { label: "Not checked", value: "unchecked" },
            ],
          },
          {
            key: "carrier",
            title: "Carrier",
            options: [
              { label: "MTN", value: "mtn" },
              { label: "Orange", value: "orange" },
            ],
          },
        ]}
      />

      <TransactionDetailModal
        transaction={selectedTransaction}
        open={!!selectedTransaction}
        onOpenChange={(open) => !open && setSelectedTransaction(null)}
        onViewPayRun={(payRunId) => {
          setSelectedTransaction(null)
          modal.open("view", payRunId)
        }}
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

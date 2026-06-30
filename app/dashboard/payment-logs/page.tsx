"use client"

import * as React from "react"
import { Suspense } from "react"
import type { ColumnDef } from "@tanstack/react-table"

import { DataTableRowActions } from "@/components/data-table/data-table-row-actions"
import { ServerColumnHeader } from "@/components/data-table/server-column-header"
import { ServerDataTable } from "@/components/data-table/server-data-table"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { FullPageModal } from "@/components/ui/full-page-modal"
import { useListParams } from "@/hooks/use-list-params"
import { usePaymentLogsQuery } from "@/hooks/queries/use-payment-logs-query"
import { formatDisplayDate } from "@/lib/date-utils"
import type { PaymentLog, PaymentLogLevel } from "@/lib/types"

const LEVEL_VARIANT: Record<
  PaymentLogLevel,
  "default" | "secondary" | "destructive" | "outline"
> = {
  debug: "outline",
  info: "secondary",
  warn: "outline",
  error: "destructive",
}

function truncateId(value?: string) {
  if (!value) return "—"
  return value.length > 12 ? `${value.slice(0, 8)}…` : value
}

function PaymentLogsPageContent() {
  const { params, setParams } = useListParams({
    sortBy: "createdAt",
    sortOrder: "desc",
  })
  const { data, isLoading, isFetching } = usePaymentLogsQuery(params)
  const [selectedLog, setSelectedLog] = React.useState<PaymentLog | null>(null)

  const logs = data?.data ?? []
  const meta = data?.meta

  const columns: ColumnDef<PaymentLog>[] = React.useMemo(
    () => [
      {
        accessorKey: "createdAt",
        id: "createdAt",
        header: ({ column }) => (
          <ServerColumnHeader
            column={column}
            title="Time"
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
        accessorKey: "level",
        header: "Level",
        cell: ({ row }) => (
          <Badge variant={LEVEL_VARIANT[row.original.level]}>
            {row.original.level}
          </Badge>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "event",
        id: "event",
        header: ({ column }) => (
          <ServerColumnHeader
            column={column}
            title="Event"
            sortBy={params.sortBy}
            sortOrder={params.sortOrder}
            onSortChange={(sortBy, sortOrder) =>
              setParams({ sortBy, sortOrder, page: 1 })
            }
          />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.event}</span>
        ),
      },
      {
        accessorKey: "message",
        id: "message",
        header: ({ column }) => (
          <ServerColumnHeader
            column={column}
            title="Message"
            sortBy={params.sortBy}
            sortOrder={params.sortOrder}
            onSortChange={(sortBy, sortOrder) =>
              setParams({ sortBy, sortOrder, page: 1 })
            }
          />
        ),
        cell: ({ row }) => (
          <span className="max-w-md truncate" title={row.original.message}>
            {row.original.message}
          </span>
        ),
      },
      {
        accessorKey: "jobId",
        header: "Job",
        cell: ({ row }) => (
          <span className="font-mono text-xs" title={row.original.jobId}>
            {truncateId(row.original.jobId)}
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "mobilePaymentTransactionId",
        header: "Payment txn",
        cell: ({ row }) => (
          <span
            className="font-mono text-xs"
            title={row.original.mobilePaymentTransactionId}
          >
            {truncateId(row.original.mobilePaymentTransactionId)}
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
                onClick: () => setSelectedLog(row.original),
              },
            ]}
          />
        ),
      },
    ],
    [params.sortBy, params.sortOrder, setParams]
  )

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Payment logs"
        description="Operational events for payroll disbursements, payment webhooks, and queue jobs"
      />

      <ServerDataTable
        columns={columns}
        data={logs}
        meta={meta}
        params={params}
        onParamsChange={setParams}
        isLoading={isLoading}
        isFetching={isFetching}
        searchPlaceholder="Search event, message, job id..."
        enableRowSelection={false}
        filters={[
          {
            key: "level",
            title: "Level",
            options: [
              { label: "Debug", value: "debug" },
              { label: "Info", value: "info" },
              { label: "Warn", value: "warn" },
              { label: "Error", value: "error" },
            ],
          },
        ]}
      />

      <FullPageModal
        open={!!selectedLog}
        onOpenChange={(open) => !open && setSelectedLog(null)}
        title={selectedLog?.event ?? "Log details"}
        contentClassName="max-w-2xl"
      >
        {selectedLog && (
          <div className="space-y-4 text-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Time</p>
                <p className="font-medium">
                  {formatDisplayDate(selectedLog.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Level</p>
                <Badge variant={LEVEL_VARIANT[selectedLog.level]}>
                  {selectedLog.level}
                </Badge>
              </div>
              <div className="sm:col-span-2">
                <p className="text-muted-foreground">Message</p>
                <p className="font-medium">{selectedLog.message}</p>
              </div>
              {selectedLog.jobId && (
                <div>
                  <p className="text-muted-foreground">Job ID</p>
                  <p className="break-all font-mono text-xs">
                    {selectedLog.jobId}
                  </p>
                </div>
              )}
              {selectedLog.mobilePaymentTransactionId && (
                <div>
                  <p className="text-muted-foreground">Payment transaction ID</p>
                  <p className="break-all font-mono text-xs">
                    {selectedLog.mobilePaymentTransactionId}
                  </p>
                </div>
              )}
            </div>
            {selectedLog.metadata && (
              <div>
                <p className="mb-2 text-muted-foreground">Metadata</p>
                <pre className="overflow-x-auto rounded-xl bg-muted/40 p-4 font-mono text-xs">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </FullPageModal>
    </div>
  )
}

export default function PaymentLogsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading...</p>}>
      <PaymentLogsPageContent />
    </Suspense>
  )
}

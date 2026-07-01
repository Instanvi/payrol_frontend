"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { DataTableRowActions } from "@/components/data-table/data-table-row-actions"
import { ServerColumnHeader } from "@/components/data-table/server-column-header"
import { ServerDataTable } from "@/components/data-table/server-data-table"
import { EmployeeImportForm } from "@/components/forms/employee-import-form"
import { PageHeader } from "@/components/page-header"
import { PayRunDetailContent } from "@/components/pay-run-detail-content"
import { PermissionGate } from "@/components/permission-gate"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { FullPageModal } from "@/components/ui/full-page-modal"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useImportEmployeesMutation } from "@/hooks/mutations/use-employee-mutations"
import {
  useExportProjectPayrollMutation,
  useSetProjectEmployeesMutation,
} from "@/hooks/mutations/use-project-mutations"
import { useActiveEmployeesQuery } from "@/hooks/queries/use-employees-query"
import {
  useProjectEmployeesQuery,
  useProjectQuery,
} from "@/hooks/queries/use-projects-query"
import {
  usePaymentsQuery,
  useTransactionsQuery,
} from "@/hooks/queries/use-payments-query"
import { queryKeys } from "@/lib/api/query-keys"
import type { ListParams } from "@/lib/api/types"
import { formatDisplayDate } from "@/lib/date-utils"
import type { CsvEmployeeRow } from "@/lib/validations/employee.schema"
import type { PaymentBatch, PayrollTransaction, Project, TransactionStatus } from "@/lib/types"
import { ArrowLeftIcon, DownloadIcon, UsersIcon } from "lucide-react"

const TXN_STATUS_VARIANT: Record<
  TransactionStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  completed: "default",
  processing: "secondary",
  pending: "outline",
  failed: "destructive",
}

function formatPayRunStatus(status: PaymentBatch["status"]) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export default function ProjectDetailPage() {
  const queryClient = useQueryClient()
  const params = useParams<{ id: string }>()
  const projectId = params.id

  const { data: project, isLoading: projectLoading } = useProjectQuery(projectId)
  const { data: assignedEmployees = [], isLoading: assignedLoading } =
    useProjectEmployeesQuery(projectId)
  const { data: allEmployees = [] } = useActiveEmployeesQuery()
  const importMutation = useImportEmployeesMutation()
  const [viewPayRunId, setViewPayRunId] = React.useState<string | null>(null)
  const [payRunParams, setPayRunParams] = React.useState<ListParams>({
    projectId,
    page: 1,
    pageSize: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  })
  const [transactionParams, setTransactionParams] = React.useState<ListParams>({
    projectId,
    page: 1,
    pageSize: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  })
  const { data: payRunsData, isLoading: payRunsLoading, isFetching: payRunsFetching } =
    usePaymentsQuery(payRunParams)
  const {
    data: transactionsData,
    isLoading: transactionsLoading,
    isFetching: transactionsFetching,
  } = useTransactionsQuery(transactionParams)

  const setEmployeesMutation = useSetProjectEmployeesMutation()
  const exportMutation = useExportProjectPayrollMutation()

  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())

  React.useEffect(() => {
    setSelectedIds(new Set(assignedEmployees.map((e) => e.id)))
  }, [assignedEmployees])

  React.useEffect(() => {
    setPayRunParams((prev) => ({ ...prev, projectId }))
    setTransactionParams((prev) => ({ ...prev, projectId }))
  }, [projectId])

  function toggleEmployee(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  async function saveEmployees() {
    await setEmployeesMutation.mutateAsync({
      projectId,
      employeeIds: [...selectedIds],
    })
    toast.success("Project employees updated")
  }

  async function handleImportEmployees(rows: CsvEmployeeRow[]) {
    await importMutation.mutateAsync(rows)
    await queryClient.invalidateQueries({ queryKey: queryKeys.employees.active() })
    toast.success(
      "Employees imported. You can now select them in the Existing employees tab."
    )
  }

  if (projectLoading) {
    return <Skeleton className="h-40 w-full" />
  }

  if (!project) {
    return <p className="text-sm text-muted-foreground">Project not found.</p>
  }

  const payRuns = payRunsData?.data ?? []
  const payRunMeta = payRunsData?.meta
  const transactions = transactionsData?.data ?? []
  const transactionMeta = transactionsData?.meta

  const payRunColumns = React.useMemo(
    () => createPayRunColumns(setViewPayRunId, payRunParams, setPayRunParams),
    [payRunParams]
  )

  const transactionColumns = React.useMemo(
    () =>
      createTransactionColumns(setViewPayRunId, transactionParams, setTransactionParams),
    [transactionParams]
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={project.name}
        description={project.code ?? "Project details"}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard/projects">
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <Button
              onClick={() => exportMutation.mutate(projectId)}
              disabled={exportMutation.isPending}
            >
              <DownloadIcon className="mr-2 h-4 w-4" />
              Export to Excel
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="overview" className="gap-4">
        <TabsList variant="line" className="w-full justify-start overflow-x-auto p-0">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="employees">Existing employees</TabsTrigger>
          <TabsTrigger value="import">Import employees</TabsTrigger>
          <TabsTrigger value="payments">Pay runs</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="Status" value={project.status} project={project} />
            <SummaryCard label="Employees" value={String(project.employeeCount)} />
            <SummaryCard label="Pay runs" value={String(project.payRunCount)} />
            <SummaryCard
              label="Created"
              value={formatDisplayDate(project.createdAt)}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Project info</CardTitle>
              <CardDescription>
                {project.description ?? "No description"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Project name</p>
                  <p className="font-medium">{project.name}</p>
                </div>
                <div className="bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Project code</p>
                  <p className="font-medium">{project.code ?? "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees">
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Add existing employees</CardTitle>
                <CardDescription>
                  Select company employees and attach them to this project.
                </CardDescription>
              </div>
              <PermissionGate permission="employees:write">
                <Button
                  onClick={saveEmployees}
                  disabled={setEmployeesMutation.isPending || assignedLoading}
                >
                  <UsersIcon className="mr-2 h-4 w-4" />
                  Save employees
                </Button>
              </PermissionGate>
            </CardHeader>
            <CardContent>
              {assignedLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : allEmployees.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No employees available. Add or import employees first.
                </p>
              ) : (
                <ul className="space-y-2">
                  {allEmployees.map((employee) => (
                    <li
                      key={employee.id}
                      className="flex items-center gap-3 bg-muted/30 p-3"
                    >
                      <Checkbox
                        checked={selectedIds.has(employee.id)}
                        onCheckedChange={(checked) =>
                          toggleEmployee(employee.id, checked === true)
                        }
                      />
                      <div className="min-w-0">
                        <p className="font-medium">{employee.name}</p>
                        <p className="truncate text-sm text-muted-foreground">
                          {employee.email}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle>Import employees</CardTitle>
              <CardDescription>
                Upload a CSV here, then switch to the Existing employees tab to add the
                imported employees to this project.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PermissionGate permission="employees:import">
                <EmployeeImportForm
                  onImport={handleImportEmployees}
                  isImporting={importMutation.isPending}
                />
              </PermissionGate>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <ServerDataTable
            columns={payRunColumns}
            data={payRuns}
            meta={payRunMeta}
            params={payRunParams}
            onParamsChange={(updates) =>
              setPayRunParams((prev) => ({ ...prev, ...updates, projectId }))
            }
            isLoading={payRunsLoading}
            isFetching={payRunsFetching}
            enableRowSelection={false}
            searchPlaceholder="Search pay runs..."
            emptyMessage="No pay runs for this project yet."
          />
        </TabsContent>

        <TabsContent value="transactions">
          <ServerDataTable
            columns={transactionColumns}
            data={transactions}
            meta={transactionMeta}
            params={transactionParams}
            onParamsChange={(updates) =>
              setTransactionParams((prev) => ({ ...prev, ...updates, projectId }))
            }
            isLoading={transactionsLoading}
            isFetching={transactionsFetching}
            enableRowSelection={false}
            searchPlaceholder="Search employee, reference, pay run..."
            emptyMessage="No transactions for this project yet."
          />
        </TabsContent>
      </Tabs>

      <FullPageModal
        open={!!viewPayRunId}
        onOpenChange={(open) => !open && setViewPayRunId(null)}
        title="Pay run details"
        contentClassName="max-w-5xl"
      >
        {viewPayRunId && <PayRunDetailContent payRunId={viewPayRunId} />}
      </FullPageModal>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  project,
}: {
  label: string
  value: string
  project?: Project
}) {
  return (
    <Card size="sm">
      <CardContent className="space-y-2 py-2">
        <p className="text-xs text-muted-foreground">{label}</p>
        {label === "Status" && project ? (
          <Badge variant={project.status === "active" ? "default" : "secondary"}>
            {project.status}
          </Badge>
        ) : (
          <p className="font-medium">{value}</p>
        )}
      </CardContent>
    </Card>
  )
}

function createPayRunColumns(
  setViewPayRunId: (id: string) => void,
  params: ListParams,
  setParams: React.Dispatch<React.SetStateAction<ListParams>>
): ColumnDef<PaymentBatch>[] {
  return [
    {
      accessorKey: "reference",
      id: "reference",
      header: ({ column }: { column: unknown }) => (
        <ServerColumnHeader
          column={column as never}
          title="Reference"
          sortBy={params.sortBy}
          sortOrder={params.sortOrder}
          onSortChange={(sortBy, sortOrder) =>
            setParams((prev) => ({ ...prev, sortBy, sortOrder, page: 1 }))
          }
        />
      ),
    },
    {
      accessorKey: "payPeriod",
      id: "payPeriod",
      header: ({ column }: { column: unknown }) => (
        <ServerColumnHeader
          column={column as never}
          title="Pay period"
          sortBy={params.sortBy}
          sortOrder={params.sortOrder}
          onSortChange={(sortBy, sortOrder) =>
            setParams((prev) => ({ ...prev, sortBy, sortOrder, page: 1 }))
          }
        />
      ),
    },
    {
      accessorKey: "amount",
      header: "Total payroll",
      cell: ({ row }: { row: { original: PaymentBatch } }) =>
        `${row.original.currency} ${row.original.amount.toLocaleString(undefined, {
          minimumFractionDigits: 2,
        })}`,
    },
    {
      accessorKey: "employeeCount",
      header: "Employees",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: { original: PaymentBatch } }) => (
        <span className="text-sm font-medium">
          {formatPayRunStatus(row.original.status)}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      id: "createdAt",
      header: ({ column }: { column: unknown }) => (
        <ServerColumnHeader
          column={column as never}
          title="Created"
          sortBy={params.sortBy}
          sortOrder={params.sortOrder}
          onSortChange={(sortBy, sortOrder) =>
            setParams((prev) => ({ ...prev, sortBy, sortOrder, page: 1 }))
          }
        />
      ),
      cell: ({ row }: { row: { original: PaymentBatch } }) =>
        formatDisplayDate(row.original.createdAt),
    },
    {
      id: "actions",
      cell: ({ row }: { row: { original: PaymentBatch } }) => (
        <DataTableRowActions
          actions={[
            {
              label: "View details",
              onClick: () => setViewPayRunId(row.original.id),
            },
          ]}
        />
      ),
    },
  ]
}

function createTransactionColumns(
  setViewPayRunId: (id: string) => void,
  params: ListParams,
  setParams: React.Dispatch<React.SetStateAction<ListParams>>
): ColumnDef<PayrollTransaction>[] {
  return [
    {
      accessorKey: "reference",
      id: "reference",
      header: ({ column }: { column: unknown }) => (
        <ServerColumnHeader
          column={column as never}
          title="Transaction"
          sortBy={params.sortBy}
          sortOrder={params.sortOrder}
          onSortChange={(sortBy, sortOrder) =>
            setParams((prev) => ({ ...prev, sortBy, sortOrder, page: 1 }))
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
      header: ({ column }: { column: unknown }) => (
        <ServerColumnHeader
          column={column as never}
          title="Employee"
          sortBy={params.sortBy}
          sortOrder={params.sortOrder}
          onSortChange={(sortBy, sortOrder) =>
            setParams((prev) => ({ ...prev, sortBy, sortOrder, page: 1 }))
          }
        />
      ),
    },
    {
      accessorKey: "amount",
      header: "Net pay",
      cell: ({ row }: { row: { original: PayrollTransaction } }) =>
        `${row.original.currency} ${row.original.amount.toLocaleString(undefined, {
          minimumFractionDigits: 2,
        })}`,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: { original: PayrollTransaction } }) => (
        <Badge variant={TXN_STATUS_VARIANT[row.original.status]}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "paidAt",
      header: "Paid",
      cell: ({ row }: { row: { original: PayrollTransaction } }) =>
        formatDisplayDate(row.original.paidAt),
    },
    {
      id: "actions",
      cell: ({ row }: { row: { original: PayrollTransaction } }) => (
        <DataTableRowActions
          actions={[
            {
              label: "View pay run",
              onClick: () => setViewPayRunId(row.original.payRunId),
            },
          ]}
        />
      ),
    },
  ]
}

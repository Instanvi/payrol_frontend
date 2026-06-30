"use client"

import * as React from "react"
import { Suspense } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import type { RowSelectionState } from "@tanstack/react-table"
import { toast } from "sonner"

import { DataTableRowActions } from "@/components/data-table/data-table-row-actions"
import { ServerColumnHeader } from "@/components/data-table/server-column-header"
import { ServerDataTable } from "@/components/data-table/server-data-table"
import { EmployeeMobileAccountBadge } from "@/components/employee-mobile-account-badge"
import { EmployeeForm } from "@/components/forms/employee-form"
import { EmployeeImportForm } from "@/components/forms/employee-import-form"
import { PageHeader } from "@/components/page-header"
import { PermissionGate } from "@/components/permission-gate"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ConfirmFullPageModal,
  FullPageModal,
} from "@/components/ui/full-page-modal"
import {
  useCreateEmployeeMutation,
  useDeactivateEmployeeMutation,
  useImportEmployeesMutation,
  useUpdateEmployeeMutation,
  useValidateEmployeeAccountMutation,
  useValidateEmployeeAccountsMutation,
} from "@/hooks/mutations/use-employee-mutations"
import { useModalParam } from "@/hooks/use-modal-param"
import { useListParams } from "@/hooks/use-list-params"
import { useEmployeeQuery, useEmployeesQuery } from "@/hooks/queries/use-employees-query"
import type { Employee } from "@/lib/types"
import { PlusIcon, ShieldCheckIcon, UploadIcon } from "lucide-react"

function EmployeesPageContent() {
  const modal = useModalParam()
  const { params, setParams } = useListParams({ sortBy: "name", sortOrder: "asc" })
  const { data, isLoading, isFetching } = useEmployeesQuery(params)
  const { data: editEmployee } = useEmployeeQuery(
    modal.isOpen("edit") ? modal.id : null
  )

  const deactivateMutation = useDeactivateEmployeeMutation()
  const validateOneMutation = useValidateEmployeeAccountMutation()
  const validateManyMutation = useValidateEmployeeAccountsMutation()
  const [deactivateId, setDeactivateId] = React.useState<string | null>(null)
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [validatingId, setValidatingId] = React.useState<string | null>(null)

  const selectedEmployeeIds = Object.keys(rowSelection).filter(
    (id) => rowSelection[id]
  )

  const employees = data?.data ?? []
  const meta = data?.meta

  function handleModalSuccess() {
    modal.close()
    toast.success("Saved successfully")
  }

  const openEdit = React.useCallback(
    (id: string) => modal.open("edit", id),
    [modal]
  )

  async function handleValidateOne(id: string) {
    setValidatingId(id)
    try {
      await validateOneMutation.mutateAsync(id)
    } finally {
      setValidatingId(null)
    }
  }

  async function handleValidateSelected() {
    if (selectedEmployeeIds.length === 0) {
      toast.message("Select employees to validate")
      return
    }
    await validateManyMutation.mutateAsync(selectedEmployeeIds)
    setRowSelection({})
  }

  async function handleValidateAllActive() {
    await validateManyMutation.mutateAsync(undefined)
    setRowSelection({})
  }

  const columns: ColumnDef<Employee>[] = React.useMemo(
    () => [
      {
        accessorKey: "name",
        id: "name",
        header: ({ column }) => (
          <ServerColumnHeader
            column={column}
            title="Name"
            sortBy={params.sortBy}
            sortOrder={params.sortOrder}
            onSortChange={(sortBy, sortOrder) =>
              setParams({ sortBy, sortOrder, page: 1 })
            }
          />
        ),
      },
      {
        accessorKey: "email",
        id: "email",
        header: ({ column }) => (
          <ServerColumnHeader
            column={column}
            title="Email"
            sortBy={params.sortBy}
            sortOrder={params.sortOrder}
            onSortChange={(sortBy, sortOrder) =>
              setParams({ sortBy, sortOrder, page: 1 })
            }
          />
        ),
      },
      {
        accessorKey: "phone",
        header: "Phone",
        cell: ({ row }) => row.original.phone ?? "—",
        enableSorting: false,
      },
      {
        id: "mobileAccount",
        header: "Mobile account",
        cell: ({ row }) => (
          <EmployeeMobileAccountBadge
            employee={row.original}
            showCarrier
          />
        ),
        enableSorting: false,
      },
      {
        accessorKey: "department",
        id: "department",
        header: ({ column }) => (
          <ServerColumnHeader
            column={column}
            title="Department"
            sortBy={params.sortBy}
            sortOrder={params.sortOrder}
            onSortChange={(sortBy, sortOrder) =>
              setParams({ sortBy, sortOrder, page: 1 })
            }
          />
        ),
        cell: ({ row }) => row.original.department ?? "—",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant={row.original.status === "active" ? "default" : "secondary"}
          >
            {row.original.status}
          </Badge>
        ),
        enableSorting: false,
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <PermissionGate permission="employees:write">
            <DataTableRowActions
              actions={[
                {
                  label: "Edit",
                  onClick: () => openEdit(row.original.id),
                },
                {
                  label:
                    validatingId === row.original.id
                      ? "Validating..."
                      : "Validate mobile account",
                  disabled: !row.original.phone?.trim(),
                  onClick: () => void handleValidateOne(row.original.id),
                },
                {
                  label: "Deactivate",
                  destructive: true,
                  disabled: row.original.status === "inactive",
                  onClick: () => setDeactivateId(row.original.id),
                },
              ]}
            />
          </PermissionGate>
        ),
      },
    ],
    [
      openEdit,
      params.sortBy,
      params.sortOrder,
      setParams,
      validateOneMutation.isPending,
      validatingId,
    ]
  )

  const deactivateTarget = employees.find((e) => e.id === deactivateId)

  async function handleDeactivate() {
    if (!deactivateId) return
    await deactivateMutation.mutateAsync(deactivateId)
    toast.success("Employee deactivated")
    setDeactivateId(null)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Employees"
        description="Manage your employee roster and mobile money accounts"
      />

      <ServerDataTable
        columns={columns}
        data={employees}
        meta={meta}
        params={params}
        onParamsChange={setParams}
        isLoading={isLoading}
        isFetching={isFetching}
        searchPlaceholder="Search employees..."
        onRowSelectionChange={setRowSelection}
        toolbarActions={
          <>
            <PermissionGate permission="employees:import">
              <Button
                variant="outline"
                size="sm"
                onClick={() => modal.open("import")}
              >
                <UploadIcon />
                Import CSV
              </Button>
            </PermissionGate>
            <PermissionGate permission="employees:write">
              <Button size="sm" onClick={() => modal.open("create")}>
                <PlusIcon />
                Add employee
              </Button>
            </PermissionGate>
          </>
        }
        toolbarChildren={
          <PermissionGate permission="employees:write">
            <Button
              variant="outline"
              size="sm"
              disabled={
                validateManyMutation.isPending || selectedEmployeeIds.length === 0
              }
              onClick={() => void handleValidateSelected()}
            >
              <ShieldCheckIcon />
              Validate selected ({selectedEmployeeIds.length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={validateManyMutation.isPending}
              onClick={() => void handleValidateAllActive()}
            >
              Validate all active
            </Button>
          </PermissionGate>
        }
        filters={[
          {
            key: "status",
            title: "Status",
            options: [
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ],
          },
        ]}
      />

      <FullPageModal
        open={modal.isOpen("create")}
        onOpenChange={(open) => !open && modal.close()}
        title="Add employee"
      >
        <EmployeeFormWrapper onSuccess={handleModalSuccess} onCancel={modal.close} />
      </FullPageModal>

      <FullPageModal
        open={modal.isOpen("edit")}
        onOpenChange={(open) => !open && modal.close()}
        title="Edit employee"
      >
        {editEmployee && (
          <EmployeeFormWrapper
            key={editEmployee.id}
            employee={editEmployee}
            onSuccess={handleModalSuccess}
            onCancel={modal.close}
          />
        )}
      </FullPageModal>

      <FullPageModal
        open={modal.isOpen("import")}
        onOpenChange={(open) => !open && modal.close()}
        title="Import employees"
      >
        <EmployeeImportFormWrapper
          onSuccess={handleModalSuccess}
          onCancel={modal.close}
        />
      </FullPageModal>

      <ConfirmFullPageModal
        open={!!deactivateId}
        onOpenChange={(open) => !open && setDeactivateId(null)}
        title="Deactivate employee?"
        description={
          deactivateTarget
            ? `${deactivateTarget.name} will be marked inactive and excluded from future pay runs.`
            : "This employee will be excluded from future pay runs."
        }
        confirmLabel="Deactivate"
        destructive
        loading={deactivateMutation.isPending}
        onConfirm={handleDeactivate}
      />
    </div>
  )
}

function EmployeeFormWrapper({
  employee,
  onSuccess,
  onCancel,
}: {
  employee?: Employee
  onSuccess: () => void
  onCancel: () => void
}) {
  const createMutation = useCreateEmployeeMutation()
  const updateMutation = useUpdateEmployeeMutation()
  const validateMutation = useValidateEmployeeAccountMutation()

  return (
    <EmployeeForm
      employee={employee}
      onCancel={onCancel}
      isSubmitting={createMutation.isPending || updateMutation.isPending}
      isValidating={validateMutation.isPending}
      onValidateAccount={
        employee
          ? async () => {
              await validateMutation.mutateAsync(employee.id)
            }
          : undefined
      }
      onSubmit={async (values) => {
        if (employee) {
          await updateMutation.mutateAsync({ id: employee.id, data: values })
        } else {
          await createMutation.mutateAsync(values)
        }
        onSuccess()
      }}
    />
  )
}

function EmployeeImportFormWrapper({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void
  onCancel: () => void
}) {
  const importMutation = useImportEmployeesMutation()

  return (
    <EmployeeImportForm
      onCancel={onCancel}
      isImporting={importMutation.isPending}
      onImport={async (rows) => {
        const result = await importMutation.mutateAsync(rows)
        toast.success(
          `Imported ${result.imported} employee(s)${result.skipped ? `, skipped ${result.skipped} duplicate(s)` : ""}`
        )
        onSuccess()
      }}
    />
  )
}

export default function EmployeesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading...</p>}>
      <EmployeesPageContent />
    </Suspense>
  )
}

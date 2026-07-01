"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table"

import { DataTable } from "@/components/data-table/data-table"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { EmployeeMobileAccountBadge } from "@/components/employee-mobile-account-badge"
import { DatePicker, DateRangePicker } from "@/components/date-picker"
import { Button } from "@/components/ui/button"
import { useActiveEmployeesQuery } from "@/hooks/queries/use-employees-query"
import { useProjectEmployeesQuery, useProjectsQuery } from "@/hooks/queries/use-projects-query"
import { useCreatePaymentMutation } from "@/hooks/mutations/use-payment-mutations"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  paymentFormSchema,
  type PaymentFormInput,
} from "@/lib/validations/payment.schema"
import { format } from "date-fns"
import type { Employee } from "@/lib/types"
import { formatPayPeriodLabel } from "@/lib/date-utils"
import { splitPayrollAmount, generatePayRunReference, payrollLinesFromEmployees } from "@/lib/payroll-utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function PaymentForm({
  onSuccess,
  onCancel,
}: {
  onSuccess?: () => void
  onCancel?: () => void
}) {
  const { data: projects = [], isLoading: projectsLoading } =
    useProjectsQuery("active")
  const createMutation = useCreatePaymentMutation()
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [step, setStep] = React.useState<"details" | "recipients" | "review">(
    "details"
  )

  const form = useForm<PaymentFormInput>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      reference: generatePayRunReference(),
      payPeriodRange: { from: undefined, to: undefined },
      amount: 0,
      currency: "XAF",
      taxRate: 0,
      scheduledAt: undefined,
      projectId: "",
      employeeIds: [],
    },
  })

  React.useEffect(() => {
    if (!form.getValues("reference")) {
      form.setValue("reference", generatePayRunReference())
    }
  }, [form])

  const projectId = form.watch("projectId")
  const { data: projectEmployees = [] } = useProjectEmployeesQuery(
    projectId || null
  )
  const { data: allEmployees = [], isLoading: employeesLoading } =
    useActiveEmployeesQuery()

  const employees = React.useMemo(() => {
    if (!projectId) return []
    const projectEmployeeIds = new Set(projectEmployees.map((e) => e.id))
    return allEmployees.filter((e) => projectEmployeeIds.has(e.id))
  }, [allEmployees, projectEmployees, projectId])

  const selectedProject = projects.find((p) => p.id === projectId)

  React.useEffect(() => {
    setRowSelection({})
    form.setValue("employeeIds", [])
  }, [projectId, form])

  React.useEffect(() => {
    const selectedIds = Object.keys(rowSelection).filter(
      (id) => rowSelection[id]
    )
    form.setValue("employeeIds", selectedIds, { shouldValidate: true })
  }, [rowSelection, form])

  const values = form.watch()

  const selectedEmployees = employees.filter((e) =>
    values.employeeIds.includes(e.id)
  )
  const payrollLines =
    values.employeeIds.length > 0
      ? payrollLinesFromEmployees(
          selectedEmployees,
          Number(values.amount),
          Number(values.taxRate) || 0
        )
      : []

  const columns: ColumnDef<Employee>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => row.original.phone ?? "—",
    },
    {
      id: "mobileAccount",
      header: "Mobile account",
      cell: ({ row }) => (
        <EmployeeMobileAccountBadge employee={row.original} showCarrier />
      ),
    },
    {
      accessorKey: "department",
      header: "Department",
      cell: ({ row }) => row.original.department ?? "—",
    },
  ]

  async function onSubmit(data: PaymentFormInput) {
    await createMutation.mutateAsync(data)
    onSuccess?.()
  }

  function handleNext() {
    if (step === "details") {
      form
        .trigger([
          "projectId",
          "payPeriodRange",
          "amount",
          "currency",
        ])
        .then((valid) => {
          if (valid) setStep("recipients")
        })
    } else if (step === "recipients") {
      form.trigger("employeeIds").then((valid) => {
        if (valid) setStep("review")
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {step === "details" && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-base font-medium">Pay run details</h3>
              <p className="text-sm text-muted-foreground">
                Set the pay period, total net payroll, optional tax rate, and pay
                date
              </p>
            </div>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projectsLoading ? (
                          <SelectItem value="loading" disabled>
                            Loading...
                          </SelectItem>
                        ) : projects.length === 0 ? (
                          <SelectItem value="none" disabled>
                            No active projects
                          </SelectItem>
                        ) : (
                          projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                              {project.code ? ` (${project.code})` : ""}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="payPeriodRange"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Pay period</FormLabel>
                    <FormControl>
                      <DateRangePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select pay period dates"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pay run reference</FormLabel>
                    <FormControl>
                      <Input readOnly className="bg-muted/50" {...field} />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Generated automatically for this pay run
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total net payroll</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? 0
                              : parseFloat(e.target.value)
                          )
                        }
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Amount employees receive before platform fees
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="taxRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax rate % (optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? 0
                              : parseFloat(e.target.value)
                          )
                        }
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Leave at 0 for no tax. Net pay stays as entered; tax is
                      calculated on top for reporting.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="XAF">XAF</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="scheduledAt"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Pay date (optional)</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select pay date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        {step === "recipients" && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-base font-medium">Select employees</h3>
              <p className="text-sm text-muted-foreground">
                Choose employees assigned to{" "}
                {selectedProject?.name ?? "this project"}
              </p>
            </div>
            <div>
              {!projectId ? (
                <p className="text-sm text-muted-foreground">
                  Select a project in the previous step.
                </p>
              ) : employeesLoading ? (
                <p className="text-sm text-muted-foreground">Loading employees...</p>
              ) : employees.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No employees assigned to this project. Assign employees on the
                  project page first.
                </p>
              ) : (
                <DataTable
                  columns={columns}
                  data={employees}
                  searchKey="name"
                  searchPlaceholder="Search employees..."
                  rowSelection={rowSelection}
                  onRowSelectionChange={setRowSelection}
                />
              )}
              <FormField
                control={form.control}
                name="employeeIds"
                render={() => (
                  <FormItem className="mt-2">
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-base font-medium">Review pay run</h3>
              <p className="text-sm text-muted-foreground">
                Confirm payroll totals before processing
              </p>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Project</span>
                <span className="font-medium">
                  {selectedProject?.name ?? "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pay period</span>
                <span className="font-medium">
                  {values.payPeriodRange?.from && values.payPeriodRange?.to
                    ? formatPayPeriodLabel(
                        values.payPeriodRange.from,
                        values.payPeriodRange.to
                      )
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reference</span>
                <span className="font-medium">{values.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total net payroll</span>
                <span className="font-medium">
                  {values.currency}{" "}
                  {Number(values.amount).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              {Number(values.taxRate) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax rate</span>
                  <span className="font-medium">{values.taxRate}%</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Recipients</span>
                <span className="font-medium">
                  {values.employeeIds.length} employee(s)
                </span>
              </div>
              {values.scheduledAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pay date</span>
                  <span className="font-medium">
                    {format(values.scheduledAt, "PPP")}
                  </span>
                </div>
              )}

              {selectedEmployees.length > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="font-medium">Payment transactions</p>
                  <p className="text-xs text-muted-foreground">
                    Each employee will receive one mobile money disbursement
                  </p>
                  <div className="border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Mobile number</TableHead>
                          <TableHead>Mobile account</TableHead>
                          <TableHead className="text-right">Gross</TableHead>
                          <TableHead className="text-right">Tax</TableHead>
                          <TableHead className="text-right">Net pay</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedEmployees.map((employee, index) => {
                          const line = payrollLines[index]
                          return (
                          <TableRow key={employee.id}>
                            <TableCell>{employee.name}</TableCell>
                            <TableCell>{employee.phone ?? "—"}</TableCell>
                            <TableCell>
                              <EmployeeMobileAccountBadge
                                employee={employee}
                                showCarrier
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              {values.currency}{" "}
                              {(line?.grossAmount ?? 0).toLocaleString(
                                undefined,
                                { minimumFractionDigits: 2 }
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {values.currency}{" "}
                              {(line?.deductions ?? 0).toLocaleString(
                                undefined,
                                { minimumFractionDigits: 2 }
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {values.currency}{" "}
                              {(line?.netPay ?? 0).toLocaleString(
                                undefined,
                                { minimumFractionDigits: 2 }
                              )}
                            </TableCell>
                          </TableRow>
                        )})}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {step !== "details" && (
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setStep(step === "review" ? "recipients" : "details")
              }
            >
              Back
            </Button>
          )}
          {step !== "review" ? (
            <Button type="button" onClick={handleNext}>
              Continue
            </Button>
          ) : (
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Processing..." : "Run payroll"}
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}

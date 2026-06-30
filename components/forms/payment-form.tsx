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
import { splitPayrollAmount } from "@/lib/payroll-utils"
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
  const { data: employees = [], isLoading: employeesLoading } =
    useActiveEmployeesQuery()
  const createMutation = useCreatePaymentMutation()
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [step, setStep] = React.useState<"details" | "recipients" | "review">(
    "details"
  )

  const form = useForm<PaymentFormInput>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      reference: "",
      payPeriodRange: { from: undefined, to: undefined },
      amount: 0,
      currency: "USD",
      scheduledAt: undefined,
      employeeIds: [],
    },
  })

  React.useEffect(() => {
    const ids = Object.keys(rowSelection).filter((key) => rowSelection[key])
    const selectedIds = ids
      .map((index) => employees[Number(index)]?.id)
      .filter(Boolean) as string[]
    form.setValue("employeeIds", selectedIds)
  }, [rowSelection, employees, form])

  const values = form.watch()

  const selectedEmployees = employees.filter((e) =>
    values.employeeIds.includes(e.id)
  )
  const splitAmounts =
    values.employeeIds.length > 0
      ? splitPayrollAmount(Number(values.amount), values.employeeIds.length)
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
        .trigger(["reference", "payPeriodRange", "amount", "currency"])
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
                Set the pay period, total payroll amount, and disbursement date
              </p>
            </div>
            <div className="space-y-4">
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
                      <Input placeholder="PAYROLL-2025-004" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total payroll amount</FormLabel>
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
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="XAF">XAF</SelectItem>
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
                Choose who to include in this pay run
              </p>
            </div>
            <div>
              {employeesLoading ? (
                <p className="text-sm text-muted-foreground">Loading employees...</p>
              ) : (
                <DataTable
                  columns={columns}
                  data={employees}
                  searchKey="name"
                  searchPlaceholder="Search employees..."
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
                <span className="text-muted-foreground">Total payroll</span>
                <span className="font-medium">
                  {values.currency}{" "}
                  {Number(values.amount).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
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
                          <TableHead className="text-right">Net pay</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedEmployees.map((employee, index) => (
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
                              {(splitAmounts[index] ?? 0).toLocaleString(
                                undefined,
                                { minimumFractionDigits: 2 }
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
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

"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import {
  EmployeeMobileAccountBadge,
} from "@/components/employee-mobile-account-badge"
import { Button } from "@/components/ui/button"
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
  employeeSchema,
  type EmployeeFormValues,
} from "@/lib/validations/employee.schema"
import type { Employee } from "@/lib/types"

interface EmployeeFormProps {
  employee?: Employee
  isSubmitting?: boolean
  isValidating?: boolean
  onValidateAccount?: () => Promise<void>
  onSubmit: (values: EmployeeFormValues) => Promise<void>
  onCancel?: () => void
}

export function EmployeeForm({
  employee,
  isSubmitting = false,
  isValidating = false,
  onValidateAccount,
  onSubmit,
  onCancel,
}: EmployeeFormProps) {
  const isEditing = !!employee

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: employee?.name ?? "",
      email: employee?.email ?? "",
      phone: employee?.phone ?? "",
      department: employee?.department ?? "",
      status: employee?.status ?? "active",
    },
  })

  async function handleSubmit(values: EmployeeFormValues) {
    await onSubmit(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full name</FormLabel>
              <FormControl>
                <Input placeholder="Jane Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="jane@company.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mobile money number</FormLabel>
              <FormControl>
                <Input placeholder="+237 6XX XXX XXX" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {isEditing && employee && (
          <div className="rounded-xl bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">Mobile money account</p>
                <p className="text-xs text-muted-foreground">
                  Validate MTN or Orange mobile money eligibility for payroll
                </p>
              </div>
              {onValidateAccount && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isValidating || !employee.phone?.trim()}
                  onClick={() => void onValidateAccount()}
                >
                  {isValidating ? "Checking..." : "Validate account"}
                </Button>
              )}
            </div>
            <EmployeeMobileAccountBadge employee={employee} showCarrier />
            {employee.mobileAccountValidationError && (
              <p className="text-xs text-destructive">
                {employee.mobileAccountValidationError}
              </p>
            )}
          </div>
        )}
        <FormField
          control={form.control}
          name="department"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Department</FormLabel>
              <FormControl>
                <Input placeholder="Engineering" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : isEditing
                ? "Update employee"
                : "Add employee"}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Form>
  )
}

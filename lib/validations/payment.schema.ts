import { format } from "date-fns"
import { z } from "zod"

import { formatPayPeriodLabel, toApiDateString } from "@/lib/date-utils"

export const paymentSchema = z.object({
  reference: z.string().min(3, "Reference must be at least 3 characters"),
  payPeriod: z.string().min(3, "Pay period is required"),
  amount: z.number().positive("Total payroll amount must be greater than 0"),
  currency: z.enum(["USD", "EUR", "GBP"]),
  scheduledAt: z.string().optional(),
  employeeIds: z
    .array(z.string())
    .min(1, "Select at least one employee"),
})

export const paymentFormSchema = z
  .object({
    reference: z.string().min(3, "Reference must be at least 3 characters"),
    payPeriodRange: z
      .object({
        from: z.date().optional(),
        to: z.date().optional(),
      })
      .superRefine((range, ctx) => {
        if (!range.from) {
          ctx.addIssue({
            code: "custom",
            message: "Pay period start is required",
            path: ["from"],
          })
        }
        if (!range.to) {
          ctx.addIssue({
            code: "custom",
            message: "Pay period end is required",
            path: ["to"],
          })
        }
        if (range.from && range.to && range.to < range.from) {
          ctx.addIssue({
            code: "custom",
            message: "End date must be on or after start date",
            path: ["to"],
          })
        }
      }),
    amount: z.number().positive("Total payroll amount must be greater than 0"),
    currency: z.enum(["USD", "EUR", "GBP"]),
    scheduledAt: z.date().optional(),
    employeeIds: z
      .array(z.string())
      .min(1, "Select at least one employee"),
  })

export type PaymentFormValues = z.infer<typeof paymentSchema>
export type PaymentFormInput = z.infer<typeof paymentFormSchema>

export function paymentFormToPayload(values: PaymentFormInput): PaymentFormValues {
  const { from, to } = values.payPeriodRange
  if (!from || !to) {
    throw new Error("Pay period range is required")
  }

  return {
    reference: values.reference,
    payPeriod: formatPayPeriodLabel(from, to),
    amount: values.amount,
    currency: values.currency,
    scheduledAt: toApiDateString(values.scheduledAt),
    employeeIds: values.employeeIds,
  }
}

export function formatScheduledAtDisplay(value?: string) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return format(date, "PPP")
}

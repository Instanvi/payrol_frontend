import { z } from "zod"

export const employeeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(1, "Mobile money phone number is required"),
  department: z.string().optional(),
  status: z.enum(["active", "inactive"]),
})

export type EmployeeFormValues = z.infer<typeof employeeSchema>

export const csvEmployeeRowSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(1, "Phone is required"),
  department: z.string().optional(),
})

export type CsvEmployeeRow = z.infer<typeof csvEmployeeRowSchema>

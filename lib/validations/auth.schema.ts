import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean().default(false),
})

export type LoginFormValues = z.infer<typeof loginSchema>

export const twoFactorSchema = z.object({
  code: z
    .string()
    .length(6, "Verification code must be 6 digits")
    .regex(/^\d+$/, "Verification code must contain only numbers"),
})

export type TwoFactorFormValues = z.infer<typeof twoFactorSchema>

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  acceptTerms: z.boolean().refine((value) => value, {
    message: "You must accept the terms and privacy policy",
  }),
})

export type RegisterFormValues = z.infer<typeof registerSchema>

export const companyProfileSchema = z.object({
  name: z.string().min(2).optional(),
  legalName: z.string().min(2, "Legal name is required"),
  industry: z.string().optional(),
  timezone: z.string().optional(),
  address: z.string().min(3, "Address is required"),
  taxId: z.string().min(3, "Tax ID is required"),
  billingEmail: z.string().email("Enter a valid billing email").optional(),
})

export type CompanyProfileFormValues = z.infer<typeof companyProfileSchema>

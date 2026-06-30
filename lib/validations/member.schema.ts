import { z } from "zod"

export const memberInviteSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["admin", "manager", "viewer"]),
})

export type MemberInviteFormValues = z.infer<typeof memberInviteSchema>

export const memberAddSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["admin", "manager", "viewer"]),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export type MemberAddFormValues = z.infer<typeof memberAddSchema>

export const memberRoleSchema = z.object({
  role: z.enum(["admin", "manager", "viewer"]),
})

export type MemberRoleFormValues = z.infer<typeof memberRoleSchema>

export const acceptInviteSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export type AcceptInviteFormValues = z.infer<typeof acceptInviteSchema>

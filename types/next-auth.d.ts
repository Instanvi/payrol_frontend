import type { Company, Role } from "@/lib/types"
import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    accessToken?: string
    company?: Company
    user: {
      id: string
      role: Role
      isSystemAdmin?: boolean
    } & DefaultSession["user"]
  }

  interface User {
    accessToken: string
    role: Role
    company: Company
    isSystemAdmin?: boolean
    rememberMe?: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    role?: Role
    company?: Company
    isSystemAdmin?: boolean
  }
}

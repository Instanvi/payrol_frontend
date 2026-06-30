import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { CredentialsSignin } from "next-auth"

import { getAuthApiBaseUrl } from "@/lib/auth/api-base-url"
import type { Company, Session, User } from "@/lib/types"

class VerificationFailedError extends CredentialsSignin {
  code = "INVALID_2FA"
}

interface Verify2FAResponse {
  accessToken: string
  session: Session
}

const SESSION_REMEMBER_MAX_AGE = 30 * 24 * 60 * 60
const SESSION_DEFAULT_MAX_AGE = 24 * 60 * 60

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        challengeToken: { label: "Challenge token", type: "text" },
        code: { label: "Verification code", type: "text" },
        rememberMe: { label: "Remember me", type: "text" },
      },
      async authorize(credentials) {
        const challengeToken = credentials?.challengeToken
        const code = credentials?.code
        const rememberMe = credentials?.rememberMe === "true"

        if (!challengeToken || !code) {
          return null
        }

        const response = await fetch(`${getAuthApiBaseUrl()}/auth/verify-2fa`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ challengeToken, code }),
        })

        if (!response.ok) {
          const error = (await response.json().catch(() => null)) as
            | { message?: string; code?: string }
            | null

          if (error?.code === "SESSION_EXPIRED") {
            throw new CredentialsSignin("Session expired. Please log in again.")
          }

          throw new VerificationFailedError(
            error?.message ?? "Invalid verification code"
          )
        }

        const data = (await response.json()) as Verify2FAResponse
        const { user, company } = data.session

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.avatar ?? null,
          accessToken: data.accessToken,
          role: user.role,
          isSystemAdmin: user.isSystemAdmin,
          company,
          rememberMe,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken
        token.role = user.role
        token.company = user.company
        token.isSystemAdmin = user.isSystemAdmin

        const maxAge = user.rememberMe
          ? SESSION_REMEMBER_MAX_AGE
          : SESSION_DEFAULT_MAX_AGE
        token.exp = Math.floor(Date.now() / 1000) + maxAge
      }
      return token
    },
    session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub
      }

      session.user.role = token.role as User["role"]
      session.user.isSystemAdmin = token.isSystemAdmin as boolean | undefined
      session.accessToken = token.accessToken as string | undefined
      session.company = token.company as Company | undefined

      return session
    },
  },
})

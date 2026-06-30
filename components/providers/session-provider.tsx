"use client"

import * as React from "react"
import {
  SessionProvider as NextAuthSessionProvider,
  signOut,
  useSession as useNextAuthSession,
} from "next-auth/react"

import { hasPermission } from "@/lib/permissions"
import type { Permission, Session } from "@/lib/types"

interface SessionContextValue {
  session: Session | null
  isLoading: boolean
  logout: () => void
  can: (permission: Permission) => boolean
}

const SessionContext = React.createContext<SessionContextValue | null>(null)

function toAppSession(
  nextAuthSession: ReturnType<typeof useNextAuthSession>["data"]
): Session | null {
  if (!nextAuthSession?.user?.id || !nextAuthSession.company) {
    return null
  }

  return {
    user: {
      id: nextAuthSession.user.id,
      name: nextAuthSession.user.name ?? "",
      email: nextAuthSession.user.email ?? "",
      avatar: nextAuthSession.user.image ?? undefined,
      role: nextAuthSession.user.role,
      isSystemAdmin: nextAuthSession.user.isSystemAdmin,
    },
    company: nextAuthSession.company,
  }
}

function SessionBridge({ children }: { children: React.ReactNode }) {
  const { data, status } = useNextAuthSession()

  const session = React.useMemo(() => toAppSession(data), [data])

  const logout = React.useCallback(() => {
    void signOut({ callbackUrl: "/login" })
  }, [])

  const can = React.useCallback(
    (permission: Permission) => {
      if (!session) return false
      return hasPermission(session.user.role, permission)
    },
    [session]
  )

  const value = React.useMemo(
    () => ({
      session,
      isLoading: status === "loading",
      logout,
      can,
    }),
    [session, status, logout, can]
  )

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  )
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider>
      <SessionBridge>{children}</SessionBridge>
    </NextAuthSessionProvider>
  )
}

export function useSession() {
  const context = React.useContext(SessionContext)
  if (!context) {
    throw new Error("useSession must be used within SessionProvider")
  }
  return context
}

export function usePermissions() {
  const { session, can } = useSession()
  return {
    role: session?.user.role ?? null,
    can,
  }
}

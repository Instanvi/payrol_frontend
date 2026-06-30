"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { useSession } from "@/components/providers/session-provider"
import { Skeleton } from "@/components/ui/skeleton"

export function SystemAdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { session, isLoading } = useSession()

  React.useEffect(() => {
    if (!isLoading && session && !session.user.isSystemAdmin) {
      router.replace("/dashboard")
    }
  }, [isLoading, session, router])

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!session?.user.isSystemAdmin) {
    return null
  }

  return <>{children}</>
}

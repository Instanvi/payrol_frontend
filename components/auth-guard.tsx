"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { useSession } from "@/components/providers/session-provider"
import { Skeleton } from "@/components/ui/skeleton"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { session, isLoading } = useSession()

  React.useEffect(() => {
    if (!isLoading && !session) {
      router.replace("/login")
    }
  }, [isLoading, session, router])

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return <>{children}</>
}

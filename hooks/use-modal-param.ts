"use client"

import { useCallback } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

export function useModalParam(param = "modal") {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const value = searchParams.get(param)
  const id = searchParams.get("id")

  const open = useCallback(
    (modal: string, entityId?: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(param, modal)
      if (entityId) {
        params.set("id", entityId)
      } else {
        params.delete("id")
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [router, pathname, searchParams, param]
  )

  const close = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete(param)
    params.delete("id")
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }, [router, pathname, searchParams, param])

  const isOpen = useCallback(
    (modal: string, entityId?: string) => {
      if (value !== modal) return false
      if (entityId !== undefined) return id === entityId
      return true
    },
    [value, id]
  )

  return { value, id, open, close, isOpen }
}

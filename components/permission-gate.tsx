"use client"

import { usePermissions } from "@/components/providers/session-provider"
import type { Permission } from "@/lib/types"

interface PermissionGateProps {
  permission: Permission
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function PermissionGate({
  permission,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { can } = usePermissions()

  if (!can(permission)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

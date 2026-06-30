import type { Permission, Role } from "@/lib/types"

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: [
    "employees:read",
    "employees:write",
    "employees:import",
    "payments:read",
    "payments:write",
    "members:read",
    "members:write",
  ],
  admin: [
    "employees:read",
    "employees:write",
    "employees:import",
    "payments:read",
    "payments:write",
    "members:read",
    "members:write",
  ],
  manager: [
    "employees:read",
    "employees:write",
    "employees:import",
    "payments:read",
    "payments:write",
    "members:read",
  ],
  viewer: [
    "employees:read",
    "payments:read",
    "members:read",
  ],
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  admin: "Admin",
  manager: "Manager",
  viewer: "Viewer",
}

export const ASSIGNABLE_ROLES: Role[] = ["admin", "manager", "viewer"]

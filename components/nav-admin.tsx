"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Building2Icon, PercentIcon } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { adminService } from "@/lib/services/admin.service"

export function NavAdmin() {
  const pathname = usePathname()

  const { data: stats } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => adminService.getStats(),
    refetchInterval: 60_000,
  })

  const pending = stats?.pendingReviews ?? 0

  const links = [
    {
      title: "Company reviews",
      href: "/dashboard/admin",
      icon: <Building2Icon />,
      active:
        pathname === "/dashboard/admin" ||
        pathname.startsWith("/dashboard/admin/companies"),
      badge: pending > 0 ? pending : undefined,
    },
    {
      title: "Charges",
      href: "/dashboard/admin/fees",
      icon: <PercentIcon />,
      active: pathname.startsWith("/dashboard/admin/fees"),
    },
  ]

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform admin</SidebarGroupLabel>
      <SidebarMenu>
        {links.map((item) => (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton asChild isActive={item.active} tooltip={item.title}>
              <Link href={item.href}>
                {item.icon}
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
            {item.badge != null && (
              <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
            )}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}

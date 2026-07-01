"use client"

import * as React from "react"
import { Suspense } from "react"

import { NavMain } from "@/components/nav-main"
import { NavAdmin } from "@/components/nav-admin"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import { useSession } from "@/components/providers/session-provider"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  GalleryVerticalEndIcon,
  LayoutDashboardIcon,
  UsersIcon,
  ArrowLeftRightIcon,
  BanknoteIcon,
  UserCogIcon,
  ScrollTextIcon,
  FolderKanbanIcon,
} from "lucide-react"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { session } = useSession()

  const teams = session?.company
    ? [
        {
          name: session.company.name,
          logo: <GalleryVerticalEndIcon />,
          plan: session.company.plan,
        },
      ]
    : []

  const navMain = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Employees",
      href: "/dashboard/employees",
      icon: <UsersIcon />,
    },
    {
      title: "Projects",
      href: "/dashboard/projects",
      icon: <FolderKanbanIcon />,
    },
    {
      title: "Pay runs",
      href: "/dashboard/payments",
      icon: <BanknoteIcon />,
    },
    {
      title: "Transactions",
      href: "/dashboard/transactions",
      icon: <ArrowLeftRightIcon />,
    },
    {
      title: "Payment logs",
      href: "/dashboard/payment-logs",
      icon: <ScrollTextIcon />,
    },
    {
      title: "Members",
      href: "/dashboard/members",
      icon: <UserCogIcon />,
    },
  ]

  const user = session?.user ?? {
    name: "Guest",
    email: "guest@example.com",
    avatar: "",
  }

  return (
    <Sidebar collapsible="icon" className="border-r-0" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <Suspense>
          <NavMain items={navMain} />
        </Suspense>
        {session?.user.isSystemAdmin && (
          <Suspense>
            <NavAdmin />
          </Suspense>
        )}
      </SidebarContent>
      <SidebarFooter>
        <Suspense>
          <NavUser user={user} />
        </Suspense>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

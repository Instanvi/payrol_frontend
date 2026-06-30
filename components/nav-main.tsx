"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useModalParam } from "@/hooks/use-modal-param"

export type NavItem = {
  title: string
  href: string
  icon?: React.ReactNode
  modal?: string
}

function isLinkActive(href: string, pathname: string, modal: string | null) {
  const [path, query] = href.split("?")
  if (pathname !== path) return false
  if (!query) return !modal
  const params = new URLSearchParams(query)
  return params.get("modal") === modal
}

export function NavMain({ items }: { items: NavItem[] }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const modalParam = useModalParam()
  const activeModal = searchParams.get("modal")

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Payroll</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isActive = item.modal
            ? activeModal === item.modal
            : isLinkActive(item.href, pathname, activeModal)

          if (item.modal) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={isActive}
                  onClick={() => modalParam.open(item.modal!)}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          }

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={isActive}
              >
                <Link href={item.href}>
                  {item.icon}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

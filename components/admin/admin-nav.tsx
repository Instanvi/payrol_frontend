"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Building2Icon, PercentIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const ADMIN_LINKS = [
  {
    href: "/dashboard/admin",
    label: "Company reviews",
    icon: Building2Icon,
    match: (path: string) =>
      path === "/dashboard/admin" || path.startsWith("/dashboard/admin/companies"),
  },
  {
    href: "/dashboard/admin/fees",
    label: "Fee plans",
    icon: PercentIcon,
    match: (path: string) => path.startsWith("/dashboard/admin/fees"),
  },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-wrap gap-2 border-b pb-4">
      {ADMIN_LINKS.map((link) => {
        const Icon = link.icon
        const active = link.match(pathname)

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}

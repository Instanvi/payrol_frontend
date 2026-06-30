import { SystemAdminGuard } from "@/components/system-admin-guard"
import { AdminNav } from "@/components/admin/admin-nav"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SystemAdminGuard>
      <div className="flex flex-1 flex-col gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">System admin</h1>
          <p className="text-sm text-muted-foreground">
            Review company KYC, approve accounts, and configure per-transaction
            platform fees
          </p>
        </div>
        <AdminNav />
        {children}
      </div>
    </SystemAdminGuard>
  )
}

"use client"

import { useSession } from "@/components/providers/session-provider"
import { ROLE_LABELS } from "@/lib/permissions"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function SettingsContent() {
  const { session } = useSession()

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-base font-medium">Company</h3>
          <p className="text-sm text-muted-foreground">
            Your organization details
          </p>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company-name">Company name</Label>
            <Input
              id="company-name"
              value={session?.company.name ?? ""}
              readOnly
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-plan">Plan</Label>
            <Input
              id="company-plan"
              value={session?.company.plan ?? ""}
              readOnly
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-base font-medium">Account</h3>
          <p className="text-sm text-muted-foreground">
            Your personal account information
          </p>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user-name">Name</Label>
            <Input id="user-name" value={session?.user.name ?? ""} readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-email">Email</Label>
            <Input id="user-email" value={session?.user.email ?? ""} readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-role">Role</Label>
            <Input
              id="user-role"
              value={
                session?.user.role ? ROLE_LABELS[session.user.role] : ""
              }
              readOnly
            />
          </div>
        </div>
      </section>
    </div>
  )
}

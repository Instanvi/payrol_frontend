"use client"

import * as React from "react"
import { toast } from "sonner"

import { useSession } from "@/components/providers/session-provider"
import { ROLE_LABELS } from "@/lib/permissions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  useRemoveInstanviIntegrationMutation,
  useSaveInstanviIntegrationMutation,
  useTestInstanviIntegrationMutation,
} from "@/hooks/mutations/use-integration-mutations"
import { useInstanviIntegrationQuery } from "@/hooks/queries/use-companies-query"

export function SettingsContent() {
  const { session } = useSession()
  const canManageIntegrations =
    session?.user.role === "owner" || session?.user.role === "admin"
  const { data: instanvi, isLoading: instanviLoading } =
    useInstanviIntegrationQuery()
  const saveInstanvi = useSaveInstanviIntegrationMutation()
  const testInstanvi = useTestInstanviIntegrationMutation()
  const removeInstanvi = useRemoveInstanviIntegrationMutation()

  const [apiKey, setApiKey] = React.useState("")
  const [locationId, setLocationId] = React.useState("")

  React.useEffect(() => {
    if (instanvi?.locationId) {
      setLocationId(instanvi.locationId)
    }
  }, [instanvi?.locationId])

  async function handleSaveKeys(event: React.FormEvent) {
    event.preventDefault()
    if (!apiKey.trim()) {
      toast.error("Enter your Instanvi API key")
      return
    }

    await saveInstanvi.mutateAsync({
      apiKey: apiKey.trim(),
      locationId: locationId.trim() || undefined,
    })
    setApiKey("")
  }

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
          <h3 className="text-base font-medium">Integrations</h3>
          <p className="text-sm text-muted-foreground">
            Connect payment providers for your company
          </p>
        </div>

        <div className="space-y-4 rounded-lg bg-muted/30 p-4">
          <div className="space-y-1">
            <h4 className="text-sm font-medium">Instanvi</h4>
            <p className="text-sm text-muted-foreground">
              Mobile money payments use your company&apos;s Instanvi API key
              (format: <code className="text-xs">app_…</code>).
            </p>
            {instanviLoading ? (
              <p className="text-sm text-muted-foreground">Loading status...</p>
            ) : instanvi?.connected ? (
              <p className="text-sm font-medium text-emerald-700">
                Connected {instanvi.apiKeyLast4 ?? ""}
              </p>
            ) : instanvi?.usingEnvFallback ? (
              <p className="text-sm font-medium text-emerald-700">
                Using platform Instanvi key (save your own key to override)
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Not connected</p>
            )}
          </div>

          {canManageIntegrations ? (
            <form className="space-y-4" onSubmit={(e) => void handleSaveKeys(e)}>
              <div className="space-y-2">
                <Label htmlFor="instanvi-api-key">API key</Label>
                <Input
                  id="instanvi-api-key"
                  type="password"
                  autoComplete="off"
                  placeholder={
                    instanvi?.connected
                      ? "Enter a new key to replace the saved key"
                      : "app_c05a083dc1850605a3b587e0ea0ac47ef0eda26bc7182198"
                  }
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instanvi-location-id">
                  Location ID (optional)
                </Label>
                <Input
                  id="instanvi-location-id"
                  placeholder="x-location-id header value"
                  value={locationId}
                  onChange={(event) => setLocationId(event.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={saveInstanvi.isPending}
                >
                  {saveInstanvi.isPending ? "Saving..." : "Save keys"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={
                    (!instanvi?.connected && !instanvi?.usingEnvFallback) ||
                    testInstanvi.isPending
                  }
                  onClick={() => void testInstanvi.mutateAsync()}
                >
                  {testInstanvi.isPending ? "Testing..." : "Test connection"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!instanvi?.connected || removeInstanvi.isPending}
                  onClick={() => void removeInstanvi.mutateAsync()}
                >
                  {removeInstanvi.isPending ? "Removing..." : "Remove keys"}
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">
              Only owners and admins can manage Instanvi keys.
            </p>
          )}
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

"use client"

import * as React from "react"

import { useSession } from "@/components/providers/session-provider"
import { Button } from "@/components/ui/button"
import { useInstanviIntegrationQuery } from "@/hooks/queries/use-companies-query"
import { useModalParam } from "@/hooks/use-modal-param"

interface InstanviConnectionGateProps {
  children: React.ReactNode
}

export function InstanviConnectionGate({ children }: InstanviConnectionGateProps) {
  const modal = useModalParam()
  const { session } = useSession()
  const { data, isLoading } = useInstanviIntegrationQuery()

  const connected =
    data?.connected ?? session?.company.instanviConnected ?? false

  if (isLoading && session?.company.instanviConnected === undefined) {
    return (
      <div className="rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">
        Checking Instanvi connection...
      </div>
    )
  }

  if (connected) {
    return <>{children}</>
  }

  return (
    <div className="rounded-lg bg-muted/40 p-4 text-sm">
      <p className="font-medium">Instanvi not linked</p>
      <p className="mt-1 text-muted-foreground">
        Link your Instanvi account in Settings to enable mobile money payments.
      </p>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="mt-3"
        onClick={() => modal.open("settings")}
      >
        Open Settings
      </Button>
    </div>
  )
}

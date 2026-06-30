"use client"

import { Suspense } from "react"

import { SettingsContent } from "@/components/settings-content"
import { FullPageModal } from "@/components/ui/full-page-modal"
import { useModalParam } from "@/hooks/use-modal-param"

function DashboardGlobalModalsContent() {
  const modal = useModalParam()

  return (
    <FullPageModal
      open={modal.isOpen("settings")}
      onOpenChange={(open) => !open && modal.close()}
      title="Settings"
    >
      <SettingsContent />
    </FullPageModal>
  )
}

export function DashboardGlobalModals() {
  return (
    <Suspense>
      <DashboardGlobalModalsContent />
    </Suspense>
  )
}

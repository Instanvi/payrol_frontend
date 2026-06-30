"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { useSession } from "@/components/providers/session-provider"
import { Button } from "@/components/ui/button"

interface CompanyApprovalGateProps {
  children: React.ReactNode
  action?: string
}

export function CompanyApprovalGate({
  children,
  action = "create or process payments",
}: CompanyApprovalGateProps) {
  const router = useRouter()
  const { session } = useSession()
  const company = session?.company

  if (!company || company.status === "approved") {
    return <>{children}</>
  }

  const statusMessage =
    company.status === "pending_review"
      ? "Your company KYC is under review. Payments unlock after a platform admin approves your company."
      : company.status === "rejected"
        ? `Onboarding was rejected: ${company.rejectionReason ?? "Please update your documents and resubmit."}`
        : company.status === "suspended"
          ? "Your company account is suspended. Contact platform support."
          : "Submit your company KYC to unlock payments."

  return (
    <div className="rounded-lg bg-muted/40 p-4 text-sm">
      <p className="font-medium">Payments locked</p>
      <p className="mt-1 text-muted-foreground">
        You cannot {action} until your company is approved. {statusMessage}
      </p>
      {company.status !== "suspended" && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-3"
          onClick={() => router.push("/onboarding")}
        >
          Continue onboarding
        </Button>
      )}
    </div>
  )
}

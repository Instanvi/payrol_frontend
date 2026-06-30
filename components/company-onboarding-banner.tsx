"use client"

import Link from "next/link"
import { AlertCircleIcon } from "lucide-react"

import { useSession } from "@/components/providers/session-provider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export function CompanyOnboardingBanner() {
  const { session } = useSession()
  const company = session?.company

  if (!company || company.status === "approved" || company.status === "suspended") {
    return null
  }

  const message =
    company.status === "pending_review"
      ? "Company KYC is under review. You can keep adding employees — payments unlock after approval."
      : company.status === "rejected"
        ? "Company KYC needs updates before payments can run."
        : "Complete company KYC once to unlock payments. Employees and payroll setup are available now."

  return (
    <Alert className="border-blue-200 bg-blue-50 text-blue-950 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-50">
      <AlertCircleIcon className="h-4 w-4" />
      <AlertTitle>Company verification</AlertTitle>
      <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm">{message}</span>
        <Button asChild size="sm" variant="outline">
          <Link href="/onboarding">
            {company.status === "pending_review" ? "View status" : "Complete KYC"}
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  )
}

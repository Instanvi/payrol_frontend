"use client"

import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { Employee, MobileCarrier } from "@/lib/types"

const CARRIER_LABEL: Record<MobileCarrier, string> = {
  mtn: "MTN",
  orange: "Orange",
  nexttel: "Nexttel",
  camtel: "Camtel",
  unknown: "Unknown",
}

export function MobileCarrierBadge({ carrier }: { carrier?: MobileCarrier }) {
  if (!carrier || carrier === "unknown") {
    return (
      <Badge variant="outline" className="font-normal">
        Unknown
      </Badge>
    )
  }

  const variant =
    carrier === "mtn"
      ? "default"
      : carrier === "orange"
        ? "secondary"
        : "outline"

  return (
    <Badge variant={variant} className="font-normal">
      {CARRIER_LABEL[carrier]}
    </Badge>
  )
}

interface EmployeeMobileAccountBadgeProps {
  employee: Pick<
    Employee,
    | "accountChecked"
    | "mobileAccountValid"
    | "mobileAccountValidationError"
    | "mobileCarrier"
    | "mobileAccountValidatedAt"
  >
  showCarrier?: boolean
}

export function EmployeeMobileAccountBadge({
  employee,
  showCarrier = false,
}: EmployeeMobileAccountBadgeProps) {
  const checked = employee.accountChecked ?? employee.mobileAccountValid != null

  let badge: React.ReactNode
  if (!checked) {
    badge = (
      <Badge variant="outline" className="font-normal">
        Not checked
      </Badge>
    )
  } else if (employee.mobileAccountValid) {
    badge = (
      <Badge variant="default" className="font-normal">
        Valid
      </Badge>
    )
  } else {
    badge = (
      <Badge variant="destructive" className="font-normal">
        Invalid
      </Badge>
    )
  }

  const tooltipParts: string[] = []
  if (employee.mobileCarrier) {
    tooltipParts.push(`Carrier: ${CARRIER_LABEL[employee.mobileCarrier]}`)
  }
  if (employee.mobileAccountValidatedAt) {
    tooltipParts.push(
      `Checked: ${new Date(employee.mobileAccountValidatedAt).toLocaleString()}`
    )
  }
  if (employee.mobileAccountValidationError) {
    tooltipParts.push(employee.mobileAccountValidationError)
  }

  const content = (
    <div className="flex flex-wrap items-center gap-1.5">
      {badge}
      {showCarrier && employee.mobileCarrier && (
        <MobileCarrierBadge carrier={employee.mobileCarrier} />
      )}
    </div>
  )

  if (tooltipParts.length === 0) return content

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex cursor-default">{content}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs whitespace-pre-wrap">{tooltipParts.join("\n")}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

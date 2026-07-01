"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { KycDocumentList } from "@/components/admin/kyc-document-list"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { adminService } from "@/lib/services/admin.service"
import type { CompanyStatus, KycDocumentType } from "@/lib/types"
import { ApiError } from "@/lib/types"
import { formatDisplayDate } from "@/lib/date-utils"

const KYC_LABELS: Record<KycDocumentType, string> = {
  business_registration: "Business registration",
  tax_certificate: "Tax certificate",
  director_id: "Director / owner ID",
  bank_statement: "Bank statement",
  other: "Other",
}

const REVIEWABLE_STATUSES: CompanyStatus[] = [
  "draft",
  "pending_review",
  "rejected",
]

function CompanyStatusBadge({ status }: { status?: CompanyStatus }) {
  const variant =
    status === "approved"
      ? "default"
      : status === "pending_review"
        ? "secondary"
        : status === "rejected"
          ? "destructive"
          : "outline"

  return <Badge variant={variant}>{status ?? "unknown"}</Badge>
}

export function CompanyReviewPanel({
  companyId,
  onReviewComplete,
}: {
  companyId: string
  onReviewComplete?: () => void
}) {
  const queryClient = useQueryClient()
  const [rejectReason, setRejectReason] = React.useState("")
  const [selectedChargeId, setSelectedChargeId] = React.useState("")
  const [previewAmount, setPreviewAmount] = React.useState("10000")
  const [forceApprove, setForceApprove] = React.useState(false)

  const chargesQuery = useQuery({
    queryKey: ["admin", "charges"],
    queryFn: () => adminService.listCharges(),
  })

  const detailQuery = useQuery({
    queryKey: ["admin", "company", companyId],
    queryFn: () => adminService.getCompanyDetail(companyId),
  })

  const chargePreviewQuery = useQuery({
    queryKey: ["admin", "charge-preview", companyId, previewAmount],
    queryFn: () =>
      adminService.previewCharge(companyId, Number(previewAmount) || 0),
  })

  const approveMutation = useMutation({
    mutationFn: () =>
      adminService.approveCompany(
        companyId,
        selectedChargeId || undefined,
        forceApprove
      ),
    onSuccess: () => {
      toast.success("Company validated and approved")
      setForceApprove(false)
      void queryClient.invalidateQueries({ queryKey: ["admin"] })
      onReviewComplete?.()
    },
    onError: (e) =>
      toast.error(e instanceof ApiError ? e.message : "Validation failed"),
  })

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => adminService.rejectCompany(companyId, reason),
    onSuccess: () => {
      toast.success("Company rejected")
      setRejectReason("")
      void queryClient.invalidateQueries({ queryKey: ["admin"] })
      onReviewComplete?.()
    },
    onError: (e) =>
      toast.error(e instanceof ApiError ? e.message : "Rejection failed"),
  })

  const charges = chargesQuery.data ?? []
  const detail = detailQuery.data

  React.useEffect(() => {
    if (!selectedChargeId && charges.length > 0) {
      const defaultCharge = charges.find((c) => c.isDefault) ?? charges[0]
      setSelectedChargeId(defaultCharge?.id ?? "")
    }
  }, [charges, selectedChargeId])

  if (detailQuery.isLoading) {
    return <Skeleton className="h-40 w-full" />
  }

  if (!detail) {
    return (
      <p className="text-sm text-muted-foreground">Company details unavailable.</p>
    )
  }

  const canValidate =
    detail.company.status !== undefined &&
    REVIEWABLE_STATUSES.includes(detail.company.status)

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold">{detail.company.name}</h2>
          <CompanyStatusBadge status={detail.company.status} />
        </div>
        <p className="text-sm text-muted-foreground">
          Review company profile, owners, and KYC documents before validating the
          account.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <InfoField label="Legal name" value={detail.company.legalName} />
        <InfoField label="Tax ID" value={detail.company.taxId} />
        <InfoField label="Industry" value={detail.company.industry} />
        <InfoField label="Billing email" value={detail.company.billingEmail} />
        <InfoField label="Plan" value={detail.company.plan} />
        <InfoField
          label="Approved at"
          value={formatDisplayDate(detail.company.approvedAt)}
        />
        <InfoField
          label="Instanvi"
          value={
            detail.company.instanviConnected
              ? `Connected${detail.company.instanviLocationId ? ` (${detail.company.instanviLocationId})` : ""}`
              : "Not connected"
          }
        />
        <InfoField
          label="Address"
          value={detail.company.address}
          className="sm:col-span-2"
        />
      </div>

      {detail.owners.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-sm font-medium">Company owners</h3>
          <ul className="space-y-2 text-sm">
            {detail.owners.map((owner) => (
              <li key={owner.id} className="bg-muted/30 p-3">
                <p className="font-medium">{owner.name}</p>
                <p className="text-muted-foreground">{owner.email}</p>
                {owner.phone && (
                  <p className="text-muted-foreground">{owner.phone}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-2">
        <h3 className="text-sm font-medium">KYC checklist</h3>
        <ul className="space-y-1 text-sm">
          {(
            [
              "business_registration",
              "tax_certificate",
              "director_id",
              "bank_statement",
              "other",
            ] as KycDocumentType[]
          ).map((type) => {
            const uploaded = detail.uploadedDocumentTypes?.includes(type)
            const missing = detail.missingDocuments?.includes(type)
            return (
              <li key={type} className="flex items-center gap-2">
                <Badge
                  variant={
                    uploaded ? "default" : missing ? "destructive" : "outline"
                  }
                >
                  {uploaded ? "Uploaded" : missing ? "Missing" : "Optional"}
                </Badge>
                <span>{KYC_LABELS[type]}</span>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-medium">KYC documents</h3>
        <KycDocumentList documents={detail.documents} />
      </section>

      {detail.reviewEvents.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-sm font-medium">Review timeline</h3>
          <ul className="space-y-2 text-sm">
            {detail.reviewEvents.map((event) => (
              <li key={event.id} className="bg-muted/30 p-2">
                <p className="font-medium capitalize">{event.action}</p>
                {event.reason && (
                  <p className="text-muted-foreground">{event.reason}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {new Date(event.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-4 border-t pt-4">
        <div>
          <h3 className="text-sm font-medium">Platform charge</h3>
          <p className="text-sm text-muted-foreground">
            Assign the transaction fee plan before validating this company.
          </p>
        </div>

        <div className="flex flex-nowrap items-end gap-3 overflow-x-auto pb-1">
          <div className="min-w-[14rem] shrink-0 space-y-2">
            <Label>Charge for this company</Label>
            <Select value={selectedChargeId} onValueChange={setSelectedChargeId}>
              <SelectTrigger className="w-full min-w-[14rem]">
                <SelectValue placeholder="Select charge" />
              </SelectTrigger>
              <SelectContent>
                {charges.map((charge) => (
                  <SelectItem key={charge.id} value={charge.id}>
                    {charge.name} — {charge.fixedFee} + {charge.percentFee}%
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[10rem] shrink-0 space-y-2">
            <Label>Charge preview (sample disbursement)</Label>
            <Input
              type="number"
              className="w-full min-w-[10rem]"
              value={previewAmount}
              onChange={(e) => setPreviewAmount(e.target.value)}
            />
          </div>

          {chargePreviewQuery.data && (
            <p className="shrink-0 pb-2 text-sm whitespace-nowrap text-muted-foreground">
              Platform cut:{" "}
              <strong>
                {chargePreviewQuery.data.totalFee}{" "}
                {chargePreviewQuery.data.currency}
              </strong>{" "}
              on {chargePreviewQuery.data.transactionAmount}{" "}
              {chargePreviewQuery.data.currency}
            </p>
          )}
        </div>
      </section>

      {canValidate ? (
        <section className="space-y-4 border-t pt-4">
          <div>
            <h3 className="text-sm font-medium">Validate company</h3>
            <p className="text-sm text-muted-foreground">
              Approve to enable payroll payments, or reject with a reason.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id={`force-approve-${companyId}`}
              checked={forceApprove}
              onCheckedChange={(checked) => setForceApprove(checked === true)}
            />
            <Label htmlFor={`force-approve-${companyId}`}>
              Validate despite incomplete KYC
            </Label>
          </div>

          <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1">
            <Button
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
              className="shrink-0"
            >
              {approveMutation.isPending ? "Validating..." : "Validate & approve"}
            </Button>
            <Input
              className="min-w-[12rem] shrink-0"
              placeholder="Rejection reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <Button
              variant="destructive"
              className="shrink-0"
              disabled={rejectReason.length < 5 || rejectMutation.isPending}
              onClick={() => rejectMutation.mutate(rejectReason)}
            >
              Reject
            </Button>
          </div>
        </section>
      ) : (
        <p className="text-sm text-muted-foreground">
          This company has already been reviewed. Status:{" "}
          <CompanyStatusBadge status={detail.company.status} />
        </p>
      )}
    </div>
  )
}

function InfoField({
  label,
  value,
  className,
}: {
  label: string
  value?: string | null
  className?: string
}) {
  return (
    <div className={`bg-muted/30 p-3 text-sm ${className ?? ""}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value?.trim() ? value : "—"}</p>
    </div>
  )
}

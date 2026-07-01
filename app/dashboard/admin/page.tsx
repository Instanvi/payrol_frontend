"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { KycDocumentList } from "@/components/admin/kyc-document-list"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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

export default function AdminCompaniesPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = React.useState<
    CompanyStatus | "all"
  >("pending_review")
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [rejectReason, setRejectReason] = React.useState("")
  const [selectedChargeId, setSelectedChargeId] = React.useState<string>("")
  const [previewAmount, setPreviewAmount] = React.useState("10000")
  const [forceApprove, setForceApprove] = React.useState(false)

  const companiesQuery = useQuery({
    queryKey: ["admin", "companies", statusFilter],
    queryFn: () =>
      adminService.listCompanies(
        statusFilter === "all" ? undefined : statusFilter
      ),
  })

  const chargesQuery = useQuery({
    queryKey: ["admin", "charges"],
    queryFn: () => adminService.listCharges(),
  })

  const detailQuery = useQuery({
    queryKey: ["admin", "company", selectedId],
    queryFn: () => adminService.getCompanyDetail(selectedId!),
    enabled: Boolean(selectedId),
  })

  const chargePreviewQuery = useQuery({
    queryKey: ["admin", "charge-preview", selectedId, previewAmount],
    queryFn: () =>
      adminService.previewCharge(selectedId!, Number(previewAmount) || 0),
    enabled: Boolean(selectedId),
  })

  const approveMutation = useMutation({
    mutationFn: (companyId: string) =>
      adminService.approveCompany(
        companyId,
        selectedChargeId || undefined,
        forceApprove
      ),
    onSuccess: () => {
      toast.success("Company approved — payments enabled with assigned charge")
      setForceApprove(false)
      void queryClient.invalidateQueries({ queryKey: ["admin"] })
    },
    onError: (e) =>
      toast.error(e instanceof ApiError ? e.message : "Approval failed"),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ companyId, reason }: { companyId: string; reason: string }) =>
      adminService.rejectCompany(companyId, reason),
    onSuccess: () => {
      toast.success("Company rejected")
      setRejectReason("")
      void queryClient.invalidateQueries({ queryKey: ["admin"] })
    },
    onError: (e) =>
      toast.error(e instanceof ApiError ? e.message : "Rejection failed"),
  })

  const companies = companiesQuery.data ?? []
  const charges = chargesQuery.data ?? []
  const detail = detailQuery.data

  React.useEffect(() => {
    if (!selectedChargeId && charges.length > 0) {
      const defaultCharge = charges.find((c) => c.isDefault) ?? charges[0]
      setSelectedChargeId(defaultCharge?.id ?? "")
    }
  }, [charges, selectedChargeId])

  const canReview =
    detail?.company.status &&
    REVIEWABLE_STATUSES.includes(detail.company.status)

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Companies</CardTitle>
          <CardDescription>
            Review KYC documents and company owners before enabling payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as CompanyStatus | "all")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending_review">Pending review</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>

          {companiesQuery.isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : companies.length === 0 ? (
            <p className="text-sm text-muted-foreground">No companies found.</p>
          ) : (
            <ul className="space-y-2">
              {companies.map((company) => (
                <li key={company.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(company.id)}
                    className={`flex w-full items-center justify-between rounded-xl bg-card p-3 text-left transition hover:bg-muted/50 ${
                      selectedId === company.id ? "border-primary" : ""
                    }`}
                  >
                    <div>
                      <p className="font-medium">{company.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {company.legalName ?? "—"}
                      </p>
                      {company.owners && company.owners.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Owner: {company.owners[0]?.name} (
                          {company.owners[0]?.email})
                        </p>
                      )}
                    </div>
                    <CompanyStatusBadge status={company.status} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Review detail</CardTitle>
          <CardDescription>
            View KYC files, owners, assign charges, then approve or reject
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selectedId ? (
            <p className="text-sm text-muted-foreground">
              Select a company to review documents and set charges.
            </p>
          ) : detailQuery.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : detail ? (
            <>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Legal name:</span>{" "}
                  {detail.company.legalName ?? "—"}
                </p>
                <p>
                  <span className="text-muted-foreground">Tax ID:</span>{" "}
                  {detail.company.taxId ?? "—"}
                </p>
                <p>
                  <span className="text-muted-foreground">Address:</span>{" "}
                  {detail.company.address ?? "—"}
                </p>
                <p>
                  <span className="text-muted-foreground">Status:</span>{" "}
                  <CompanyStatusBadge status={detail.company.status} />
                </p>
              </div>

              {detail.owners.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium">Owners</p>
                  <ul className="space-y-2 text-sm">
                    {detail.owners.map((owner) => (
                      <li
                        key={owner.id}
                        className="bg-muted/30 p-2"
                      >
                        <p className="font-medium">{owner.name}</p>
                        <p className="text-muted-foreground">{owner.email}</p>
                        {owner.phone && (
                          <p className="text-muted-foreground">{owner.phone}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <p className="mb-2 text-sm font-medium">KYC checklist</p>
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
                    const uploaded =
                      detail.uploadedDocumentTypes?.includes(type)
                    const missing = detail.missingDocuments?.includes(type)
                    return (
                      <li key={type} className="flex items-center gap-2">
                        <Badge
                          variant={
                            uploaded
                              ? "default"
                              : missing
                                ? "destructive"
                                : "outline"
                          }
                        >
                          {uploaded ? "Uploaded" : missing ? "Missing" : "Optional"}
                        </Badge>
                        <span>{KYC_LABELS[type]}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">KYC documents</p>
                {detail.documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No documents uploaded yet.
                  </p>
                ) : (
                  <KycDocumentList documents={detail.documents} />
                )}
              </div>

              {detail.reviewEvents.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium">Review timeline</p>
                  <ul className="space-y-2 text-sm">
                    {detail.reviewEvents.map((event) => (
                      <li
                        key={event.id}
                        className="bg-muted/30 p-2"
                      >
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
                </div>
              )}

              <div className="space-y-2">
                <Label>Charge for this company</Label>
                <Select
                  value={selectedChargeId}
                  onValueChange={setSelectedChargeId}
                >
                  <SelectTrigger>
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

              <div className="space-y-2">
                <Label>Charge preview (sample disbursement)</Label>
                <Input
                  type="number"
                  value={previewAmount}
                  onChange={(e) => setPreviewAmount(e.target.value)}
                />
                {chargePreviewQuery.data && (
                  <p className="text-sm text-muted-foreground">
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

              {canReview && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="force-approve"
                      checked={forceApprove}
                      onCheckedChange={(checked) =>
                        setForceApprove(checked === true)
                      }
                    />
                    <Label htmlFor="force-approve">
                      Approve despite incomplete KYC
                    </Label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => approveMutation.mutate(detail.company.id)}
                      disabled={approveMutation.isPending}
                    >
                      Approve company
                    </Button>
                    <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                      <Input
                        placeholder="Rejection reason"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                      />
                      <Button
                        variant="destructive"
                        disabled={
                          rejectReason.length < 5 || rejectMutation.isPending
                        }
                        onClick={() =>
                          rejectMutation.mutate({
                            companyId: detail.company.id,
                            reason: rejectReason,
                          })
                        }
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

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

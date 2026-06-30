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
import type { CompanyStatus } from "@/lib/types"
import { ApiError } from "@/lib/types"

export default function AdminCompaniesPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = React.useState<
    CompanyStatus | "all"
  >("pending_review")
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [rejectReason, setRejectReason] = React.useState("")
  const [selectedChargeId, setSelectedChargeId] = React.useState<string>("")
  const [previewAmount, setPreviewAmount] = React.useState("10000")

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
      adminService.approveCompany(companyId, selectedChargeId || undefined),
    onSuccess: () => {
      toast.success("Company approved — payments enabled with assigned charge")
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

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Companies</CardTitle>
          <CardDescription>
            Review KYC documents uploaded via Cloudinary before enabling payments
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
            View KYC files, assign charges, then approve or reject
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
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">KYC documents</p>
                <KycDocumentList documents={detail.documents} />
              </div>

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

              {detail.company.status === "pending_review" && (
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

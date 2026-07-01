"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"

import { CompanyReviewPanel } from "@/components/admin/company-review-panel"
import { DataTable } from "@/components/data-table/data-table"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FullPageModal } from "@/components/ui/full-page-modal"
import { Skeleton } from "@/components/ui/skeleton"
import { adminService } from "@/lib/services/admin.service"
import type { CompanyStatus, CompanyWithOwners } from "@/lib/types"

export default function AdminCompaniesPage() {
  const [statusFilter, setStatusFilter] = React.useState<
    CompanyStatus | "all"
  >("pending_review")
  const [selectedId, setSelectedId] = React.useState<string | null>(null)

  const companiesQuery = useQuery({
    queryKey: ["admin", "companies", statusFilter],
    queryFn: () =>
      adminService.listCompanies(
        statusFilter === "all" ? undefined : statusFilter
      ),
  })

  const companies = companiesQuery.data ?? []
  const selectedCompany = companies.find((c) => c.id === selectedId)

  const columns = React.useMemo(
    () => createCompanyColumns(setSelectedId),
    []
  )

  return (
    <div className="space-y-4">
      <PageHeader
        title="Company reviews"
        description="Review company profiles, owners, and KYC before validating accounts"
      />

      {companiesQuery.isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <DataTable
          columns={columns}
          data={companies}
          searchKey="name"
          searchPlaceholder="Search companies..."
          enableRowSelection={false}
          emptyMessage="No companies found for this filter."
          toolbar={
            <>
              <Select
                value={statusFilter}
                onValueChange={(v) =>
                  setStatusFilter(v as CompanyStatus | "all")
                }
              >
                <SelectTrigger className="w-[11rem] shrink-0">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All companies</SelectItem>
                  <SelectItem value="pending_review">Pending review</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <span className="ml-auto shrink-0 text-sm whitespace-nowrap text-muted-foreground">
                {companies.length} compan{companies.length === 1 ? "y" : "ies"}
              </span>
            </>
          }
        />
      )}

      <FullPageModal
        open={!!selectedId}
        onOpenChange={(open) => !open && setSelectedId(null)}
        title={selectedCompany?.name ?? "Company review"}
        contentClassName="max-w-3xl"
      >
        {selectedId && (
          <CompanyReviewPanel
            companyId={selectedId}
            onReviewComplete={() => setSelectedId(null)}
          />
        )}
      </FullPageModal>
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

function createCompanyColumns(
  onReview: (id: string) => void
): ColumnDef<CompanyWithOwners>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Company" />
      ),
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="font-medium">{row.original.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {row.original.legalName ?? "No legal name"}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "industry",
      header: "Industry",
      cell: ({ row }) => row.original.industry ?? "—",
    },
    {
      accessorKey: "billingEmail",
      header: "Billing email",
      cell: ({ row }) => (
        <span className="truncate">{row.original.billingEmail ?? "—"}</span>
      ),
    },
    {
      id: "owner",
      header: "Owner",
      cell: ({ row }) => {
        const owner = row.original.owners?.[0]
        if (!owner) return "—"
        return (
          <div className="min-w-0">
            <p className="font-medium">{owner.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {owner.email}
            </p>
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <CompanyStatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onReview(row.original.id)}
        >
          Review
        </Button>
      ),
    },
  ]
}

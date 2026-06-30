"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Building2Icon, CheckCircle2Icon, FileUpIcon } from "lucide-react"

import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { companiesService } from "@/lib/services/companies.service"
import type { CompanyStatus, KycDocumentType } from "@/lib/types"
import {
  companyProfileSchema,
  type CompanyProfileFormValues,
} from "@/lib/validations/auth.schema"
import { ApiError } from "@/lib/types"

const KYC_LABELS: Record<KycDocumentType, string> = {
  business_registration: "Business registration certificate",
  tax_certificate: "Tax certificate",
  director_id: "Director / owner ID",
  bank_statement: "Bank statement (optional)",
  other: "Other supporting document",
}

const REQUIRED_DOCS: KycDocumentType[] = [
  "business_registration",
  "tax_certificate",
  "director_id",
]

const KYC_STATUS_LABELS: Record<string, string> = {
  draft: "Not started",
  profile: "Profile in progress",
  kyc: "Documents required",
  submitted: "Submitted for review",
  pending_review: "Under admin review",
  rejected: "Needs updates",
  approved: "Approved",
}

function profileIsComplete(company: {
  legalName?: string
  taxId?: string
  address?: string
}) {
  return Boolean(company.legalName && company.taxId && company.address)
}

function getKycStatusLabel(company: {
  status?: CompanyStatus
  onboardingStep?: string
  rejectionReason?: string
}) {
  if (company.status === "pending_review") return KYC_STATUS_LABELS.pending_review
  if (company.status === "rejected") return KYC_STATUS_LABELS.rejected
  if (company.status === "approved") return KYC_STATUS_LABELS.approved
  if (company.onboardingStep === "submitted") return KYC_STATUS_LABELS.submitted
  if (company.onboardingStep === "kyc") return KYC_STATUS_LABELS.kyc
  if (company.onboardingStep === "profile") return KYC_STATUS_LABELS.profile
  return KYC_STATUS_LABELS.draft
}

export default function OnboardingPage() {
  return (
    <AuthGuard>
      <OnboardingContent />
    </AuthGuard>
  )
}

function OnboardingContent() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [step, setStep] = React.useState<1 | 2>(1)

  const { data, isLoading } = useQuery({
    queryKey: ["onboarding"],
    queryFn: () => companiesService.getOnboardingStatus(),
  })

  const profileForm = useForm<CompanyProfileFormValues>({
    resolver: zodResolver(companyProfileSchema),
    values: data
      ? {
          name: data.company.name,
          legalName: data.company.legalName ?? "",
          industry: data.company.industry ?? "",
          timezone: data.company.timezone ?? "Africa/Douala",
          address: data.company.address ?? "",
          taxId: data.company.taxId ?? "",
          billingEmail: data.company.billingEmail ?? "",
        }
      : undefined,
  })

  const saveProfile = useMutation({
    mutationFn: (values: CompanyProfileFormValues) =>
      companiesService.updateProfile(values),
    onSuccess: () => {
      toast.success("Company profile saved")
      void queryClient.invalidateQueries({ queryKey: ["onboarding"] })
      setStep(2)
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Failed to save profile"
      )
    },
  })

  const uploadDoc = useMutation({
    mutationFn: companiesService.uploadKycDocument,
    onSuccess: () => {
      toast.success("Document uploaded")
      void queryClient.invalidateQueries({ queryKey: ["onboarding"] })
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Failed to upload document"
      )
    },
  })

  const submitKyc = useMutation({
    mutationFn: () => companiesService.submitKyc(),
    onSuccess: () => {
      toast.success("KYC submitted for review")
      void queryClient.invalidateQueries({ queryKey: ["onboarding"] })
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Failed to submit KYC"
      )
    },
  })

  React.useEffect(() => {
    if (data?.company.status === "approved") {
      router.replace("/dashboard")
    }
  }, [data, router])

  React.useEffect(() => {
    if (data && profileIsComplete(data.company)) {
      setStep(2)
    }
  }, [data])

  if (isLoading || !data) {
    return (
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-4 p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  const { company, documents, missingDocuments, canSubmitKyc } = data
  const kycStatus = getKycStatusLabel(company)
  const isPendingReview = company.status === "pending_review"

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-4 p-4 sm:gap-6 sm:p-6">
      <header className="space-y-1 border-b pb-4">
        <div className="flex items-center gap-2">
          <Building2Icon className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold">Company onboarding</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Step {isPendingReview ? 2 : step} of 2
          {!isPendingReview && (step === 1 ? " — Company profile" : " — KYC documents")}
        </p>
        <p className="text-sm">
          <span className="text-muted-foreground">KYC status: </span>
          <span className="font-medium">{kycStatus}</span>
          {company.status === "rejected" && company.rejectionReason && (
            <span className="mt-1 block text-muted-foreground">
              {company.rejectionReason}
            </span>
          )}
        </p>
      </header>

      {isPendingReview ? (
        <Card>
          <CardHeader>
            <CardTitle>Under review</CardTitle>
            <CardDescription>
              Your KYC package was submitted. A platform admin will approve your
              company before payments are enabled. You can continue managing
              employees and payroll setup in the meantime.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : step === 1 ? (
        <Card>
          <CardHeader>
            <CardTitle>Company profile</CardTitle>
            <CardDescription>
              Legal details required for compliance review
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...profileForm}>
              <form
                onSubmit={profileForm.handleSubmit((values) =>
                  saveProfile.mutate(values)
                )}
                className="grid gap-4 sm:grid-cols-2"
              >
                <FormField
                  control={profileForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="legalName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Legal name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="taxId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax ID</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="billingEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Billing email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Business address</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-center sm:col-span-2">
                  <Button
                    type="submit"
                    className="min-w-40"
                    disabled={saveProfile.isPending}
                  >
                    {saveProfile.isPending ? "Saving..." : "Next"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>KYC documents</CardTitle>
            <CardDescription>
              Upload PDF or image files (max 5MB). Required: business
              registration, tax certificate, and director ID.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {REQUIRED_DOCS.map((docType) => (
              <KycUploadRow
                key={docType}
                docType={docType}
                uploaded={documents.find((d) => d.documentType === docType)}
                disabled={uploadDoc.isPending}
                onUpload={(file) =>
                  uploadDoc.mutate({ documentType: docType, file })
                }
              />
            ))}
            {missingDocuments.length > 0 && (
              <p className="text-center text-sm text-muted-foreground">
                Missing: {missingDocuments.map((t) => KYC_LABELS[t]).join(", ")}
              </p>
            )}
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                className="min-w-40"
                onClick={() => submitKyc.mutate()}
                disabled={!canSubmitKyc || submitKyc.isPending}
              >
                {submitKyc.isPending ? "Submitting..." : "Submit for review"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function KycUploadRow({
  docType,
  uploaded,
  disabled,
  onUpload,
}: {
  docType: KycDocumentType
  uploaded?: { fileName: string; fileUrl?: string }
  disabled: boolean
  onUpload: (file: File) => void
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
      <div className="flex items-center gap-2">
        {uploaded ? (
          <CheckCircle2Icon className="h-4 w-4 text-primary" />
        ) : (
          <FileUpIcon className="h-4 w-4 text-muted-foreground" />
        )}
        <div>
          <p className="text-sm font-medium">{KYC_LABELS[docType]}</p>
          {uploaded && (
            <p className="text-xs text-muted-foreground">{uploaded.fileName}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {uploaded?.fileUrl && (
          <Button asChild size="sm" variant="ghost">
            <a href={uploaded.fileUrl} target="_blank" rel="noopener noreferrer">
              View
            </a>
          </Button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onUpload(file)
            e.target.value = ""
          }}
        />
        <Button
          type="button"
          size="sm"
          variant={uploaded ? "outline" : "default"}
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          {uploaded ? "Replace" : "Upload"}
        </Button>
      </div>
    </div>
  )
}

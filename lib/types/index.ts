export type Role = "owner" | "admin" | "manager" | "viewer"

export type Permission =
  | "employees:read"
  | "employees:write"
  | "employees:import"
  | "payments:read"
  | "payments:write"
  | "members:read"
  | "members:write"

export type EmployeeStatus = "active" | "inactive"

export type MobileCarrier =
  | "mtn"
  | "orange"
  | "nexttel"
  | "camtel"
  | "unknown"

export interface Employee {
  id: string
  name: string
  email: string
  phone?: string
  department?: string
  status: EmployeeStatus
  createdAt: string
  mobileCarrier?: MobileCarrier
  mobileAccountValid?: boolean | null
  mobileAccountValidatedAt?: string
  mobileAccountValidationError?: string
  accountChecked?: boolean
}

export interface EmployeeAccountValidation {
  employeeId: string
  name: string
  phone: string | null
  carrier: MobileCarrier | null
  accountValid: boolean | null
  mobileEligible: boolean
  validatedAt: string | null
  error: string | null
}

export interface BulkAccountValidationResult {
  summary: {
    total: number
    valid: number
    invalid: number
    mtn: number
    orange: number
    mobileEligible: number
  }
  results: EmployeeAccountValidation[]
}

export interface MobilePayRunLine {
  transactionId: string
  employeeId: string
  employeeName: string
  amount: number
  currency: string
  transactionStatus: string
  phone: string | null
  carrier: MobileCarrier
  valid: boolean
  mobileEligible: boolean
  accountChecked: boolean
  mobileAccountValid: boolean | null
  error?: string
}

export interface MobilePayRunValidation {
  payRunId: string
  reference: string
  payPeriod: string
  status: PaymentStatus
  summary: {
    total: number
    pending: number
    mtn: number
    orange: number
    other: number
    invalid: number
    unchecked: number
    accountValid: number
    mobileEligible: number
    totalMobileAmount: number
  }
  lines: MobilePayRunLine[]
}

export interface BulkDisburseResult {
  status: "queued"
  payRunId: string
  idempotencyKey: string
  currency: string
  totalAmount: number
  totalPlatformFees?: number
  totalDebit?: number
  queuedCount: number
  skippedCount: number
  selectedCount?: number
  queued: Array<{
    transactionId: string
    employeeName: string
    jobId: string
    amount: number
  }>
  skipped: Array<{
    transactionId: string
    employeeName: string
    reason: string
  }>
  validation: {
    mtn: number
    orange: number
    invalid: number
  }
}

export type PaymentStatus = "draft" | "pending" | "completed" | "failed"

export type TransactionStatus = "pending" | "processing" | "completed" | "failed"

export type PaymentLogLevel = "debug" | "info" | "warn" | "error"

export interface PaymentLog {
  id: string
  level: PaymentLogLevel
  event: string
  message: string
  metadata?: Record<string, unknown>
  mobilePaymentTransactionId?: string
  jobId?: string
  createdAt: string
}

export interface PaymentBatch {
  id: string
  reference: string
  payPeriod: string
  amount: number
  currency: string
  employeeCount: number
  employeeIds: string[]
  status: PaymentStatus
  scheduledAt?: string
  platformFeeAmount?: number
  platformChargeId?: string
  createdAt: string
}

/** Individual mobile money payment to one employee within a pay run */
export interface PayrollTransaction {
  id: string
  payRunId: string
  payRunReference: string
  payPeriod: string
  employeeId: string
  employeeName: string
  employeeEmail: string
  grossAmount: number
  deductions: number
  amount: number
  currency: string
  employeePhone?: string
  reference: string
  status: TransactionStatus
  failureReason?: string
  paidAt?: string
  createdAt: string
  updatedAt: string
}

export type MemberStatus = "active" | "invited"

export interface CompanyMember {
  id: string
  name: string
  email: string
  role: Role
  status: MemberStatus
}

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: Role
  isSystemAdmin?: boolean
}

export type CompanyStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected"
  | "suspended"

export type CompanyOnboardingStep = "profile" | "kyc" | "submitted" | "complete"

export type KycDocumentType =
  | "business_registration"
  | "tax_certificate"
  | "director_id"
  | "bank_statement"
  | "other"

export interface Company {
  id: string
  name: string
  plan: string
  legalName?: string
  industry?: string
  timezone?: string
  address?: string
  taxId?: string
  billingEmail?: string
  status?: CompanyStatus
  onboardingStep?: CompanyOnboardingStep
  rejectionReason?: string
  approvedAt?: string
  chargeId?: string
}

export interface KycDocument {
  id: string
  documentType: KycDocumentType
  fileName: string
  mimeType: string
  fileUrl?: string
  createdAt: string
}

export interface OnboardingStatus {
  company: Company
  documents: KycDocument[]
  missingDocuments: KycDocumentType[]
  canSubmitKyc: boolean
  canMakePayments: boolean
}

export interface Charge {
  id: string
  name: string
  description?: string | null
  isDefault: boolean
  fixedFee: number
  percentFee: number
  minFee?: number | null
  maxFee?: number | null
  currency: string
  active: boolean
}

export interface ChargeBreakdown {
  chargeId: string
  chargeName: string
  currency: string
  transactionAmount: number
  fixedFee: number
  percentFee: number
  percentAmount: number
  totalFee: number
}

export interface AdminCompanyDetail {
  company: Company
  documents: Array<KycDocument & { storageKey?: string }>
  reviewEvents: Array<{
    id: string
    action: string
    reason?: string | null
    createdAt: string
  }>
}

export interface Session {
  user: User
  company: Company
}

export interface ServiceError {
  message: string
  code?: string
}

export class ApiError extends Error {
  code?: string

  constructor(message: string, code?: string) {
    super(message)
    this.name = "ApiError"
    this.code = code
  }
}

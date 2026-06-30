import { api } from "@/lib/api/axios"
import type {
  Company,
  KycDocument,
  KycDocumentType,
  OnboardingStatus,
} from "@/lib/types"
import type { CompanyProfileFormValues } from "@/lib/validations/auth.schema"

export const companiesService = {
  getMyCompany() {
    return api.get<Company>("/companies/me").then((res) => res.data)
  },

  updateProfile(data: CompanyProfileFormValues) {
    return api.patch<Company>("/companies/me", data).then((res) => res.data)
  },

  getOnboardingStatus() {
    return api
      .get<OnboardingStatus>("/companies/me/onboarding")
      .then((res) => res.data)
  },

  listKycDocuments() {
    return api
      .get<KycDocument[]>("/companies/me/kyc/documents")
      .then((res) => res.data)
  },

  async uploadKycDocument(input: {
    documentType: KycDocumentType
    file: File
  }) {
    const contentBase64 = await fileToBase64(input.file)
    return api
      .post<KycDocument>("/companies/me/kyc/documents", {
        documentType: input.documentType,
        fileName: input.file.name,
        mimeType: input.file.type || "application/octet-stream",
        contentBase64,
      })
      .then((res) => res.data)
  },

  submitKyc() {
    return api
      .post<OnboardingStatus>("/companies/me/kyc/submit")
      .then((res) => res.data)
  },
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== "string") {
        reject(new Error("Failed to read file"))
        return
      }
      const base64 = result.includes(",") ? result.split(",")[1]! : result
      resolve(base64)
    }
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"))
    reader.readAsDataURL(file)
  })
}

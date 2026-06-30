"use client"

import { ExternalLinkIcon, FileTextIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { KycDocument, KycDocumentType } from "@/lib/types"

const DOC_LABELS: Record<KycDocumentType, string> = {
  business_registration: "Business registration",
  tax_certificate: "Tax certificate",
  director_id: "Director ID",
  bank_statement: "Bank statement",
  other: "Other",
}

export function KycDocumentList({
  documents,
  emptyMessage = "No documents uploaded yet.",
}: {
  documents: KycDocument[]
  emptyMessage?: string
}) {
  if (documents.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>
  }

  return (
    <ul className="space-y-2">
      {documents.map((doc) => (
        <li
          key={doc.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-card p-3"
        >
          <div className="flex min-w-0 items-start gap-2">
            <FileTextIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {DOC_LABELS[doc.documentType] ?? doc.documentType}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {doc.fileName}
              </p>
            </div>
          </div>
          {doc.fileUrl ? (
            <Button asChild size="sm" variant="outline">
              <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                View
                <ExternalLinkIcon className="ml-1 h-3.5 w-3.5" />
              </a>
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">No preview</span>
          )}
        </li>
      ))}
    </ul>
  )
}

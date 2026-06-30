"use client"

import * as React from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { parseCsv } from "@/lib/services/employees.service"
import type { CsvEmployeeRow } from "@/lib/validations/employee.schema"
import { csvEmployeeRowSchema } from "@/lib/validations/employee.schema"
import { TriangleAlertIcon } from "lucide-react"

interface ParsedRow {
  row: number
  data: Record<string, string>
  errors: string[]
}

export function EmployeeImportForm({
  onImport,
  onCancel,
  isImporting = false,
}: {
  onImport: (rows: CsvEmployeeRow[]) => Promise<void>
  onCancel?: () => void
  isImporting?: boolean
}) {
  const [file, setFile] = React.useState<File | null>(null)
  const [parsedRows, setParsedRows] = React.useState<ParsedRow[]>([])

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0]
    if (!selected) return

    setFile(selected)
    const text = await selected.text()
    const { rows } = parseCsv(text)

    const validated: ParsedRow[] = rows.map((row, index) => {
      const mapped = {
        name: row.name ?? row["full name"] ?? "",
        email: row.email ?? "",
        phone: row.phone ?? row.momo ?? row["mobile money"] ?? "",
        department: row.department ?? "",
      }

      const result = csvEmployeeRowSchema.safeParse(mapped)
      return {
        row: index + 2,
        data: mapped,
        errors: result.success
          ? []
          : result.error.issues.map((i) => i.message),
      }
    })

    setParsedRows(validated)
  }

  const validRows = parsedRows.filter((r) => r.errors.length === 0)
  const invalidRows = parsedRows.filter((r) => r.errors.length > 0)
  const previewRows = parsedRows.slice(0, 5)

  async function handleImport() {
    if (validRows.length === 0) return
    await onImport(
      validRows.map((r) => ({
        name: r.data.name,
        email: r.data.email,
        phone: r.data.phone,
        department: r.data.department || undefined,
      }))
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="csv-file" className="text-sm font-medium">
          CSV file
        </label>
        <Input
          id="csv-file"
          type="file"
          accept=".csv"
          onChange={handleFileChange}
        />
        <p className="text-sm text-muted-foreground">
          Expected columns: name, email, phone (mobile money), department
        </p>
      </div>

      {invalidRows.length > 0 && (
        <Alert variant="destructive">
          <TriangleAlertIcon className="size-4" />
          <AlertTitle>Validation errors</AlertTitle>
          <AlertDescription>
            {invalidRows.length} row(s) have errors and will be skipped.
            {invalidRows.slice(0, 3).map((r) => (
              <span key={r.row} className="mt-1 block text-xs">
                Row {r.row}: {r.errors.join(", ")}
              </span>
            ))}
          </AlertDescription>
        </Alert>
      )}

      {previewRows.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">
            Preview ({parsedRows.length} rows, showing first 5)
          </h3>
          <div className="overflow-hidden rounded-xl bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewRows.map((row) => (
                  <TableRow key={row.row}>
                    <TableCell>{row.data.name}</TableCell>
                    <TableCell>{row.data.email}</TableCell>
                    <TableCell>{row.data.department || "—"}</TableCell>
                    <TableCell>
                      {row.errors.length > 0 ? (
                        <span className="text-destructive text-xs">Invalid</span>
                      ) : (
                        <span className="text-xs text-green-600">Valid</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          onClick={handleImport}
          disabled={!file || validRows.length === 0 || isImporting}
        >
          {isImporting
            ? "Importing..."
            : `Import ${validRows.length} employee(s)`}
        </Button>
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  )
}

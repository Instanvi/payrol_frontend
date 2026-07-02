export interface CsvColumn<T> {
  header: string
  value: (row: T) => string | number | null | undefined
}

function escapeCsvCell(value: string) {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function buildCsv<T>(rows: T[], columns: CsvColumn<T>[]) {
  const header = columns.map((col) => escapeCsvCell(col.header)).join(",")
  const lines = rows.map((row) =>
    columns
      .map((col) => {
        const raw = col.value(row)
        const text =
          raw === null || raw === undefined || raw === "" ? "" : String(raw)
        return escapeCsvCell(text)
      })
      .join(",")
  )
  return [header, ...lines].join("\n")
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

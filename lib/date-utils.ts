import { format } from "date-fns"

export function formatDisplayDate(value?: string | Date | null) {
  if (!value) return "—"
  const date = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return "—"
  return format(date, "MMM d, yyyy")
}

export function formatPayPeriodLabel(from: Date, to: Date) {
  if (format(from, "yyyy-MM") === format(to, "yyyy-MM")) {
    return `${format(from, "MMM d")} – ${format(to, "d, yyyy")}`
  }
  return `${format(from, "MMM d, yyyy")} – ${format(to, "MMM d, yyyy")}`
}

export function toApiDateString(value?: Date) {
  return value ? format(value, "yyyy-MM-dd") : undefined
}

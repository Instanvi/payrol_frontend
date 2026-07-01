export function getAuthApiBaseUrl() {
  const baseURL =
    process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL
  if (!baseURL) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not set. Point it at the payment-backend API (e.g. http://localhost:4000/api)."
    )
  }
  return baseURL.replace(/\/$/, "")
}

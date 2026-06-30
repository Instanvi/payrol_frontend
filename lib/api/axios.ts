import axios, { type AxiosError } from "axios"
import { getSession } from "next-auth/react"

import type { ApiErrorResponse } from "@/lib/api/types"
import { ApiError } from "@/lib/types"

function getApiBaseUrl() {
  const baseURL = process.env.NEXT_PUBLIC_API_URL
  if (!baseURL) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not set. Point it at the payment-backend API (e.g. http://localhost:4000/api)."
    )
  }
  return baseURL.replace(/\/$/, "")
}

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15_000,
})

api.interceptors.request.use(async (config) => {
  if (typeof window !== "undefined") {
    const session = await getSession()
    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`
    }
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    const message =
      error.response?.data?.message ??
      error.message ??
      "An unexpected error occurred"
    const code = error.response?.data?.code
    throw new ApiError(message, code)
  }
)

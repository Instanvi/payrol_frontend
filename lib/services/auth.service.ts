import { api } from "@/lib/api/axios"
import type { User } from "@/lib/types"
import { ApiError } from "@/lib/types"

const CHALLENGE_TOKEN_KEY = "pending_auth_challenge"
const REMEMBER_ME_KEY = "pending_auth_remember_me"
const REMEMBERED_EMAIL_KEY = "auth_remembered_email"
const REMEMBER_ME_PREF_KEY = "auth_remember_me"

interface LoginResponse {
  requires2FA: true
  challengeToken: string
}

export const authService = {
  async register(input: {
    name: string
    email: string
    password: string
    companyName: string
  }): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>("/auth/register", input)

    if (typeof window !== "undefined") {
      sessionStorage.setItem(CHALLENGE_TOKEN_KEY, data.challengeToken)
    }

    return data
  },

  async login(
    email: string,
    password: string,
    rememberMe = false
  ): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>("/auth/login", {
      email,
      password,
    })

    if (typeof window !== "undefined") {
      sessionStorage.setItem(CHALLENGE_TOKEN_KEY, data.challengeToken)
      sessionStorage.setItem(REMEMBER_ME_KEY, rememberMe ? "1" : "0")

      if (rememberMe) {
        localStorage.setItem(REMEMBERED_EMAIL_KEY, email)
        localStorage.setItem(REMEMBER_ME_PREF_KEY, "1")
      } else {
        localStorage.removeItem(REMEMBERED_EMAIL_KEY)
        localStorage.removeItem(REMEMBER_ME_PREF_KEY)
      }
    }

    return data
  },

  async resend2FA(): Promise<void> {
    const challengeToken =
      typeof window !== "undefined"
        ? sessionStorage.getItem(CHALLENGE_TOKEN_KEY)
        : null

    if (!challengeToken) {
      throw new ApiError("Session expired. Please log in again.", "SESSION_EXPIRED")
    }

    await api.post("/auth/resend-2fa", { challengeToken })
  },

  getChallengeToken(): string | null {
    if (typeof window === "undefined") return null
    return sessionStorage.getItem(CHALLENGE_TOKEN_KEY)
  },

  clearChallengeToken(): void {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(CHALLENGE_TOKEN_KEY)
      sessionStorage.removeItem(REMEMBER_ME_KEY)
    }
  },

  hasPendingChallenge(): boolean {
    return Boolean(this.getChallengeToken())
  },

  getRememberMe(): boolean {
    if (typeof window === "undefined") return false
    return sessionStorage.getItem(REMEMBER_ME_KEY) === "1"
  },

  getRememberedEmail(): string | null {
    if (typeof window === "undefined") return null
    return localStorage.getItem(REMEMBERED_EMAIL_KEY)
  },

  getRememberMePreference(): boolean {
    if (typeof window === "undefined") return false
    return localStorage.getItem(REMEMBER_ME_PREF_KEY) === "1"
  },

  async acceptInvite(input: {
    token: string
    password: string
    name?: string
  }): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>("/auth/invites/accept", input)

    if (typeof window !== "undefined") {
      sessionStorage.setItem(CHALLENGE_TOKEN_KEY, data.challengeToken)
    }

    return data
  },
}

export function getUserInitials(user: Pick<User, "name">): string {
  return user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

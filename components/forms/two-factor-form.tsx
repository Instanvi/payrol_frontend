"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { getSession, signIn } from "next-auth/react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { authService } from "@/lib/services/auth.service"
import {
  twoFactorSchema,
  type TwoFactorFormValues,
} from "@/lib/validations/auth.schema"

export function TwoFactorForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isResending, setIsResending] = React.useState(false)
  const isVerifyingRef = React.useRef(false)
  const hasVerifiedRef = React.useRef(false)

  const form = useForm<TwoFactorFormValues>({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: { code: "" },
  })

  React.useEffect(() => {
    if (!hasVerifiedRef.current && !authService.hasPendingChallenge()) {
      router.replace("/login")
    }
  }, [router])

  const onSubmit = React.useCallback(
    async (values: TwoFactorFormValues) => {
      if (isVerifyingRef.current || hasVerifiedRef.current) {
        return
      }

      const challengeToken = authService.getChallengeToken()
      if (!challengeToken) {
        if (!hasVerifiedRef.current) {
          toast.error("Session expired. Please log in again.")
          router.replace("/login")
        }
        return
      }

      isVerifyingRef.current = true
      setIsSubmitting(true)

      try {
        const result = await signIn("credentials", {
          challengeToken,
          code: values.code,
          rememberMe: authService.getRememberMe() ? "true" : "false",
          redirect: false,
        })

        if (result?.error) {
          toast.error(
            result.error.includes("Session expired")
              ? "Session expired. Please log in again."
              : "Invalid verification code"
          )
          if (result.error.includes("Session expired")) {
            authService.clearChallengeToken()
            router.replace("/login")
          }
          form.setValue("code", "")
          return
        }

        hasVerifiedRef.current = true
        authService.clearChallengeToken()
        await getSession()
        toast.success("Welcome back!")
        router.replace("/dashboard")
      } catch {
        toast.error("Verification failed. Please try again.")
        form.setValue("code", "")
      } finally {
        isVerifyingRef.current = false
        if (!hasVerifiedRef.current) {
          setIsSubmitting(false)
        }
      }
    },
    [form, router]
  )

  async function handleResend() {
    setIsResending(true)
    try {
      await authService.resend2FA()
      toast.success("A new code has been sent to your email.")
    } catch {
      toast.error("Failed to resend code.")
    } finally {
      setIsResending(false)
    }
  }

  const code = form.watch("code")

  React.useEffect(() => {
    if (
      code.length === 6 &&
      !isVerifyingRef.current &&
      !hasVerifiedRef.current
    ) {
      void form.handleSubmit(onSubmit)()
    }
  }, [code, form, onSubmit])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem className="flex flex-col items-center">
              <FormLabel>Verification code</FormLabel>
              <FormControl>
                <InputOTP maxLength={6} {...field}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Verifying..." : "Verify"}
        </Button>
        <div className="flex flex-col items-center gap-2 text-sm">
          <Button
            type="button"
            variant="link"
            className="h-auto p-0"
            disabled={isResending}
            onClick={handleResend}
          >
            {isResending ? "Sending..." : "Resend code"}
          </Button>
          <Link
            href="/login"
            className="text-muted-foreground hover:text-foreground"
          >
            Back to login
          </Link>
        </div>
      </form>
    </Form>
  )
}

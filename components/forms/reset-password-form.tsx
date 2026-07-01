"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
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
import { PasswordInput } from "@/components/ui/password-input"
import { Skeleton } from "@/components/ui/skeleton"
import { authService } from "@/lib/services/auth.service"
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "@/lib/validations/auth.schema"
import { ApiError } from "@/lib/types"

interface ResetPasswordFormProps {
  token: string
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter()
  const [isLoadingPreview, setIsLoadingPreview] = React.useState(true)
  const [previewError, setPreviewError] = React.useState<string | null>(null)
  const [email, setEmail] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  React.useEffect(() => {
    let cancelled = false

    async function loadPreview() {
      setIsLoadingPreview(true)
      setPreviewError(null)

      try {
        const preview = await authService.getResetPreview(token)
        if (cancelled) return
        setEmail(preview.email)
      } catch (error) {
        if (cancelled) return
        setPreviewError(
          error instanceof ApiError
            ? error.message
            : "This password reset link is invalid or has expired."
        )
      } finally {
        if (!cancelled) {
          setIsLoadingPreview(false)
        }
      }
    }

    void loadPreview()

    return () => {
      cancelled = true
    }
  }, [token])

  async function onSubmit(values: ResetPasswordFormValues) {
    setIsSubmitting(true)
    try {
      await authService.resetPassword({
        token,
        password: values.password,
      })
      toast.success("Password updated. You can sign in now.")
      router.push("/login")
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Could not reset password. Please try again."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoadingPreview) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    )
  }

  if (previewError) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted-foreground">{previewError}</p>
        <Button type="button" variant="outline" onClick={() => router.push("/forgot-password")}>
          Request a new link
        </Button>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Choose a new password for <strong>{email}</strong>.
        </p>
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New password</FormLabel>
              <FormControl>
                <PasswordInput
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm password</FormLabel>
              <FormControl>
                <PasswordInput
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Updating..." : "Update password"}
        </Button>
      </form>
    </Form>
  )
}

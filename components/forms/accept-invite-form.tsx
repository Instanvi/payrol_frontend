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
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Skeleton } from "@/components/ui/skeleton"
import { authService } from "@/lib/services/auth.service"
import { membersService } from "@/lib/services/members.service"
import { ROLE_LABELS } from "@/lib/permissions"
import {
  acceptInviteSchema,
  type AcceptInviteFormValues,
} from "@/lib/validations/member.schema"
import { ApiError } from "@/lib/types"

interface AcceptInviteFormProps {
  token: string
}

export function AcceptInviteForm({ token }: AcceptInviteFormProps) {
  const router = useRouter()
  const [isLoadingPreview, setIsLoadingPreview] = React.useState(true)
  const [previewError, setPreviewError] = React.useState<string | null>(null)
  const [companyName, setCompanyName] = React.useState("")
  const [role, setRole] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<AcceptInviteFormValues>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: {
      name: "",
      password: "",
    },
  })

  React.useEffect(() => {
    let cancelled = false

    async function loadPreview() {
      setIsLoadingPreview(true)
      setPreviewError(null)

      try {
        const preview = await membersService.getInvitePreview(token)
        if (cancelled) return

        setCompanyName(preview.companyName)
        setRole(ROLE_LABELS[preview.role] ?? preview.role)
        form.setValue("name", preview.name)
      } catch (error) {
        if (cancelled) return
        setPreviewError(
          error instanceof ApiError
            ? error.message
            : "This invitation is invalid or has expired."
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
  }, [form, token])

  async function onSubmit(values: AcceptInviteFormValues) {
    setIsSubmitting(true)
    try {
      await authService.acceptInvite({
        token,
        password: values.password,
        name: values.name,
      })
      toast.success("Account ready. Check your email for the sign-in code.")
      router.push("/login/verify")
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Could not accept invitation. Please try again."
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
        <Button type="button" variant="outline" onClick={() => router.push("/login")}>
          Back to sign in
        </Button>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          You&apos;ve been invited to join <strong>{companyName}</strong> as{" "}
          <strong>{role}</strong>. Set your password to continue.
        </p>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your name</FormLabel>
              <FormControl>
                <Input placeholder="Jane Doe" autoComplete="name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
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
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Setting up account..." : "Accept invitation"}
        </Button>
      </form>
    </Form>
  )
}

import { ResetPasswordForm } from "@/components/forms/reset-password-form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  if (!token) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            Invalid reset link
          </CardTitle>
          <CardDescription>
            This password reset link is missing a token. Request a new one from
            the forgot password page.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-semibold tracking-tight">
          Reset password
        </CardTitle>
        <CardDescription>
          Choose a new password for your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm token={token} />
      </CardContent>
    </Card>
  )
}

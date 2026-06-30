import { TwoFactorForm } from "@/components/forms/two-factor-form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function VerifyPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-semibold tracking-tight">
          Check your email
        </CardTitle>
        <CardDescription>
          Enter the 6-digit code we sent to your inbox
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TwoFactorForm />
      </CardContent>
    </Card>
  )
}

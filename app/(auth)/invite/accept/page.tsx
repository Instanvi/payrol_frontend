import { AcceptInviteForm } from "@/components/forms/accept-invite-form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default async function AcceptInvitePage({
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
            Invalid invitation
          </CardTitle>
          <CardDescription>
            This invitation link is missing a token. Ask your admin to resend the
            invite.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-semibold tracking-tight">
          Join your team
        </CardTitle>
        <CardDescription>
          Accept your invitation to access the company payroll workspace
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AcceptInviteForm token={token} />
      </CardContent>
    </Card>
  )
}

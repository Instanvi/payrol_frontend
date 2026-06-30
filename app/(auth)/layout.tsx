import { AuthBackground } from "@/components/auth-background"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-full flex-1 items-center justify-center overflow-hidden p-4 sm:p-6">
      <AuthBackground />
      <div className="relative z-10 w-full max-w-lg">{children}</div>
    </div>
  )
}

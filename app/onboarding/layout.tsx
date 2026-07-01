import { AuthBackground } from "@/components/auth-background"

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <AuthBackground />
      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 lg:py-10">
        {children}
      </div>
    </div>
  )
}

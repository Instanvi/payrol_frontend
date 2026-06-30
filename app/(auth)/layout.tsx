export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-main-bg p-4 sm:p-6">
      <div className="w-full max-w-lg">{children}</div>
    </div>
  )
}

export function AuthBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-main-bg"
    >
      <div className="auth-pattern-dots absolute inset-0" />
      <div className="auth-pattern-grid absolute inset-0 opacity-40" />
      <div className="absolute -top-32 right-0 size-80 rounded-full bg-primary/12 blur-3xl" />
      <div className="absolute -bottom-32 left-0 size-80 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 size-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
    </div>
  )
}

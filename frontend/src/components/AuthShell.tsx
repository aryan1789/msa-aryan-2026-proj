import type { ReactNode } from "react"

// Shared presentational primitives for the auth pages (Login / Register).
// Squared, warm-surfaced inputs to match the Crew Forge industrial look.
export const inputClass =
  "h-11 w-full border-[1.5px] border-input bg-card px-3 text-[15px] outline-none transition-colors focus-visible:border-ring"

export function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: ReactNode
}) {
  return (
    <label htmlFor={htmlFor} className="flex flex-col gap-1.5">
      <span className="font-heading text-xs font-medium tracking-[0.06em] text-muted-foreground uppercase">
        {label}
      </span>
      {children}
    </label>
  )
}

// Split screen: a permanently-dark brand hero beside the form. Stacks on mobile.
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      <div className="relative flex flex-col justify-center overflow-hidden bg-header px-8 py-14 text-header-foreground md:flex-1 md:px-16">
        <div className="font-heading text-6xl leading-[0.95] font-extrabold tracking-tight uppercase md:text-8xl">
          Crew
          <br />
          Forge
        </div>
        <div className="mt-5 mb-4 h-1 w-16 bg-primary" />
        <p className="max-w-md text-base leading-relaxed text-header-muted">
          Show up daily. Track the streak. Beat your crew on the board. No excuses, just reps.
        </p>
        <div className="mt-9 flex gap-1.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <span
              key={i}
              className={`h-3.5 w-5 ${i < 5 ? "bg-primary" : "bg-white/10"}`}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col justify-center bg-background px-8 py-14 md:flex-1 md:px-16">
        <div className="mx-auto w-full max-w-sm">
          <h1 className="font-heading text-3xl font-bold tracking-wide uppercase">{title}</h1>
          <p className="mt-1.5 mb-7 text-sm text-muted-foreground">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  )
}

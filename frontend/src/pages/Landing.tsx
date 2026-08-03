import { Link, useNavigate } from "react-router-dom"
import { ThemeToggle } from "@/components/ThemeToggle"

// Public marketing page (Crew Forge landing). Standalone shell — not the authed
// Layout — with its own header (Log In / Get Started) instead of a user chip.
export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* Header */}
      <header className="border-b-[3px] border-primary bg-header text-header-foreground">
        <div className="mx-auto flex min-h-16 w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2.5">
          <Link to="/" className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-9 min-w-9 items-center justify-center bg-primary font-heading text-lg font-extrabold tracking-wider text-primary-foreground">
              CF
            </span>
            <span className="truncate font-heading text-xl font-bold tracking-[0.12em] uppercase">
              Crew Forge
            </span>
          </Link>
          <div className="flex flex-shrink-0 items-center gap-2.5">
            <ThemeToggle />
            <button
              onClick={() => navigate("/login")}
              className="border-[1.5px] border-header-border px-4 py-2 font-heading text-xs font-bold tracking-wide uppercase text-header-foreground transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-header"
            >
              Log In
            </button>
            <button
              onClick={() => navigate("/register")}
              className="bg-primary px-4 py-2 font-heading text-xs font-bold tracking-wide text-primary-foreground uppercase transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-header"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-header text-header-foreground">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-8 px-4 py-14 sm:px-8">
          <div className="min-w-[280px] flex-1 basis-[420px]">
            <div className="mb-5 flex items-center gap-2">
              <span className="h-[3px] w-[18px] bg-primary" />
              <span className="font-heading text-xs tracking-[0.15em] text-header-muted uppercase">
                Group fitness accountability
              </span>
            </div>
            <h1 className="font-heading text-[clamp(30px,4.6vw,46px)] leading-[1.15] font-medium tracking-tight text-header-foreground">
              The app you needed to finally stick to your fitness targets.
            </h1>
          </div>

          {/* Visual: dark panel + two rotated preview cards */}
          <div className="relative flex min-h-[320px] min-w-[280px] flex-1 basis-[340px] flex-wrap items-center justify-center gap-6 border-[1.5px] border-white/10 p-8">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/25 via-black/20 to-black/60" />
            <div className="pointer-events-none absolute inset-0 [background-image:repeating-linear-gradient(45deg,rgba(255,255,255,0.04)_0px,rgba(255,255,255,0.04)_1px,transparent_1px,transparent_9px)]" />

            {/* Mini scoreboard card */}
            <div className="relative z-10 w-[220px] flex-shrink-0 -rotate-2 border-8 border-[#17140f] bg-background text-foreground shadow-2xl">
              <div className="px-3.5 pt-3.5 pb-4">
                <div className="mb-2.5 font-heading text-[13px] font-bold tracking-wide uppercase">
                  Iron Sharpens
                </div>
                {[
                  { rank: 1, name: "Jordan Marsh", xp: 2840 },
                  { rank: 2, name: "Priya Anand", xp: 2615 },
                ].map((pm) => (
                  <div
                    key={pm.rank}
                    className="flex items-center gap-2 border-b border-border py-[7px]"
                  >
                    <div className="w-3 font-heading text-xs font-bold text-muted-foreground">
                      {pm.rank}
                    </div>
                    <div className="min-w-0 flex-1 truncate font-heading text-xs font-semibold">
                      {pm.name}
                    </div>
                    <div className="font-heading text-[13px] font-extrabold text-primary tabular-nums">
                      {pm.xp}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Streak card */}
            <div className="relative z-10 w-[168px] flex-shrink-0 rotate-2 border-[1.5px] border-border bg-card px-4 py-3.5 text-card-foreground shadow-xl">
              <div className="mb-1.5 text-[11px] tracking-wide text-muted-foreground uppercase">
                Current streak
              </div>
              <div className="mb-2 font-heading text-3xl font-extrabold">12 days</div>
              <div className="flex gap-[3px]">
                {Array.from({ length: 7 }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-4 w-3 ${i < 5 ? "bg-warning" : "bg-muted"}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mechanics */}
      <section className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-8">
        <h2 className="mb-2 font-heading text-[clamp(26px,4vw,34px)] font-extrabold tracking-tight">
          Built to keep everyone honest
        </h2>
        <p className="mb-8 max-w-xl text-[15px] text-muted-foreground">
          Three mechanics. No settings to hide behind.
        </p>

        <div className="border-t-[1.5px] border-border">
          <div className="flex items-start gap-5 border-b-[1.5px] border-border py-5">
            <div className="flex flex-shrink-0 gap-[3px] pt-1">
              <span className="h-[26px] w-[9px] bg-warning" />
              <span className="h-[26px] w-[9px] bg-warning" />
              <span className="h-[26px] w-[9px] bg-muted" />
            </div>
            <div>
              <h3 className="mb-1 font-heading text-lg font-bold">Daily check-ins</h3>
              <p className="max-w-lg text-sm text-muted-foreground">
                One tap after training. Miss a day and your crew sees the blank square, not
                just you.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-5 border-b-[1.5px] border-border py-5">
            <div className="mt-0.5 size-[34px] flex-shrink-0 rounded-full border-2 border-success" />
            <div>
              <h3 className="mb-1 font-heading text-lg font-bold">Weekly targets</h3>
              <p className="max-w-lg text-sm text-muted-foreground">
                Set the bar once. Hit it and your row goes green. Fall short and everyone can
                tell you coasted.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-5 border-b-[1.5px] border-border py-5">
            <div className="w-[34px] flex-shrink-0 font-heading text-[22px] font-extrabold text-primary">
              XP
            </div>
            <div>
              <h3 className="mb-1 font-heading text-lg font-bold">Crew scoreboard</h3>
              <p className="max-w-lg text-sm text-muted-foreground">
                Every check-in and streak earns XP, ranked live. No more quietly falling off.
                The board doesn't forget.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mt-auto bg-primary text-primary-foreground">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-5 px-4 py-11 sm:px-8">
          <div className="font-heading text-[clamp(22px,3.4vw,30px)] font-extrabold tracking-tight">
            Ready to forge your streak?
          </div>
          <button
            onClick={() => navigate("/register")}
            className="bg-primary-foreground px-7 py-3.5 font-heading text-[15px] font-bold tracking-wide text-primary uppercase transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
          >
            Get Started
          </button>
        </div>
      </section>
    </div>
  )
}

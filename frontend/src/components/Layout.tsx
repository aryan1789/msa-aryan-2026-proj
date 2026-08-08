import { Link, Outlet, useNavigate } from "react-router-dom"
import { Trophy, BarChart3 } from "lucide-react"
import { useAuthStore } from "@/store/auth"
import { ThemeToggle } from "@/components/ThemeToggle"
import { monogram } from "@/lib/initials"

// Crew Forge shell: a permanently-dark header bar (in both themes) with the CF
// mark, wordmark, theme toggle, user chip, and logout, wrapping the page.
export default function Layout() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const clear = useAuthStore((state) => state.clear)

  function handleLogout() {
    clear()
    navigate("/login", { replace: true })
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="border-b-[3px] border-primary bg-header text-header-foreground">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-4">
          <Link to="/crews" className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-9 min-w-9 items-center justify-center bg-primary font-heading text-lg font-extrabold tracking-wider text-primary-foreground">
              CF
            </span>
            <span className="truncate font-heading text-xl font-bold tracking-[0.12em] uppercase">
              Crew Forge
            </span>
          </Link>

          <div className="flex flex-shrink-0 items-center gap-2.5">
            <Link
              to="/leaderboard"
              className="flex items-center gap-1.5 border border-header-border px-3 py-1.5 font-heading text-xs font-semibold tracking-wider uppercase text-header-muted transition-colors hover:bg-white/10 hover:text-header-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-header"
            >
              <BarChart3 className="size-3.5" />
              <span className="hidden sm:inline">Ranks</span>
            </Link>
            <Link
              to="/achievements"
              className="flex items-center gap-1.5 border border-header-border px-3 py-1.5 font-heading text-xs font-semibold tracking-wider uppercase text-header-muted transition-colors hover:bg-white/10 hover:text-header-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-header"
            >
              <Trophy className="size-3.5" />
              <span className="hidden sm:inline">Badges</span>
            </Link>
            <ThemeToggle />
            {user && (
              <span
                title={user.displayName}
                className="hidden size-8 items-center justify-center border border-header-border bg-white/5 font-heading text-xs font-bold text-header-foreground sm:flex"
              >
                {monogram(user.displayName)}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="border border-header-border px-3 py-1.5 font-heading text-xs font-semibold tracking-wider uppercase text-header-muted transition-colors hover:bg-white/10 hover:text-header-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-header"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}

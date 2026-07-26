import { useAuthStore } from "@/store/auth"

// Placeholder protected home. Crew and scoreboard features land in Phase 4;
// for now this just confirms the authenticated shell is working.
export default function Dashboard() {
  const user = useAuthStore((state) => state.user)

  return (
    <div className="rounded-2xl border border-border bg-background p-8">
      <h1 className="text-2xl font-semibold">
        You&apos;re signed in{user ? `, ${user.displayName}` : ""}.
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Your crews and live scoreboard will appear here soon.
      </p>
    </div>
  )
}

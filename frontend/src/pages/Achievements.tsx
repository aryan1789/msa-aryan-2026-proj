import { useEffect, useState } from "react"
import { getMyAchievements } from "@/lib/achievements"
import { apiErrorMessage } from "@/lib/api"
import { BADGES } from "@/lib/badges"
import type { EarnedAchievement } from "@/lib/types"

export default function Achievements() {
  const [earned, setEarned] = useState<EarnedAchievement[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getMyAchievements()
      .then(setEarned)
      .catch((err) => setError(apiErrorMessage(err, "Could not load your achievements.")))
  }, [])

  const earnedByCode = new Map((earned ?? []).map((e) => [e.code, e]))
  const total = Object.keys(BADGES).length

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-4xl font-extrabold tracking-wide uppercase">
          Achievements
        </h1>
        {earned !== null && (
          <p className="mt-1 text-sm text-muted-foreground">
            {earned.length} of {total} unlocked
          </p>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {earned === null && !error && (
        <p className="text-sm text-muted-foreground">Loading…</p>
      )}

      {earned !== null && (
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.entries(BADGES).map(([code, badge]) => {
            const got = earnedByCode.get(code)
            return (
              <div
                key={code}
                className={`flex items-center gap-4 border-[1.5px] border-border p-4 ${got ? "bg-card" : "bg-muted/30"}`}
              >
                <span
                  className={`flex size-12 min-w-12 items-center justify-center border border-border text-2xl leading-none ${got ? "bg-muted/40" : "bg-muted opacity-40 grayscale"}`}
                >
                  {badge.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-bold tracking-wide uppercase">
                      {badge.name}
                    </span>
                    {got && got.count > 1 && (
                      <span className="font-heading text-[11px] tracking-wide text-muted-foreground uppercase">
                        ×{got.count}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[13px] text-muted-foreground">{badge.description}</p>
                  {got ? (
                    <p className="mt-1 font-heading text-[11px] tracking-wider text-success uppercase">
                      Earned {formatDate(got.earnedAt)}
                    </p>
                  ) : (
                    <p className="mt-1 font-heading text-[11px] tracking-wider text-muted-foreground uppercase">
                      Locked
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-2 flex flex-col gap-3">
        <p className="font-heading text-xs tracking-wider text-muted-foreground uppercase">
          More coming soon
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 border-[1.5px] border-dashed border-border p-4 opacity-60"
            >
              <span className="flex size-12 min-w-12 items-center justify-center border border-dashed border-border text-2xl leading-none text-muted-foreground">
                ?
              </span>
              <div className="min-w-0 flex-1">
                <span className="font-heading font-bold tracking-wide text-muted-foreground uppercase">
                  Coming soon
                </span>
                <p className="mt-0.5 text-[13px] text-muted-foreground">
                  New challenges are in the forge.
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

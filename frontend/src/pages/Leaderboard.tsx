import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Flame } from "lucide-react"
import { getLeaderboard } from "@/lib/leaderboard"
import { listCrews } from "@/lib/crews"
import { apiErrorMessage } from "@/lib/api"
import type { CrewLeaderboardRow } from "@/lib/types"
import { monogram } from "@/lib/initials"

export default function Leaderboard() {
  const [rows, setRows] = useState<CrewLeaderboardRow[] | null>(null)
  const [myCrewIds, setMyCrewIds] = useState<Set<number>>(new Set())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getLeaderboard()
      .then(setRows)
      .catch((err) => setError(apiErrorMessage(err, "Could not load the leaderboard.")))
    listCrews()
      .then((crews) => setMyCrewIds(new Set(crews.map((c) => c.id))))
      .catch(() => {})
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-4xl font-extrabold tracking-wide uppercase">
          Leaderboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every crew ranked by average weekly streak
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {rows === null && !error && (
        <p className="text-sm text-muted-foreground">Loading…</p>
      )}

      {rows !== null && rows.length === 0 && (
        <div className="border-[1.5px] border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">No crews yet.</p>
        </div>
      )}

      {rows !== null && rows.length > 0 && (
        <div className="border-t-[1.5px] border-border">
          {rows.map((row, i) => {
            const mine = myCrewIds.has(row.crewId)
            const cls = `flex w-full items-center gap-4 border-b-[1.5px] border-border px-1 py-4 text-left ${
              mine ? "bg-primary/5" : ""
            }`
            const inner = (
              <>
                <span
                  className={`w-6 text-center font-heading text-lg font-bold tabular-nums ${
                    i === 0 ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="flex size-11 min-w-11 items-center justify-center bg-secondary font-heading text-sm font-bold text-secondary-foreground">
                  {monogram(row.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-heading text-lg font-bold tracking-wide uppercase">
                      {row.name}
                    </span>
                    {mine && (
                      <span className="shrink-0 font-heading text-[11px] tracking-wide text-muted-foreground uppercase">
                        You're in
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-[13px] text-muted-foreground">
                    {row.memberCount} member{row.memberCount === 1 ? "" : "s"}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Flame className="size-4 text-warning" />
                  <div className="text-right">
                    <div className="font-heading text-2xl leading-none font-extrabold text-warning tabular-nums">
                      {row.averageStreak.toFixed(1)}
                    </div>
                    <div className="text-[10px] tracking-wider text-muted-foreground uppercase">
                      Avg Streak
                    </div>
                  </div>
                </div>
              </>
            )
            return mine ? (
              <Link
                key={row.crewId}
                to={`/crews/${row.crewId}`}
                className={`${cls} transition-colors hover:bg-muted/50`}
              >
                {inner}
              </Link>
            ) : (
              <div key={row.crewId} className={cls}>
                {inner}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

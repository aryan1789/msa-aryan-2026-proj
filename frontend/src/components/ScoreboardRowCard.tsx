import { Flame } from "lucide-react"
import type { ScoreboardRow } from "@/lib/types"
import { monogram } from "@/lib/initials"

// One scoreboard entry, styled as a Crew Forge table row. Extracted from
// CrewScreen so it's unit-testable. A CSS grid gives a real 5-column table on
// sm+ and a tidy two-line card on mobile (rank spans both lines; ticks + status
// wrap under the member), so nothing overflows at 375px.
export function ScoreboardRowCard({
  row,
  rank,
  isMe,
}: {
  row: ScoreboardRow
  rank: number
  isMe: boolean
}) {
  const isPodium = rank === 1

  return (
    <li
      className={`grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 border-b border-border px-2 py-3 sm:grid-cols-[32px_minmax(0,1fr)_96px_72px_112px] sm:gap-y-0 ${
        isMe ? "bg-primary/5" : ""
      }`}
    >
      <span
        className={`row-span-2 self-center text-center font-heading text-lg font-bold tabular-nums sm:row-span-1 ${
          isPodium ? "text-primary" : "text-muted-foreground"
        }`}
      >
        {rank}
      </span>

      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex size-8 min-w-8 items-center justify-center bg-secondary font-heading text-[11px] font-bold text-secondary-foreground">
          {monogram(row.displayName)}
        </span>
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate font-heading font-semibold">{row.displayName}</span>
          {isMe && (
            <span className="shrink-0 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              You
            </span>
          )}
          {row.currentStreak > 0 && (
            <span className="flex shrink-0 items-center gap-0.5 font-heading text-xs font-bold text-warning tabular-nums">
              <Flame className="size-3.5" />
              {row.currentStreak}
            </span>
          )}
        </div>
      </div>

      {/* Weekly progress as ticks: checkInCount filled of weeklyTarget. */}
      <div
        data-testid="progress-ticks"
        className="col-start-2 row-start-2 flex items-center gap-[3px] sm:col-start-3 sm:row-start-1"
      >
        {Array.from({ length: Math.max(row.weeklyTarget, 1) }).map((_, i) => (
          <span
            key={i}
            className={`h-3.5 w-2.5 ${
              i < row.checkInCount
                ? row.targetMet
                  ? "bg-success"
                  : "bg-warning"
                : "bg-muted"
            }`}
          />
        ))}
      </div>

      <div className="col-start-3 row-start-1 text-right font-heading text-xl font-extrabold tabular-nums sm:col-start-4">
        {row.xp}
      </div>

      <div className="col-start-3 row-start-2 justify-self-end sm:col-start-5 sm:row-start-1">
        {row.targetMet ? (
          <span className="inline-block bg-success-bg px-2 py-1 font-heading text-[11px] font-bold tracking-wide text-success uppercase">
            Target Met
          </span>
        ) : (
          <span className="inline-block bg-warning-bg px-2 py-1 font-heading text-[11px] font-bold tracking-wide text-warning uppercase">
            {row.checkInCount}/{row.weeklyTarget} · In Progress
          </span>
        )}
      </div>
    </li>
  )
}

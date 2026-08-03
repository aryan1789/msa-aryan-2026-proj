import { useEffect, useState, type FormEvent } from "react"
import { useNavigate, useParams, Link } from "react-router-dom"
import axios from "axios"
import { getCrew, checkIn, leaveCrew, hasCheckedInToday } from "@/lib/crews"
import { apiErrorMessage } from "@/lib/api"
import { useAuthStore } from "@/store/auth"
import { useScoreboard } from "@/hooks/useScoreboard"
import type { CrewDetail } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/Modal"
import { ScoreboardRowCard } from "@/components/ScoreboardRowCard"
import { Field, inputClass } from "@/components/AuthShell"

export default function CrewScreen() {
  const params = useParams()
  const crewId = Number(params.id)
  const navigate = useNavigate()
  const me = useAuthStore((s) => s.user)

  const { rows, error: boardError, live, refresh } = useScoreboard(crewId)

  const [crew, setCrew] = useState<CrewDetail | null>(null)
  const [crewError, setCrewError] = useState<string | null>(null)
  const [checkedInToday, setCheckedInToday] = useState(false)
  const [showCheckIn, setShowCheckIn] = useState(false)
  const [celebration, setCelebration] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    getCrew(crewId)
      .then(setCrew)
      .catch((err) => setCrewError(apiErrorMessage(err, "Could not load this crew.")))
    hasCheckedInToday(crewId)
      .then(setCheckedInToday)
      .catch(() => {})
  }, [crewId])

  useEffect(() => {
    if (!celebration) return
    const t = setTimeout(() => setCelebration(null), 4000)
    return () => clearTimeout(t)
  }, [celebration])

  const isOwner = crew !== null && me !== null && crew.createdByUserId === me.id

  async function handleCheckedIn(justMet: boolean) {
    setCheckedInToday(true)
    setShowCheckIn(false)
    setCelebration(justMet ? "🎉 You hit your weekly target! +50 XP" : "✓ Checked in! +10 XP")
    // The server pushes the updated row over SignalR; if the socket is down,
    // fall back to a full re-fetch so the board still reflects the check-in.
    if (!live) await refresh()
  }

  async function handleLeave() {
    try {
      await leaveCrew(crewId)
      navigate("/crews", { replace: true })
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setCrewError("As the creator you can't leave this crew.")
      } else {
        setCrewError(apiErrorMessage(err, "Could not leave the crew."))
      }
    }
  }

  const total = rows?.length ?? 0
  const metCount = rows?.filter((r) => r.targetMet).length ?? 0
  const avgStreak =
    total > 0 ? rows!.reduce((s, r) => s + r.currentStreak, 0) / total : 0
  const progressPct = total > 0 ? Math.round((metCount / total) * 100) : 0

  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/crews"
        className="font-heading text-xs font-semibold tracking-wider text-muted-foreground uppercase transition-colors hover:text-foreground"
      >
        ← All crews
      </Link>

      {crewError && <p className="text-sm text-destructive">{crewError}</p>}

      {crew && (
        <div className="flex flex-col gap-5 border-[1.5px] border-border bg-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="font-heading text-3xl leading-none font-extrabold tracking-wide uppercase sm:text-4xl">
                {crew.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>
                  {crew.members.length} member{crew.members.length === 1 ? "" : "s"}
                </span>
                <span className="text-border">·</span>
                <span className="font-heading text-xs tracking-wider uppercase">Invite</span>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(crew.inviteCode)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 1500)
                  }}
                  className="border border-border bg-muted/50 px-2 py-0.5 font-mono text-xs font-semibold tracking-widest text-foreground hover:bg-muted"
                  title="Copy invite code"
                >
                  {crew.inviteCode}
                </button>
                {copied && <span className="text-xs text-success">Copied ✓</span>}
              </div>
            </div>
            <div className="flex gap-2">
              {!isOwner && (
                <Button variant="outline" size="lg" onClick={handleLeave}>
                  Leave
                </Button>
              )}
              <Button
                size="lg"
                disabled={checkedInToday}
                onClick={() => setShowCheckIn(true)}
              >
                {checkedInToday ? "Checked in ✓" : "Check in"}
              </Button>
            </div>
          </div>

          {rows && rows.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-3">
                <div className="border-[1.5px] border-border px-4 py-2 text-center">
                  <div className="font-heading text-xl font-extrabold text-warning tabular-nums">
                    {avgStreak.toFixed(1)}
                  </div>
                  <div className="text-[10px] tracking-wider text-muted-foreground uppercase">
                    Avg Streak
                  </div>
                </div>
                <div className="border-[1.5px] border-border px-4 py-2 text-center">
                  <div className="font-heading text-xl font-extrabold text-success tabular-nums">
                    {metCount}/{total}
                  </div>
                  <div className="text-[10px] tracking-wider text-muted-foreground uppercase">
                    On Target
                  </div>
                </div>
              </div>
              <div className="h-1.5 w-full bg-muted">
                <div className="h-full bg-primary" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          )}
        </div>
      )}

      {celebration && (
        <div className="border-l-[3px] border-success bg-success-bg px-4 py-3 text-sm font-medium text-success">
          {celebration}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-bold tracking-wide uppercase">Scoreboard</h2>
        <span
          className={`flex items-center gap-1.5 font-heading text-[11px] tracking-wider uppercase ${live ? "text-success" : "text-muted-foreground"}`}
        >
          <span className={`size-2 ${live ? "bg-success" : "bg-muted-foreground/50"}`} />
          {live ? "Live" : "Offline"}
        </span>
      </div>

      {boardError && <p className="text-sm text-destructive">{boardError}</p>}

      {rows === null && !boardError && (
        <p className="text-sm text-muted-foreground">Loading scoreboard…</p>
      )}

      {rows && (
        <div>
          <div className="hidden grid-cols-[32px_minmax(0,1fr)_96px_72px_112px] gap-3 border-b-[1.5px] border-border px-2 pb-2 font-heading text-[11px] tracking-wider text-muted-foreground uppercase sm:grid">
            <div>#</div>
            <div>Member</div>
            <div>Reps</div>
            <div className="text-right">XP</div>
            <div className="text-right">Status</div>
          </div>
          <ol>
            {rows.map((row, i) => (
              <ScoreboardRowCard
                key={row.userId}
                row={row}
                rank={i + 1}
                isMe={me?.id === row.userId}
              />
            ))}
          </ol>
        </div>
      )}

      <CheckInModal
        open={showCheckIn}
        crewId={crewId}
        onClose={() => setShowCheckIn(false)}
        onDone={handleCheckedIn}
        onAlreadyCheckedIn={() => {
          setCheckedInToday(true)
          setShowCheckIn(false)
        }}
      />
    </div>
  )
}

function CheckInModal({
  open,
  crewId,
  onClose,
  onDone,
  onAlreadyCheckedIn,
}: {
  open: boolean
  crewId: number
  onClose: () => void
  onDone: (justMet: boolean) => void
  onAlreadyCheckedIn: () => void
}) {
  const [note, setNote] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const result = await checkIn(crewId, note.trim())
      setNote("")
      onDone(result.justMet)
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        onAlreadyCheckedIn()
      } else {
        setError(apiErrorMessage(err, "Could not record your check-in."))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        setError(null)
        onClose()
      }}
      title="Check in"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="What did you do?" htmlFor="checkin-note">
          <input
            id="checkin-note"
            type="text"
            required
            maxLength={500}
            autoFocus
            placeholder="e.g. 5k run before work"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={inputClass}
          />
        </Field>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" size="lg" disabled={submitting} className="w-full">
          {submitting ? "Checking in…" : "Check in"}
        </Button>
      </form>
    </Modal>
  )
}

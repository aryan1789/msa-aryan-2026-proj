import { useEffect, useState, type FormEvent } from "react"
import { useNavigate, useParams, Link } from "react-router-dom"
import axios from "axios"
import { getCrew, checkIn, leaveCrew, hasCheckedInToday } from "@/lib/crews"
import { apiErrorMessage } from "@/lib/api"
import { useAuthStore } from "@/store/auth"
import { useScoreboard } from "@/hooks/useScoreboard"
import type { CrewDetail, ScoreboardRow } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/Modal"
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
      navigate("/", { replace: true })
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setCrewError("As the creator you can't leave this crew.")
      } else {
        setCrewError(apiErrorMessage(err, "Could not leave the crew."))
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Link to="/" className="text-sm text-muted-foreground hover:underline">
        ← All crews
      </Link>

      {crewError && <p className="text-sm text-destructive">{crewError}</p>}

      {crew && (
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold">{crew.name}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Invite code</span>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(crew.inviteCode)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 1500)
                }}
                className="rounded-md border border-border bg-muted/40 px-2 py-0.5 font-mono font-semibold tracking-widest text-foreground hover:bg-muted"
                title="Copy invite code"
              >
                {crew.inviteCode}
              </button>
              {copied && <span className="text-xs text-green-600">Copied ✓</span>}
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
              {checkedInToday ? "Checked in today ✓" : "Check in"}
            </Button>
          </div>
        </div>
      )}

      {celebration && (
        <div className="rounded-xl border border-green-600/30 bg-green-500/10 px-4 py-3 text-sm font-medium text-green-700">
          {celebration}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Scoreboard</h2>
        <span
          className={`flex items-center gap-1.5 text-xs ${live ? "text-green-600" : "text-muted-foreground"}`}
        >
          <span
            className={`inline-block h-2 w-2 rounded-full ${live ? "bg-green-500" : "bg-muted-foreground/50"}`}
          />
          {live ? "Live" : "Offline"}
        </span>
      </div>

      {boardError && <p className="text-sm text-destructive">{boardError}</p>}

      {rows === null && !boardError && (
        <p className="text-sm text-muted-foreground">Loading scoreboard…</p>
      )}

      {rows && (
        <ol className="flex flex-col gap-2">
          {rows.map((row, i) => (
            <ScoreboardRowCard
              key={row.userId}
              row={row}
              rank={i + 1}
              isMe={me?.id === row.userId}
            />
          ))}
        </ol>
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

function ScoreboardRowCard({
  row,
  rank,
  isMe,
}: {
  row: ScoreboardRow
  rank: number
  isMe: boolean
}) {
  const pct = row.weeklyTarget > 0
    ? Math.min(100, Math.round((row.checkInCount / row.weeklyTarget) * 100))
    : 0

  return (
    <li
      className={`flex items-center gap-4 rounded-xl border p-4 transition-colors ${
        isMe ? "border-ring bg-muted/40" : "border-border bg-background"
      }`}
    >
      <span className="w-6 text-center text-sm font-semibold text-muted-foreground">
        {rank}
      </span>

      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {row.displayName}
            {isMe && <span className="ml-1 text-xs text-muted-foreground">(you)</span>}
          </span>
          {row.currentStreak > 0 && (
            <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-xs font-medium text-orange-600">
              🔥 {row.currentStreak}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${
                row.targetMet ? "bg-green-500" : "bg-orange-400"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span
            className={`text-xs tabular-nums ${
              row.targetMet ? "font-medium text-green-600" : "text-muted-foreground"
            }`}
          >
            {row.checkInCount}/{row.weeklyTarget}
            {row.targetMet ? " ✓" : ""}
          </span>
        </div>
      </div>

      <span className="w-16 text-right font-semibold tabular-nums">{row.xp} XP</span>
    </li>
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

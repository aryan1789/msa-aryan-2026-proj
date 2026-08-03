import { useCallback, useEffect, useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { ChevronRight } from "lucide-react"
import axios from "axios"
import { listCrews, createCrew, joinCrew } from "@/lib/crews"
import { apiErrorMessage } from "@/lib/api"
import type { MyCrew } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/Modal"
import { Field, inputClass } from "@/components/AuthShell"
import { monogram } from "@/lib/initials"

export default function CrewsList() {
  const navigate = useNavigate()
  const [crews, setCrews] = useState<MyCrew[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)

  const load = useCallback(() => {
    listCrews()
      .then(setCrews)
      .catch((err) => setError(apiErrorMessage(err, "Could not load your crews.")))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-4xl font-extrabold tracking-wide uppercase">
            Your Crews
          </h1>
          {crews !== null && (
            <p className="mt-1 text-sm text-muted-foreground">
              {crews.length} active
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="lg" onClick={() => setShowJoin(true)}>
            Join
          </Button>
          <Button size="lg" onClick={() => setShowCreate(true)}>
            + New Crew
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {crews === null && !error && (
        <p className="text-sm text-muted-foreground">Loading…</p>
      )}

      {crews !== null && crews.length === 0 && (
        <div className="border-[1.5px] border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">
            You're not in any crews yet. Create one or join with an invite code.
          </p>
        </div>
      )}

      {crews !== null && crews.length > 0 && (
        <div className="border-t-[1.5px] border-border">
          {crews.map((crew) => (
            <button
              key={crew.id}
              onClick={() => navigate(`/crews/${crew.id}`)}
              className="flex w-full items-center gap-4 border-b-[1.5px] border-border px-1 py-4 text-left transition-colors hover:bg-muted/50"
            >
              <span className="flex size-11 min-w-11 items-center justify-center bg-secondary font-heading text-sm font-bold text-secondary-foreground">
                {monogram(crew.name)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-heading text-lg font-bold tracking-wide uppercase">
                  {crew.name}
                </div>
                <div className="mt-0.5 text-[13px] text-muted-foreground">
                  {crew.memberCount} member{crew.memberCount === 1 ? "" : "s"} ·{" "}
                  {crew.myWeeklyTarget}/wk target
                </div>
              </div>
              <div className="text-right">
                <div className="font-heading text-2xl leading-none font-extrabold text-primary tabular-nums">
                  {crew.myCurrentStreak}
                </div>
                <div className="text-[10px] tracking-wider text-muted-foreground uppercase">
                  Wk Streak
                </div>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}

      <CreateCrewModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(id) => navigate(`/crews/${id}`)}
        onMutated={load}
      />
      <JoinCrewModal
        open={showJoin}
        onClose={() => setShowJoin(false)}
        onJoined={(id) => navigate(`/crews/${id}`)}
      />
    </div>
  )
}

function CreateCrewModal({
  open,
  onClose,
  onCreated,
  onMutated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (id: number) => void
  onMutated: () => void
}) {
  const [name, setName] = useState("")
  const [target, setTarget] = useState(3)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [created, setCreated] = useState<{ id: number; inviteCode: string } | null>(null)
  const [copied, setCopied] = useState(false)

  function reset() {
    setName("")
    setTarget(3)
    setError(null)
    setCreated(null)
    setCopied(false)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const crew = await createCrew(name.trim(), target)
      setCreated({ id: crew.id, inviteCode: crew.inviteCode })
      // Refresh the list behind the modal so the new crew shows even if the
      // user dismisses the invite-code step instead of opening the crew.
      onMutated()
    } catch (err) {
      setError(apiErrorMessage(err, "Could not create the crew."))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      title={created ? "Crew created 🎉" : "Create a crew"}
    >
      {created ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Share this invite code so others can join:
          </p>
          <div className="flex items-center justify-between border-[1.5px] border-border bg-muted/50 px-4 py-3">
            <span className="font-mono text-xl font-semibold tracking-widest">
              {created.inviteCode}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard?.writeText(created.inviteCode)
                setCopied(true)
              }}
            >
              {copied ? "Copied ✓" : "Copy"}
            </Button>
          </div>
          <Button size="lg" className="w-full" onClick={() => onCreated(created.id)}>
            Open crew
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Crew name" htmlFor="crew-name">
            <input
              id="crew-name"
              type="text"
              required
              maxLength={100}
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Weekly check-in target" htmlFor="crew-target">
            <select
              id="crew-target"
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
              className={inputClass}
            >
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "day" : "days"} / week
                </option>
              ))}
            </select>
          </Field>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" size="lg" disabled={submitting} className="w-full">
            {submitting ? "Creating…" : "Create crew"}
          </Button>
        </form>
      )}
    </Modal>
  )
}

function JoinCrewModal({
  open,
  onClose,
  onJoined,
}: {
  open: boolean
  onClose: () => void
  onJoined: (id: number) => void
}) {
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const { id } = await joinCrew(code.trim().toUpperCase())
      onJoined(id)
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setError("No crew with that code.")
      } else if (axios.isAxiosError(err) && err.response?.status === 409) {
        setError("You're already in this crew.")
      } else {
        setError(apiErrorMessage(err, "Could not join the crew."))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        setCode("")
        setError(null)
        onClose()
      }}
      title="Join a crew"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Invite code" htmlFor="invite-code">
          <input
            id="invite-code"
            type="text"
            required
            maxLength={8}
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className={`${inputClass} font-mono tracking-widest uppercase`}
          />
        </Field>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" size="lg" disabled={submitting} className="w-full">
          {submitting ? "Joining…" : "Join crew"}
        </Button>
      </form>
    </Modal>
  )
}

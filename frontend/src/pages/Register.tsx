import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { api, apiErrorMessage } from "@/lib/api"
import { useAuthStore, type LoginResponse } from "@/store/auth"
import { Button } from "@/components/ui/button"
import { AuthShell, Field, inputClass } from "@/components/AuthShell"

export default function Register() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)

  const [email, setEmail] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      // Register creates the account (no token returned), then we log in to
      // obtain a token and drop straight into the authenticated shell.
      await api.post("/Auth/register", { email, displayName, password })
      const { data } = await api.post<LoginResponse>("/Auth/login", { email, password })
      const { token, ...user } = data
      setAuth(token, user)
      navigate("/", { replace: true })
    } catch (err) {
      setError(apiErrorMessage(err, "Could not create your account. Please try again."))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell title="Create account" subtitle="Start building your streak.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Display name" htmlFor="displayName">
          <input
            id="displayName"
            type="text"
            required
            maxLength={100}
            autoComplete="name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Email" htmlFor="email">
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Password" htmlFor="password">
          <input
            id="password"
            type="password"
            required
            minLength={8}
            maxLength={72}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
          <span className="text-xs text-muted-foreground">At least 8 characters.</span>
        </Field>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" size="lg" disabled={submitting} className="mt-2 w-full">
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}

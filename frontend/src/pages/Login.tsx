import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { api, apiErrorMessage } from "@/lib/api"
import { useAuthStore, type LoginResponse } from "@/store/auth"
import { Button } from "@/components/ui/button"
import { AuthShell, Field, inputClass } from "@/components/AuthShell"

export default function Login() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const { data } = await api.post<LoginResponse>("/Auth/login", { email, password })
      const { token, ...user } = data
      setAuth(token, user)
      navigate("/crews", { replace: true })
    } catch (err) {
      setError(apiErrorMessage(err, "Could not sign in. Please try again."))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell title="Sign in" subtitle="Welcome back to your crew.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </Field>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" size="lg" disabled={submitting} className="mt-2 w-full">
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        No account?{" "}
        <Link to="/register" className="font-medium text-primary hover:underline">
          Create one
        </Link>
      </p>
    </AuthShell>
  )
}

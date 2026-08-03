import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { describe, it, expect, vi, beforeEach } from "vitest"
import Login from "@/pages/Login"
import { api } from "@/lib/api"
import { useAuthStore } from "@/store/auth"

// Spy on navigation without leaving the router context the component needs.
const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }))
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom")
  return { ...actual, useNavigate: () => navigateMock }
})

// Replace only the network call; keep the real apiErrorMessage so the test
// exercises the actual error-extraction logic, not a stub of it.
vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api")
  return { ...actual, api: { post: vi.fn() } }
})

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  )
}

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/email/i), "ada@example.com")
  await user.type(screen.getByLabelText(/password/i), "hunter2")
  await user.click(screen.getByRole("button", { name: /sign in/i }))
}

describe("Login page", () => {
  beforeEach(() => {
    vi.mocked(api.post).mockReset()
    navigateMock.mockReset()
    useAuthStore.getState().clear()
  })

  it("renders the sign-in form", () => {
    renderLogin()
    expect(screen.getByRole("heading", { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it("renders the API error message when sign-in is rejected", async () => {
    const user = userEvent.setup()
    vi.mocked(api.post).mockRejectedValue(
      Object.assign(new Error("Request failed"), {
        isAxiosError: true,
        response: { status: 400, data: { message: "Invalid email or password." } },
      }),
    )

    renderLogin()
    await fillAndSubmit(user)

    expect(await screen.findByText("Invalid email or password.")).toBeInTheDocument()
    expect(navigateMock).not.toHaveBeenCalled()
    expect(useAuthStore.getState().token).toBeNull()
  })

  it("stores auth and navigates home on a successful sign-in", async () => {
    const user = userEvent.setup()
    vi.mocked(api.post).mockResolvedValue({
      data: { token: "jwt-123", id: 7, email: "ada@example.com", displayName: "Ada" },
    })

    renderLogin()
    await fillAndSubmit(user)

    expect(navigateMock).toHaveBeenCalledWith("/crews", { replace: true })
    const state = useAuthStore.getState()
    expect(state.token).toBe("jwt-123")
    expect(state.user).toEqual({ id: 7, email: "ada@example.com", displayName: "Ada" })
  })
})

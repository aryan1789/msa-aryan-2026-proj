import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, it, expect } from "vitest"
import Login from "@/pages/Login"

// Smoke test: proves the toolchain (vitest + jsdom + testing-library +
// path alias + router context) is wired end to end. Real component and flow
// tests come in Phase 5.
describe("Login page", () => {
  it("renders the sign-in form", () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    )

    expect(screen.getByRole("heading", { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })
})

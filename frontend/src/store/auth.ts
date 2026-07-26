import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface AuthUser {
  id: number
  email: string
  displayName: string
}

// Shape of a successful POST /Auth/login response: the user fields plus a token.
export interface LoginResponse extends AuthUser {
  token: string
}

interface AuthState {
  token: string | null
  user: AuthUser | null
  setAuth: (token: string, user: AuthUser) => void
  clear: () => void
}

// Persisted to localStorage so a page refresh keeps the session. Custom-JWT
// SPA tradeoff: tokens are readable by JS (XSS exposure) — accepted for this
// timeline; httpOnly-cookie auth is out of scope. See Security notes.
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      clear: () => set({ token: null, user: null }),
    }),
    { name: "auth" },
  ),
)

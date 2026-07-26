import axios from "axios"
import { useAuthStore } from "@/store/auth"

const baseURL = import.meta.env.VITE_API_URL as string | undefined

export const api = axios.create({
  baseURL: baseURL ?? "http://localhost:5194",
})

// Attach the bearer token to every outgoing request when we have one.
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// On a 401 for an *authenticated* request, the session has expired or been
// revoked: clear auth and bounce to /login. We deliberately skip this when we
// had no token (e.g. a failed login), so those errors surface on the form
// instead of triggering a redirect.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const hadToken = Boolean(useAuthStore.getState().token)
    if (error.response?.status === 401 && hadToken) {
      useAuthStore.getState().clear()
      if (window.location.pathname !== "/login") {
        window.location.assign("/login")
      }
    }
    return Promise.reject(error)
  },
)

// Pulls a human-readable message out of an axios error, preferring the API's
// { message } body (e.g. "Invalid email or password.").
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined
    if (data?.message) {
      return data.message
    }
    if (error.response?.status === 429) {
      return "Too many attempts. Please wait a minute and try again."
    }
  }
  return fallback
}

import { Navigate, Outlet } from "react-router-dom"
import { useAuthStore } from "@/store/auth"

// Gate for authenticated routes: with no token we redirect to /login,
// otherwise we render the nested routes.
export default function ProtectedRoute() {
  const token = useAuthStore((state) => state.token)

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

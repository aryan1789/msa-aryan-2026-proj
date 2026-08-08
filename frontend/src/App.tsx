import { Routes, Route, Navigate } from "react-router-dom"
import Landing from "@/pages/Landing"
import Login from "@/pages/Login"
import Register from "@/pages/Register"
import CrewsList from "@/pages/CrewsList"
import CrewScreen from "@/pages/CrewScreen"
import Achievements from "@/pages/Achievements"
import Leaderboard from "@/pages/Leaderboard"
import Layout from "@/components/Layout"
import ProtectedRoute from "@/components/ProtectedRoute"
import { useAuthStore } from "@/store/auth"

function App() {
  const token = useAuthStore((state) => state.token)

  return (
    <Routes>
      {/* Public landing; signed-in users go straight to their crews. */}
      <Route
        path="/"
        element={token ? <Navigate to="/crews" replace /> : <Landing />}
      />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/crews" element={<CrewsList />} />
          <Route path="/crews/:id" element={<CrewScreen />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App

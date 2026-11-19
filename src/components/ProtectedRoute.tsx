import { Navigate, Outlet } from "react-router-dom"
import { useAuth, type Role } from "@/stores/auth"

export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { accessToken, user } = useAuth()
  if (!accessToken) return <Navigate to="/login" replace />
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/" replace />
  return <Outlet />
}
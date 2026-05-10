import { Navigate, useLocation } from "react-router-dom"
import { useAdminAuth } from "../../context/AdminAuthContext"

export function AdminProtectedRoute({ children }) {
  const { isAuthenticated } = useAdminAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`)
    return <Navigate to={`/admin/login?next=${next}`} replace />
  }

  return children
}

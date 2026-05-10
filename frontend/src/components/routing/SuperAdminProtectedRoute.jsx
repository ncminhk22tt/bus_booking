import { Navigate, useLocation } from "react-router-dom"
import { useSuperAdminAuth } from "../../context/SuperAdminAuthContext"

export function SuperAdminProtectedRoute({ children }) {
  const { isAuthenticated } = useSuperAdminAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`)
    return <Navigate to={`/super-admin/login?next=${next}`} replace />
  }

  return children
}

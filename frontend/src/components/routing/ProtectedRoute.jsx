import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"

export function ProtectedRoute({ children }) {
  const { loading, isAuthenticated } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center px-4">
        <div className="glass-panel rounded-2xl border border-white/70 px-5 py-4 text-sm text-slate-600 shadow-card">
          Dang tai thong tin tai khoan...
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`)
    return <Navigate to={`/login?next=${next}`} replace />
  }

  return children
}

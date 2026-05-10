import { Outlet, useLocation } from "react-router-dom"
import { useSuperAdminAuth } from "../../context/SuperAdminAuthContext"

export function SuperAdminLayout() {
  const { isAuthenticated, logout } = useSuperAdminAuth()
  const location = useLocation()
  const isLoginPage = location.pathname === "/super-admin/login"

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-100">
      <main className={`w-full flex-1 px-6 py-6 md:px-10 ${isLoginPage ? "overflow-auto" : "min-h-0 overflow-hidden"}`}>
        <Outlet />
      </main>

      {isAuthenticated && !isLoginPage && (
        <button
          type="button"
          onClick={logout}
          className="fixed bottom-4 left-4 z-40 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Đăng xuất
        </button>
      )}
    </div>
  )
}

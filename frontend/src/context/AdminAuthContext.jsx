import { createContext, useContext, useMemo, useState } from "react"
import { adminApi, getAdminAuthToken, setAdminAuthToken } from "../lib/adminApi"

const AdminAuthContext = createContext(null)

export function AdminAuthProvider({ children }) {
  const [token, setToken] = useState(() => getAdminAuthToken())

  async function login(phone, password) {
    const result = await adminApi.login({ phone, password })
    setAdminAuthToken(result.token)
    setToken(result.token)
    return result
  }

  function logout() {
    setAdminAuthToken(null)
    setToken(null)
  }

  const value = useMemo(
    () => ({
      token,
      isAuthenticated: Boolean(token),
      login,
      logout
    }),
    [token]
  )

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (!context) {
    throw new Error("useAdminAuth must be used inside AdminAuthProvider")
  }
  return context
}

import { createContext, useContext, useMemo, useState } from "react"
import {
  getSuperAdminAuthToken,
  setSuperAdminAuthToken,
  superAdminApi
} from "../lib/superAdminApi"

const SuperAdminAuthContext = createContext(null)

export function SuperAdminAuthProvider({ children }) {
  const [token, setToken] = useState(() => getSuperAdminAuthToken())

  async function login(phone, password) {
    const result = await superAdminApi.login({ phone, password })
    setSuperAdminAuthToken(result.token)
    setToken(result.token)
    return result
  }

  function logout() {
    setSuperAdminAuthToken(null)
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

  return <SuperAdminAuthContext.Provider value={value}>{children}</SuperAdminAuthContext.Provider>
}

export function useSuperAdminAuth() {
  const context = useContext(SuperAdminAuthContext)
  if (!context) {
    throw new Error("useSuperAdminAuth must be used inside SuperAdminAuthProvider")
  }
  return context
}

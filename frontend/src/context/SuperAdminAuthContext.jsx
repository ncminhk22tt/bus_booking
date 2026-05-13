import { createContext, useContext, useEffect, useMemo, useState } from "react"
import {
  getSuperAdminAuthToken,
  setSuperAdminAuthToken,
  superAdminApi
} from "../lib/superAdminApi"

const SuperAdminAuthContext = createContext(null)

function parseJwt(token) {
  if (!token) return null

  try {
    const base64Payload = token.split(".")[1]
    if (!base64Payload) return null
    const decodedPayload = atob(base64Payload.replace(/-/g, "+").replace(/_/g, "/"))
    const jsonPayload = decodeURIComponent(
      decodedPayload
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

function getValidSuperAdminToken() {
  const token = getSuperAdminAuthToken()
  const decoded = parseJwt(token)
  if (!decoded?.exp) return null
  if (Date.now() >= decoded.exp * 1000) {
    setSuperAdminAuthToken(null)
    return null
  }
  return token
}

export function SuperAdminAuthProvider({ children }) {
  const [token, setToken] = useState(() => getValidSuperAdminToken())

  useEffect(() => {
    const handleLogout = () => setToken(null)
    window.addEventListener("super-admin-logout", handleLogout)
    return () => window.removeEventListener("super-admin-logout", handleLogout)
  }, [])

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

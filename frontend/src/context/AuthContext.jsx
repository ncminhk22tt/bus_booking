import { createContext, useContext, useEffect, useState } from "react"
import { api, getAuthToken, setAuthToken } from "../lib/api"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getAuthToken())
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(Boolean(getAuthToken()))

  useEffect(() => {
    let cancelled = false

    async function loadProfile() {
      if (!token) {
        setProfile(null)
        setLoading(false)
        return
      }

      try {
        const me = await api.getProfile()
        if (!cancelled) {
          setProfile(me)
        }
      } catch (error) {
        if (!cancelled) {
          setAuthToken(null)
          setToken(null)
          setProfile(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadProfile()

    return () => {
      cancelled = true
    }
  }, [token])

  async function login(phone, password) {
    const result = await api.loginCustomer({ phone, password })
    setAuthToken(result.token)
    setToken(result.token)
    const me = await api.getProfile()
    setProfile(me)
    return result
  }

  async function register(payload) {
    return api.registerCustomer(payload)
  }

  function logout() {
    setAuthToken(null)
    setToken(null)
    setProfile(null)
  }

  async function refreshProfile() {
    const me = await api.getProfile()
    setProfile(me)
    return me
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        profile,
        loading,
        isAuthenticated: Boolean(token),
        login,
        register,
        logout,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider")
  }
  return context
}

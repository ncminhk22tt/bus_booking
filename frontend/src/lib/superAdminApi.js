const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"

async function request(path, options = {}) {
  const { headers: customHeaders = {}, ...restOptions } = options
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...restOptions,
    headers: {
      "Content-Type": "application/json",
      ...customHeaders
    }
  })

  const contentType = response.headers.get("content-type") || ""
  const body = contentType.includes("application/json") ? await response.json() : await response.text()

  if (!response.ok) {
    const message = typeof body === "object" && body?.message ? body.message : "Yêu cầu thất bại"
    throw new Error(message)
  }

  return body
}

const SUPER_ADMIN_TOKEN_KEY = "super_admin_token"

export function setSuperAdminAuthToken(token) {
  if (token) {
    localStorage.setItem(SUPER_ADMIN_TOKEN_KEY, token)
  } else {
    localStorage.removeItem(SUPER_ADMIN_TOKEN_KEY)
  }
}

export function getSuperAdminAuthToken() {
  return localStorage.getItem(SUPER_ADMIN_TOKEN_KEY)
}

function authHeaders() {
  const token = getSuperAdminAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const superAdminApi = {
  login(payload) {
    return request("/api/superadmin/login", {
      method: "POST",
      body: JSON.stringify(payload)
    })
  },
  getOverview() {
    return request("/api/superadmin/overview", { headers: authHeaders() })
  },
  createAdmin(payload) {
    return request("/api/superadmin/create-admin", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload)
    })
  },
  getAdmins() {
    return request("/api/superadmin/admins", { headers: authHeaders() })
  },
  setAdminActive(id, isActive) {
    return request(`/api/superadmin/admins/${id}/active`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ is_active: isActive ? 1 : 0 })
    })
  },
  setAdminRole(id, role) {
    return request(`/api/superadmin/admins/${id}/role`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ role })
    })
  },
  resetAdminPassword(id, newPassword) {
    return request(`/api/superadmin/admins/${id}/reset-password`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ new_password: newPassword })
    })
  },
  getCompanies() {
    return request("/api/superadmin/companies", { headers: authHeaders() })
  },
  updateCompany(id, payload) {
    return request(`/api/superadmin/companies/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(payload)
    })
  },
  setCompanyActive(id, isActive) {
    return request(`/api/superadmin/companies/${id}/active`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ is_active: isActive ? 1 : 0 })
    })
  },
  deleteCompany(id) {
    return request(`/api/superadmin/companies/${id}`, {
      method: "DELETE",
      headers: authHeaders()
    })
  },
  getBusTypes() {
    return request("/api/superadmin/bus-types", { headers: authHeaders() })
  },
  createBusType(payload) {
    return request("/api/superadmin/bus-types", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload)
    })
  }
}

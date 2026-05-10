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

const ADMIN_TOKEN_KEY = "admin_token"

export function setAdminAuthToken(token) {
  if (token) {
    localStorage.setItem(ADMIN_TOKEN_KEY, token)
  } else {
    localStorage.removeItem(ADMIN_TOKEN_KEY)
  }
}

export function getAdminAuthToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY)
}

function authHeaders() {
  const token = getAdminAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const adminApi = {
  login(payload) {
    return request("/api/admin/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    })
  },
  updateProfile(payload) {
    return request("/api/admin/update-profile", {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(payload)
    })
  },
  getBusTypes() {
    return request("/api/admin/bus-types", { headers: authHeaders() })
  },
  getBuses() {
    return request("/api/admin/buses", { headers: authHeaders() })
  },
  createBus(payload) {
    return request("/api/admin/buses", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload)
    })
  },
  updateBus(id, payload) {
    return request(`/api/admin/buses/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(payload)
    })
  },
  deleteBus(id) {
    return request(`/api/admin/buses/${id}`, {
      method: "DELETE",
      headers: authHeaders()
    })
  },
  getRoutes() {
    return request("/api/admin/routes", { headers: authHeaders() })
  },
  createRoute(payload) {
    return request("/api/admin/routes", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload)
    })
  },
  updateRoute(id, payload) {
    return request(`/api/admin/routes/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(payload)
    })
  },
  deleteRoute(id) {
    return request(`/api/admin/routes/${id}`, {
      method: "DELETE",
      headers: authHeaders()
    })
  },
  getRoutePoints(routeId) {
    return request(`/api/admin/routes/${routeId}/points`, { headers: authHeaders() })
  },
  createRoutePickupPoint(routeId, payload) {
    return request(`/api/admin/routes/${routeId}/pickup-points`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload)
    })
  },
  createRouteDropoffPoint(routeId, payload) {
    return request(`/api/admin/routes/${routeId}/dropoff-points`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload)
    })
  },
  deleteRoutePickupPoint(routeId, pointId) {
    return request(`/api/admin/routes/${routeId}/pickup-points/${pointId}`, {
      method: "DELETE",
      headers: authHeaders()
    })
  },
  deleteRouteDropoffPoint(routeId, pointId) {
    return request(`/api/admin/routes/${routeId}/dropoff-points/${pointId}`, {
      method: "DELETE",
      headers: authHeaders()
    })
  },
  getTrips() {
    return request("/api/admin/trips", { headers: authHeaders() })
  },
  createTrip(payload) {
    return request("/api/admin/trips", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload)
    })
  },
  updateTrip(id, payload) {
    return request(`/api/admin/trips/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(payload)
    })
  },
  deleteTrip(id) {
    return request(`/api/admin/trips/${id}`, {
      method: "DELETE",
      headers: authHeaders()
    })
  },
  getTripSeats(id) {
    return request(`/api/admin/bookings/trips/${id}/seats`, { headers: authHeaders() })
  },
  getTripBookings(id) {
    return request(`/api/admin/bookings/trips/${id}`, { headers: authHeaders() })
  },
  getTripSeatStatus(id) {
    return request(`/api/admin/bookings/trips/${id}/seats`, { headers: authHeaders() })
  },
  updateTripSeatSettings(tripId, seatId, payload) {
    return request(`/api/admin/bookings/trips/${tripId}/seats/${seatId}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(payload)
    })
  }
}

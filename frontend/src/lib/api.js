const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000"

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
  const body = contentType.includes("application/json")
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    const message = typeof body === "object" && body?.message ? body.message : "Yeu cau that bai"
    throw new Error(message)
  }

  return body
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem("customer_token", token)
  } else {
    localStorage.removeItem("customer_token")
  }
}

export function getAuthToken() {
  return localStorage.getItem("customer_token")
}

function authHeaders() {
  const token = getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function toQueryString(params = {}) {
  const normalized = {}

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue
    normalized[key] = String(value)
  }

  return new URLSearchParams(normalized).toString()
}

export const api = {
  getCities() {
    return request("/api/cities")
  },
  registerCustomer(payload) {
    return request("/api/customers/register", {
      method: "POST",
      body: JSON.stringify(payload)
    })
  },
  loginCustomer(payload) {
    return request("/api/customers/login", {
      method: "POST",
      body: JSON.stringify(payload)
    })
  },
  getProfile() {
    return request("/api/customers/me", {
      headers: authHeaders()
    })
  },
  updateProfile(payload) {
    return request("/api/customers/profile", {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(payload)
    })
  },
  changePassword(payload) {
    return request("/api/customers/password", {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(payload)
    })
  },
  searchTrips(params) {
    return request(`/api/trips/search?${toQueryString(params)}`)
  },
  getSearchFilters(params) {
    return request(`/api/trips/search/filters?${toQueryString(params)}`)
  },
  getTripDetail(id) {
    return request(`/api/trips/${id}`)
  },
  getTripSeatMap(id) {
    return request(`/api/trips/${id}/seat-map`)
  },
  getSeatsByBus(busId, tripId) {
    const query = tripId ? `?trip_id=${tripId}` : ""
    return request(`/api/seats/${busId}${query}`)
  },
  selectSeats(payload) {
    return request("/api/seats/select", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload)
    })
  },
  bookSeats(payload) {
    return request("/api/seats/book", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload)
    })
  },
  createBooking(payload) {
    return request("/api/bookings", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload)
    })
  },
  getMyBookings(status) {
    const query = status ? `?status=${status}` : ""
    return request(`/api/bookings/me${query}`, {
      headers: authHeaders()
    })
  },
  getBookingDetail(id) {
    return request(`/api/bookings/${id}`, {
      headers: authHeaders()
    })
  },
  cancelBooking(id) {
    return request(`/api/bookings/${id}/cancel`, {
      method: "POST",
      headers: authHeaders()
    })
  },
  payBooking(id) {
    return request(`/api/bookings/${id}/pay`, {
      method: "POST",
      headers: authHeaders()
    })
  }
}

export { API_BASE_URL }

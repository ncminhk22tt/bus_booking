const path = require("path")
const dotenv = require("dotenv")
const bcrypt = require("bcryptjs")

dotenv.config({ path: path.join(__dirname, "..", ".env") })

const db = require("../src/config/db")
const app = require("../src/app")

function logStep(title) {
  console.log(`\n=== ${title} ===`)
}

async function registerCustomer(baseUrl, payload) {
  logStep("REGISTER")
  const res = await fetch(`${baseUrl}/api/customers/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
  const body = await res.json()
  console.log("REGISTER_STATUS", res.status)
  console.log("REGISTER_BODY", body)
  return { res, body }
}

async function loginCustomer(baseUrl, payload) {
  logStep("LOGIN")
  const res = await fetch(`${baseUrl}/api/customers/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
  const body = await res.json()
  console.log("LOGIN_STATUS", res.status)
  console.log("LOGIN_BODY", body)
  return { res, body }
}

async function findTripWithAvailableSeats() {
  logStep("FIND_TRIP_IN_DB")
  const [tripRows] = await db.query(`
    SELECT 
      trips.id AS trip_id,
      routes.departure_city_id,
      routes.arrival_city_id,
      DATE_FORMAT(trips.departure_time, '%Y-%m-%d') AS dep_date
    FROM trips
    JOIN routes ON trips.route_id = routes.id
    JOIN trip_seats ts ON ts.trip_id = trips.id AND ts.status = 'available'
    LIMIT 1
  `)

  if (tripRows.length === 0) {
    console.log("NO_TRIPS_WITH_AVAILABLE_SEATS")
    return null
  }

  return tripRows[0]
}

async function searchTrips(baseUrl, query) {
  logStep("SEARCH_TRIPS")
  const { departure_city_id, arrival_city_id, dep_date } = query
  const res = await fetch(`${baseUrl}/api/trips/search?from_city=${departure_city_id}&to_city=${arrival_city_id}&date=${dep_date}`)
  const body = await res.json()
  console.log("SEARCH_STATUS", res.status)
  console.log("SEARCH_BODY", body)
  return { res, body }
}

async function getTripDetail(baseUrl, tripId) {
  logStep("TRIP_DETAIL")
  const res = await fetch(`${baseUrl}/api/trips/${tripId}`)
  const body = await res.json()
  console.log("DETAIL_STATUS", res.status)
  console.log("DETAIL_BODY", body)
  return { res, body }
}

async function getSeats(baseUrl, tripId) {
  logStep("GET_SEATS")
  const res = await fetch(`${baseUrl}/api/trips/${tripId}/seats`)
  const body = await res.json()
  console.log("SEATS_STATUS", res.status)
  console.log("SEATS_COUNT", Array.isArray(body) ? body.length : body)
  return { res, body }
}

async function getSeatMap(baseUrl, tripId) {
  logStep("GET_SEAT_MAP")
  const res = await fetch(`${baseUrl}/api/trips/${tripId}/seat-map`)
  const body = await res.json()
  console.log("SEAT_MAP_STATUS", res.status)
  console.log("SEAT_MAP_BODY", body && body.meta ? body.meta : body)
  return { res, body }
}

async function bookSeats(baseUrl, token, tripId, seatIds) {
  logStep("BOOKING")
  const res = await fetch(`${baseUrl}/api/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ trip_id: tripId, seats: seatIds })
  })
  const body = await res.json()
  console.log("BOOKING_STATUS", res.status)
  console.log("BOOKING_BODY", body)
  return { res, body }
}

async function updateProfile(baseUrl, token, payload) {
  logStep("UPDATE_PROFILE")
  const res = await fetch(`${baseUrl}/api/customers/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  })
  const body = await res.json()
  console.log("UPDATE_PROFILE_STATUS", res.status)
  console.log("UPDATE_PROFILE_BODY", body)
  return { res, body }
}

async function changePassword(baseUrl, token, payload) {
  logStep("CHANGE_PASSWORD")
  const res = await fetch(`${baseUrl}/api/customers/password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  })
  const body = await res.json()
  console.log("CHANGE_PASSWORD_STATUS", res.status)
  console.log("CHANGE_PASSWORD_BODY", body)
  return { res, body }
}

async function getMyBookings(baseUrl, token, status) {
  logStep("GET_MY_BOOKINGS")
  const url = status ? `${baseUrl}/api/bookings/me?status=${status}` : `${baseUrl}/api/bookings/me`
  const res = await fetch(url, {
    headers: { "Authorization": `Bearer ${token}` }
  })
  const body = await res.json()
  console.log("BOOKINGS_STATUS", res.status)
  console.log("BOOKINGS_BODY", body)
  return { res, body }
}

async function getBookingDetail(baseUrl, token, bookingId) {
  logStep("BOOKING_DETAIL")
  const res = await fetch(`${baseUrl}/api/bookings/${bookingId}`, {
    headers: { "Authorization": `Bearer ${token}` }
  })
  const body = await res.json()
  console.log("DETAIL_STATUS", res.status)
  console.log("DETAIL_BODY", body)
  return { res, body }
}

async function payBooking(baseUrl, token, bookingId) {
  logStep("PAY_BOOKING")
  const res = await fetch(`${baseUrl}/api/bookings/${bookingId}/pay`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}` }
  })
  const body = await res.json()
  console.log("PAY_STATUS", res.status)
  console.log("PAY_BODY", body)
  return { res, body }
}

async function cancelBooking(baseUrl, token, bookingId) {
  logStep("CANCEL_BOOKING")
  const res = await fetch(`${baseUrl}/api/bookings/${bookingId}/cancel`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}` }
  })
  const body = await res.json()
  console.log("CANCEL_STATUS", res.status)
  console.log("CANCEL_BODY", body)
  return { res, body }
}

async function ensureSuperAdmin(phone, password) {
  const [rows] = await db.query(
    "SELECT id FROM admins WHERE phone = ? AND role = 'super_admin' LIMIT 1",
    [phone]
  )
  if (rows.length > 0) return rows[0].id

  const hashed = await bcrypt.hash(password, 10)
  const [result] = await db.query(
    "INSERT INTO admins (phone, password, role) VALUES (?,?, 'super_admin')",
    [phone, hashed]
  )
  return result.insertId
}

async function loginSuperAdmin(baseUrl, payload) {
  logStep("SUPERADMIN_LOGIN")
  const res = await fetch(`${baseUrl}/api/superadmin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
  const body = await res.json()
  console.log("SUPERADMIN_STATUS", res.status)
  console.log("SUPERADMIN_BODY", body)
  return { res, body }
}

async function createAdminBySuperAdmin(baseUrl, token, payload) {
  logStep("SUPERADMIN_CREATE_ADMIN")
  const res = await fetch(`${baseUrl}/api/superadmin/create-admin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  })
  const body = await res.json()
  console.log("CREATE_ADMIN_STATUS", res.status)
  console.log("CREATE_ADMIN_BODY", body)
  return { res, body }
}

async function listCompanies(baseUrl, token) {
  logStep("SUPERADMIN_LIST_COMPANIES")
  const res = await fetch(`${baseUrl}/api/superadmin/companies`, {
    headers: { "Authorization": `Bearer ${token}` }
  })
  const body = await res.json()
  console.log("COMPANIES_STATUS", res.status)
  console.log("COMPANIES_BODY", body)
  return { res, body }
}

async function listAdmins(baseUrl, token) {
  logStep("SUPERADMIN_LIST_ADMINS")
  const res = await fetch(`${baseUrl}/api/superadmin/admins`, {
    headers: { "Authorization": `Bearer ${token}` }
  })
  const body = await res.json()
  console.log("ADMINS_STATUS", res.status)
  console.log("ADMINS_BODY", body)
  return { res, body }
}

async function loginAdmin(baseUrl, payload) {
  logStep("ADMIN_LOGIN")
  const res = await fetch(`${baseUrl}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
  const body = await res.json()
  console.log("ADMIN_LOGIN_STATUS", res.status)
  console.log("ADMIN_LOGIN_BODY", body)
  return { res, body }
}

async function adminTripBookings(baseUrl, token, tripId) {
  logStep("ADMIN_TRIP_BOOKINGS")
  const res = await fetch(`${baseUrl}/api/admin/trips/${tripId}/bookings`, {
    headers: { "Authorization": `Bearer ${token}` }
  })
  const body = await res.json()
  console.log("ADMIN_TRIP_BOOKINGS_STATUS", res.status)
  console.log("ADMIN_TRIP_BOOKINGS_BODY", body)
  return { res, body }
}

async function adminTripSeats(baseUrl, token, tripId) {
  logStep("ADMIN_TRIP_SEATS")
  const res = await fetch(`${baseUrl}/api/admin/trips/${tripId}/seats`, {
    headers: { "Authorization": `Bearer ${token}` }
  })
  const body = await res.json()
  console.log("ADMIN_TRIP_SEATS_STATUS", res.status)
  console.log("ADMIN_TRIP_SEATS_BODY", body)
  return { res, body }
}

async function adminBusTypes(baseUrl, token) {
  logStep("ADMIN_BUS_TYPES")
  const res = await fetch(`${baseUrl}/api/admin/bus-types`, {
    headers: { "Authorization": `Bearer ${token}` }
  })
  const body = await res.json()
  console.log("ADMIN_BUS_TYPES_STATUS", res.status)
  console.log("ADMIN_BUS_TYPES_BODY", body)
  return { res, body }
}

async function cleanup(bookingId, seatIds, phone, adminPhone, companyName, superAdminPhone) {
  logStep("CLEANUP")
  if (bookingId) {
    await db.query("DELETE FROM tickets WHERE booking_id = ?", [bookingId])
    await db.query("DELETE FROM bookings WHERE id = ?", [bookingId])
  }
  if (seatIds.length > 0) {
    await db.query(`UPDATE trip_seats SET status='available' WHERE id IN (${seatIds.map(() => "?").join(",")})`, seatIds)
  }
  const [custRows] = await db.query("SELECT id FROM customers WHERE phone = ? LIMIT 1", [phone])
  if (custRows.length > 0) {
    await db.query("DELETE FROM customers WHERE id = ?", [custRows[0].id])
  }
  if (adminPhone) {
    await db.query("DELETE FROM admins WHERE phone = ?", [adminPhone])
  }
  if (companyName) {
    await db.query("DELETE FROM bus_companies WHERE name = ?", [companyName])
  }
  if (superAdminPhone) {
    await db.query("DELETE FROM admins WHERE phone = ? AND role = 'super_admin'", [superAdminPhone])
  }
}

async function main() {
  const server = app.listen(0, async () => {
    const { port } = server.address()
    const baseUrl = `http://127.0.0.1:${port}`

    const phone = `09${Math.floor(Date.now() / 1000).toString().slice(-8)}`
    const registerPayload = { name: "Test Customer", phone, password: "12345678" }

    const superAdminPhone = `090${Math.floor(Date.now() / 1000).toString().slice(-7)}`
    const superAdminPassword = "12345678"
    const adminPhone = `091${Math.floor(Date.now() / 1000).toString().slice(-7)}`
    const adminPassword = "12345678"
    const companyName = `Company ${Date.now()}`

    let bookingId = null
    let reservedSeatIds = []

    try {
      await registerCustomer(baseUrl, registerPayload)

      const loginResult = await loginCustomer(baseUrl, { phone, password: "12345678" })
      const token = loginResult.body.token
      if (!token) {
        throw new Error("No token from login")
      }

      const trip = await findTripWithAvailableSeats()
      if (!trip) {
        server.close()
        return
      }

      await searchTrips(baseUrl, trip)
      await getTripDetail(baseUrl, trip.trip_id)

      const seatsResult = await getSeats(baseUrl, trip.trip_id)
      await getSeatMap(baseUrl, trip.trip_id)

      const availableSeats = Array.isArray(seatsResult.body)
        ? seatsResult.body.filter(s => s.status === "available").slice(0, 2)
        : []

      if (availableSeats.length === 0) {
        console.log("NO_AVAILABLE_SEATS")
        server.close()
        return
      }

      reservedSeatIds = availableSeats.map(s => s.id)

      const bookingResult = await bookSeats(baseUrl, token, trip.trip_id, reservedSeatIds)
      bookingId = bookingResult.body.booking_id || null

      if (bookingId) {
        await getMyBookings(baseUrl, token)
        await getMyBookings(baseUrl, token, "confirmed")
        await getBookingDetail(baseUrl, token, bookingId)
        await payBooking(baseUrl, token, bookingId)
        await cancelBooking(baseUrl, token, bookingId)
      }

      await updateProfile(baseUrl, token, { name: "Test Customer Updated" })
      await changePassword(baseUrl, token, {
        current_password: "12345678",
        new_password: "123456789"
      })

      // Super admin + admin tests
      await ensureSuperAdmin(superAdminPhone, superAdminPassword)
      const superLogin = await loginSuperAdmin(baseUrl, { phone: superAdminPhone, password: superAdminPassword })
      const superToken = superLogin.body.token
      if (superToken) {
        await listCompanies(baseUrl, superToken)
        await listAdmins(baseUrl, superToken)
        await createAdminBySuperAdmin(baseUrl, superToken, {
          phone: adminPhone,
          password: adminPassword,
          company_name: companyName,
          address: "Test Address"
        })
      }

      const adminLogin = await loginAdmin(baseUrl, { phone: adminPhone, password: adminPassword })
      const adminToken = adminLogin.body.token
      if (adminToken) {
        await adminTripBookings(baseUrl, adminToken, trip.trip_id)
        await adminTripSeats(baseUrl, adminToken, trip.trip_id)
        await adminBusTypes(baseUrl, adminToken)
      }

    } catch (e) {
      console.error("TEST_ERROR", e.message || e)
    } finally {
      await cleanup(bookingId, reservedSeatIds, phone, adminPhone, companyName, superAdminPhone)
      server.close()
    }
  })
}

main()

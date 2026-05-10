const path = require("path")
const dotenv = require("dotenv")
const bcrypt = require("bcryptjs")

dotenv.config({ path: path.join(__dirname, "..", ".env") })

const db = require("../src/config/db")
const seatService = require("../src/services/seatService")
const { generateTripSeats } = require("../src/services/tripSeatService")

function formatDateTime(date) {
  const pad = (n) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

async function getOrCreateCity(name, region) {
  const [rows] = await db.query("SELECT id FROM cities WHERE name = ? LIMIT 1", [name])
  if (rows.length > 0) return rows[0].id

  const [result] = await db.query(
    "INSERT INTO cities (name, region) VALUES (?, ?)",
    [name, region || null]
  )
  return result.insertId
}

async function getOrCreateBusCompany(name, index) {
  const [rows] = await db.query("SELECT id FROM bus_companies WHERE name = ? LIMIT 1", [name])
  if (rows.length > 0) return rows[0].id

  const phone = `09${String(11111111 + index).slice(-8)}`
  const [result] = await db.query(
    "INSERT INTO bus_companies (name, phone, address) VALUES (?, ?, ?)",
    [name, phone, `${name} - Văn phòng trung tâm`]
  )
  return result.insertId
}

async function getOrCreateBusType(item) {
  const [rows] = await db.query(
    "SELECT id, name, floors, row_count, seat_type, layout FROM bus_types WHERE name = ? LIMIT 1",
    [item.name]
  )
  if (rows.length > 0) return rows[0]

  const [left, right] = item.layout.split("-").map(Number)
  const totalSeats = item.floors * item.row_count * (left + right)
  const colCount = left + right + 1

  const [result] = await db.query(
    `
    INSERT INTO bus_types
      (name, description, floors, row_count, col_count, total_seats, seat_type, layout)
    VALUES (?,?,?,?,?,?,?,?)
    `,
    [
      item.name,
      item.description,
      item.floors,
      item.row_count,
      colCount,
      totalSeats,
      item.seat_type,
      item.layout
    ]
  )

  return {
    id: result.insertId,
    name: item.name,
    floors: item.floors,
    row_count: item.row_count,
    seat_type: item.seat_type,
    layout: item.layout
  }
}

async function getOrCreateRoute(companyId, fromCityId, toCityId, distanceKm, estimatedHour) {
  const [rows] = await db.query(
    `
    SELECT id, distance_km, estimated_time
    FROM routes
    WHERE bus_company_id = ? AND departure_city_id = ? AND arrival_city_id = ?
    LIMIT 1
    `,
    [companyId, fromCityId, toCityId]
  )

  if (rows.length > 0) return rows[0]

  const [result] = await db.query(
    `
    INSERT INTO routes (bus_company_id, departure_city_id, arrival_city_id, distance_km, estimated_time)
    VALUES (?, ?, ?, ?, ?)
    `,
    [companyId, fromCityId, toCityId, distanceKm, estimatedHour]
  )

  return {
    id: result.insertId,
    distance_km: distanceKm,
    estimated_time: estimatedHour
  }
}

async function createBus(companyId, busType, index) {
  const plate = `51B-${String(Date.now()).slice(-5)}${String(index).padStart(2, "0")}`
  const [result] = await db.query(
    `
    INSERT INTO buses (bus_company_id, bus_type_id, name, license_plate, status)
    VALUES (?, ?, ?, ?, 'active')
    `,
    [companyId, busType.id, `${busType.name} #${index + 1}`, plate]
  )

  const busId = result.insertId
  await seatService.createSeatMap(busId, busType)
  return busId
}

async function createTrip(busId, route, departure, price, status = "open") {
  const arrival = new Date(departure.getTime() + route.estimated_time * 60 * 60 * 1000)
  const [result] = await db.query(
    `
    INSERT INTO trips (bus_id, route_id, departure_time, arrival_time, price, status)
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [busId, route.id, formatDateTime(departure), formatDateTime(arrival), price, status]
  )
  const tripId = result.insertId
  await generateTripSeats(tripId, busId)
  return tripId
}

async function getOrCreateCustomer(index) {
  const phone = `0988${String(100000 + index).slice(-6)}`
  const [exists] = await db.query("SELECT id FROM customers WHERE phone = ? LIMIT 1", [phone])
  if (exists.length > 0) return exists[0].id

  const hashed = await bcrypt.hash("123456", 10)
  const [result] = await db.query(
    "INSERT INTO customers (name, phone, password) VALUES (?, ?, ?)",
    [`Khách hàng mẫu ${index + 1}`, phone, hashed]
  )
  return result.insertId
}

async function createBooking(customerId, tripId, status) {
  const [tripRows] = await db.query("SELECT price FROM trips WHERE id = ? LIMIT 1", [tripId])
  if (tripRows.length === 0) return false

  const [seatRows] = await db.query(
    `
    SELECT id, seat_id
    FROM trip_seats
    WHERE trip_id = ? AND status = 'available'
    ORDER BY id ASC
    LIMIT 1
    `,
    [tripId]
  )

  if (seatRows.length === 0) return false

  const seat = seatRows[0]
  const seatPrice = Number(tripRows[0].price)

  const [bookingResult] = await db.query(
    `
    INSERT INTO bookings (customer_id, trip_id, total_price, status)
    VALUES (?, ?, ?, ?)
    `,
    [customerId, tripId, seatPrice, status]
  )

  const ticketStatus = status === "pending" ? "reserved" : "confirmed"
  await db.query(
    `
    INSERT INTO tickets (booking_id, trip_id, seat_id, price, status)
    VALUES (?, ?, ?, ?, ?)
    `,
    [bookingResult.insertId, tripId, seat.seat_id, seatPrice, ticketStatus]
  )

  await db.query(
    "UPDATE trip_seats SET status = 'booked' WHERE id = ?",
    [seat.id]
  )

  return true
}

async function main() {
  const cityDefs = [
    ["Hồ Chí Minh", "Miền Nam"],
    ["Hà Nội", "Miền Bắc"],
    ["Đà Nẵng", "Miền Trung"],
    ["Cần Thơ", "Miền Nam"],
    ["Gia Lai", "Tây Nguyên"],
    ["Nha Trang", "Miền Trung"],
    ["Huế", "Miền Trung"],
    ["Đà Lạt", "Tây Nguyên"],
    ["Vũng Tàu", "Miền Nam"],
    ["Quy Nhơn", "Miền Trung"]
  ]

  const companyNames = [
    "Nhà xe Sao Việt",
    "Nhà xe Thành Công",
    "Nhà xe Bình Minh",
    "Nhà xe Hoàng Gia"
  ]

  const busTypeDefs = [
    {
      name: "Ghế ngồi 16 chỗ",
      description: "Xe ghế ngồi tiêu chuẩn",
      floors: 1,
      row_count: 4,
      seat_type: "seat",
      layout: "2-2"
    },
    {
      name: "Giường nằm 34 chỗ",
      description: "Xe giường nằm 2 tầng",
      floors: 2,
      row_count: 6,
      seat_type: "bed",
      layout: "2-1"
    },
    {
      name: "Limousine VIP 22 chỗ",
      description: "Xe limousine cao cấp",
      floors: 1,
      row_count: 6,
      seat_type: "seat",
      layout: "2-2"
    }
  ]

  const routeDefs = [
    ["Hồ Chí Minh", "Gia Lai", 550, 10],
    ["Gia Lai", "Hồ Chí Minh", 550, 10],
    ["Hồ Chí Minh", "Nha Trang", 430, 8],
    ["Nha Trang", "Hồ Chí Minh", 430, 8],
    ["Hà Nội", "Đà Nẵng", 760, 13],
    ["Đà Nẵng", "Hà Nội", 760, 13],
    ["Đà Nẵng", "Huế", 100, 3],
    ["Huế", "Đà Nẵng", 100, 3],
    ["Cần Thơ", "Vũng Tàu", 230, 5],
    ["Vũng Tàu", "Cần Thơ", 230, 5],
    ["Đà Lạt", "Hồ Chí Minh", 310, 7],
    ["Hồ Chí Minh", "Đà Lạt", 310, 7],
    ["Quy Nhơn", "Hồ Chí Minh", 650, 11],
    ["Hồ Chí Minh", "Quy Nhơn", 650, 11]
  ]

  const cityMap = {}
  for (const [name, region] of cityDefs) {
    cityMap[name] = await getOrCreateCity(name, region)
  }

  const companyIds = []
  for (let i = 0; i < companyNames.length; i++) {
    const id = await getOrCreateBusCompany(companyNames[i], i)
    companyIds.push(id)
  }

  const busTypes = []
  for (const def of busTypeDefs) {
    const item = await getOrCreateBusType(def)
    busTypes.push(item)
  }

  const routes = []
  for (let i = 0; i < routeDefs.length; i++) {
    const [fromName, toName, distanceKm, estimatedHour] = routeDefs[i]
    const ownerCompanyId = companyIds[i % companyIds.length]
    const route = await getOrCreateRoute(
      ownerCompanyId,
      cityMap[fromName],
      cityMap[toName],
      distanceKm,
      estimatedHour
    )
    routes.push(route)
  }

  const busIds = []
  for (let i = 0; i < 10; i++) {
    const companyId = companyIds[i % companyIds.length]
    const busType = busTypes[i % busTypes.length]
    const busId = await createBus(companyId, busType, i)
    busIds.push(busId)
  }

  const tripIds = []
  const now = new Date()
  for (let i = 0; i < 20; i++) {
    const route = routes[i % routes.length]
    const busId = busIds[i % busIds.length]

    const departure = new Date(now.getTime())
    departure.setDate(now.getDate() + 1 + Math.floor(i / 4))
    departure.setHours(5 + (i % 6) * 3, randomInt(0, 1) * 30, 0, 0)

    const price = randomInt(180000, 650000)
    const tripId = await createTrip(busId, route, departure, price, "open")
    tripIds.push(tripId)
  }

  const customerIds = []
  for (let i = 0; i < 12; i++) {
    const customerId = await getOrCreateCustomer(i)
    customerIds.push(customerId)
  }

  let bookingCount = 0
  for (let i = 0; i < 20; i++) {
    const customerId = customerIds[i % customerIds.length]
    const tripId = tripIds[i % tripIds.length]
    const status = i % 4 === 0 ? "pending" : "confirmed"
    const ok = await createBooking(customerId, tripId, status)
    if (ok) bookingCount++
  }

  console.log("SEED_BULK_OK", {
    cities: cityDefs.length,
    companies: companyNames.length,
    bus_types: busTypeDefs.length,
    buses: busIds.length,
    routes: routes.length,
    trips: tripIds.length,
    customers: customerIds.length,
    bookings: bookingCount,
    default_test_password: "123456"
  })
}

main()
  .catch((error) => {
    console.error("SEED_BULK_ERROR", error.message || error)
    process.exit(1)
  })
  .finally(async () => {
    try {
      await db.end()
    } catch (err) {
      // no-op
    }
  })




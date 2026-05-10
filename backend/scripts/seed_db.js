const path = require("path")
const dotenv = require("dotenv")

dotenv.config({ path: path.join(__dirname, "..", ".env") })

const db = require("../src/config/db")
const seatService = require("../src/services/seatService")
const { generateTripSeats } = require("../src/services/tripSeatService")

function formatDateTime(d) {
  const pad = (n) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

async function getOrCreateCity(name) {
  const [rows] = await db.query("SELECT id FROM cities WHERE name = ? LIMIT 1", [name])
  if (rows.length > 0) return rows[0].id

  const [result] = await db.query("INSERT INTO cities (name) VALUES (?)", [name])
  return result.insertId
}

async function getOrCreateRoute(busCompanyId, departureCityId, arrivalCityId) {
  const [rows] = await db.query(
    "SELECT id FROM routes WHERE bus_company_id = ? AND departure_city_id = ? AND arrival_city_id = ? LIMIT 1",
    [busCompanyId, departureCityId, arrivalCityId]
  )
  if (rows.length > 0) return rows[0].id

  const [result] = await db.query(
    "INSERT INTO routes (bus_company_id, departure_city_id, arrival_city_id, distance_km, estimated_time) VALUES (?,?,?,?,?)",
    [busCompanyId, departureCityId, arrivalCityId, 550, 8]
  )
  return result.insertId
}

async function getOrCreateBusCompany() {
  const name = "Nhà xe Seed"
  const [rows] = await db.query("SELECT id FROM bus_companies WHERE name = ? LIMIT 1", [name])
  if (rows.length > 0) return rows[0].id

  const [result] = await db.query(
    "INSERT INTO bus_companies (name, phone, address) VALUES (?,?,?)",
    [name, `09${Math.floor(Date.now() / 1000).toString().slice(-8)}`, "Seed Address"]
  )
  return result.insertId
}

async function getOrCreateBusType() {
  const name = "Xe ghế ngồi 16 chỗ Seed"
  const [rows] = await db.query("SELECT id, layout, floors, row_count, seat_type FROM bus_types WHERE name = ? LIMIT 1", [name])
  if (rows.length > 0) return rows[0]

  const layout = "2-2"
  const floors = 1
  const row_count = 4
  const left = 2
  const right = 2
  const total_seats = floors * row_count * (left + right)
  const col_count = left + right + 1

  const [result] = await db.query(
    `INSERT INTO bus_types (name, description, floors, row_count, col_count, total_seats, seat_type, layout)
     VALUES (?,?,?,?,?,?,?,?)`,
    [name, "Seed type", floors, row_count, col_count, total_seats, "seat", layout]
  )

  return { id: result.insertId, layout, floors, row_count, seat_type: "seat" }
}

async function createBus(busCompanyId, busType) {
  const license_plate = `SEED-${Date.now()}`
  const [result] = await db.query(
    "INSERT INTO buses (bus_company_id, bus_type_id, name, license_plate) VALUES (?,?,?,?)",
    [busCompanyId, busType.id, "Xe Seed", license_plate]
  )
  return result.insertId
}

async function createTrip(busId, routeId) {
  const now = new Date()
  const departure = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  departure.setHours(8, 0, 0, 0)
  const arrival = new Date(departure.getTime() + 6 * 60 * 60 * 1000)

  const [result] = await db.query(
    "INSERT INTO trips (bus_id, route_id, departure_time, arrival_time, price) VALUES (?,?,?,?,?)",
    [busId, routeId, formatDateTime(departure), formatDateTime(arrival), 350000]
  )
  return result.insertId
}

async function main() {
  const fromCity = await getOrCreateCity("Gia Lai")
  const toCity = await getOrCreateCity("Ho Chi Minh")
  const busCompanyId = await getOrCreateBusCompany()
  const routeId = await getOrCreateRoute(busCompanyId, fromCity, toCity)
  const busType = await getOrCreateBusType()

  const busId = await createBus(busCompanyId, busType)
  await seatService.createSeatMap(busId, busType)

  const tripId = await createTrip(busId, routeId)
  await generateTripSeats(tripId, busId)

  console.log("SEED_OK", { fromCity, toCity, routeId, busCompanyId, busTypeId: busType.id, busId, tripId })
}

main().catch((e) => {
  console.error("SEED_ERROR", e.message || e)
  process.exit(1)
})

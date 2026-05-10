const db = require("../../config/db")
async function hasTripSeatVipColumn() {
  const [rows] = await db.query("SHOW COLUMNS FROM trip_seats LIKE 'is_vip'")
  return rows.length > 0
}

function normalizeSeatNumberByFloor(seatNumber, floor) {
  const raw = String(seatNumber || "").trim()
  if (!raw) return raw

  const floorNum = Number(floor)
  const floorPrefix = floorNum === 2 ? "B" : "A"

  if (floorNum === 2 && /^A/i.test(raw)) return `B${raw.slice(1)}`
  if (floorNum === 1 && /^B/i.test(raw)) return `A${raw.slice(1)}`
  if (!/^[AB]/i.test(raw)) return `${floorPrefix}${raw}`
  return raw
}

async function createBookingWithTickets(connection, {
  customerId,
  contactName = null,
  contactPhone = null,
  tripId,
  totalPrice,
  ticketItems = [],
  seatIds = [],
  seatPrice,
  bookingStatus = "confirmed",
  ticketStatus = "confirmed"
}) {
  const [bookingResult] = await connection.query(
    `
    INSERT INTO bookings
    (customer_id, contact_name, contact_phone, trip_id, total_price, status)
    VALUES (?,?,?,?,?,?)
    `,
    [customerId, contactName, contactPhone, tripId, totalPrice, bookingStatus]
  )

  const bookingId = bookingResult.insertId

  const normalizedItems = ticketItems.length
    ? ticketItems
    : seatIds.map((seatId) => ({
        seatId,
        price: seatPrice,
        status: ticketStatus
      }))

  const ticketValues = normalizedItems.map((item) => [
    bookingId,
    tripId,
    item.seatId,
    item.price,
    item.status || ticketStatus
  ])

  await connection.query(
    `
    INSERT INTO tickets (booking_id, trip_id, seat_id, price, status)
    VALUES ?
    `,
    [ticketValues]
  )

  return bookingId
}

async function getBookingsWithTickets(customerId, status) {
  const params = [customerId]
  let statusFilter = ""
  if (status) {
    statusFilter = " AND b.status = ?"
    params.push(status)
  }

  const [rows] = await db.query(
    `
    SELECT 
      b.id AS booking_id,
      b.trip_id,
      b.total_price,
      b.status AS booking_status,
      b.created_at,
      tr.departure_time,
      tr.arrival_time,
      tr.price AS trip_base_price,
      bs.name AS bus_name,
      bs.license_plate,
      bs.image_url AS bus_image_url,
      bt.name AS bus_type_name,
      bc.name AS bus_company_name,
      dep.name AS departure_city,
      arr.name AS arrival_city,
      r.estimated_time,
      t.id AS ticket_id,
      t.seat_id,
      s.seat_number,
      s.floor AS seat_floor,
      t.price AS ticket_price,
      t.status AS ticket_status
    FROM bookings b
    JOIN trips tr ON tr.id = b.trip_id
    JOIN buses bs ON bs.id = tr.bus_id
    LEFT JOIN bus_types bt ON bt.id = bs.bus_type_id
    LEFT JOIN bus_companies bc ON bc.id = bs.bus_company_id
    LEFT JOIN routes r ON r.id = tr.route_id
    LEFT JOIN cities dep ON dep.id = r.departure_city_id
    LEFT JOIN cities arr ON arr.id = r.arrival_city_id
    LEFT JOIN tickets t ON t.booking_id = b.id
    LEFT JOIN seats s ON s.id = t.seat_id
    WHERE b.customer_id = ?${statusFilter}
    ORDER BY b.created_at DESC, t.id ASC
    `,
    params
  )

  const map = new Map()
  for (const row of rows) {
    if (!map.has(row.booking_id)) {
      map.set(row.booking_id, {
        booking_id: row.booking_id,
        trip_id: row.trip_id,
        total_price: row.total_price,
        status: row.booking_status,
        created_at: row.created_at,
        departure_time: row.departure_time,
        arrival_time: row.arrival_time,
        trip_base_price: row.trip_base_price,
        bus_name: row.bus_name,
        license_plate: row.license_plate,
        bus_image_url: row.bus_image_url,
        bus_type_name: row.bus_type_name,
        bus_company_name: row.bus_company_name,
        departure_city: row.departure_city,
        arrival_city: row.arrival_city,
        estimated_time: row.estimated_time,
        tickets: []
      })
    }
    if (row.ticket_id) {
      map.get(row.booking_id).tickets.push({
        ticket_id: row.ticket_id,
        seat_id: row.seat_id,
        seat_number: normalizeSeatNumberByFloor(row.seat_number, row.seat_floor),
        price: row.ticket_price,
        status: row.ticket_status
      })
    }
  }

  return Array.from(map.values())
}

async function getBookingById(customerId, bookingId) {
  const [rows] = await db.query(
    `
    SELECT id, trip_id, status
    FROM bookings
    WHERE id = ? AND customer_id = ?
    LIMIT 1
    `,
    [bookingId, customerId]
  )

  return rows[0]
}

async function getBookingDetail(customerId, bookingId) {
  const [rows] = await db.query(
    `
    SELECT 
      b.id AS booking_id,
      b.trip_id,
      b.total_price,
      b.status AS booking_status,
      b.created_at,
      tr.departure_time,
      tr.arrival_time,
      tr.price AS trip_base_price,
      bs.name AS bus_name,
      bs.license_plate,
      bs.image_url AS bus_image_url,
      bt.name AS bus_type_name,
      bc.name AS bus_company_name,
      dep.name AS departure_city,
      arr.name AS arrival_city,
      r.estimated_time,
      t.id AS ticket_id,
      t.seat_id,
      s.seat_number,
      s.floor AS seat_floor,
      t.price AS ticket_price,
      t.status AS ticket_status
    FROM bookings b
    JOIN trips tr ON tr.id = b.trip_id
    JOIN buses bs ON bs.id = tr.bus_id
    LEFT JOIN bus_types bt ON bt.id = bs.bus_type_id
    LEFT JOIN bus_companies bc ON bc.id = bs.bus_company_id
    LEFT JOIN routes r ON r.id = tr.route_id
    LEFT JOIN cities dep ON dep.id = r.departure_city_id
    LEFT JOIN cities arr ON arr.id = r.arrival_city_id
    LEFT JOIN tickets t ON t.booking_id = b.id
    LEFT JOIN seats s ON s.id = t.seat_id
    WHERE b.customer_id = ? AND b.id = ?
    ORDER BY t.id ASC
    `,
    [customerId, bookingId]
  )

  if (rows.length === 0) return null

  const booking = {
    booking_id: rows[0].booking_id,
    trip_id: rows[0].trip_id,
    total_price: rows[0].total_price,
    status: rows[0].booking_status,
    created_at: rows[0].created_at,
    departure_time: rows[0].departure_time,
    arrival_time: rows[0].arrival_time,
    trip_base_price: rows[0].trip_base_price,
    bus_name: rows[0].bus_name,
    license_plate: rows[0].license_plate,
    bus_image_url: rows[0].bus_image_url,
    bus_type_name: rows[0].bus_type_name,
    bus_company_name: rows[0].bus_company_name,
    departure_city: rows[0].departure_city,
    arrival_city: rows[0].arrival_city,
    estimated_time: rows[0].estimated_time,
    tickets: []
  }

  for (const row of rows) {
    if (row.ticket_id) {
      booking.tickets.push({
        ticket_id: row.ticket_id,
        seat_id: row.seat_id,
        seat_number: normalizeSeatNumberByFloor(row.seat_number, row.seat_floor),
        price: row.ticket_price,
        status: row.ticket_status
      })
    }
  }

  return booking
}

async function getBookingsByTrip(tripId, companyId) {
  const [rows] = await db.query(
    `
    SELECT 
      b.id AS booking_id,
      b.status AS booking_status,
      COALESCE(NULLIF(TRIM(b.contact_name), ''), c.name) AS customer_name,
      COALESCE(NULLIF(TRIM(b.contact_phone), ''), c.phone) AS customer_phone,
      t.departure_time,
      GROUP_CONCAT(
        DISTINCT s.seat_number
        ORDER BY s.floor, s.row_index, s.col_index
        SEPARATOR ', '
      ) AS seat_numbers,
      COUNT(DISTINCT tk.id) AS seat_count,
      b.total_price,
      b.created_at
    FROM bookings b
    JOIN trips t ON b.trip_id = t.id
    JOIN buses bs ON t.bus_id = bs.id
    JOIN customers c ON b.customer_id = c.id
    LEFT JOIN tickets tk ON tk.booking_id = b.id
    LEFT JOIN seats s ON tk.seat_id = s.id
    WHERE b.trip_id = ? AND bs.bus_company_id = ?
    GROUP BY b.id, b.status, b.contact_name, b.contact_phone, c.name, c.phone, t.departure_time, b.total_price, b.created_at
    ORDER BY b.created_at DESC
    `,
    [tripId, companyId]
  )
  return rows
}

async function getTripSeatsByTrip(tripId, companyId) {
  const hasVipColumn = await hasTripSeatVipColumn()
  const vipSelect = hasVipColumn ? "ts.is_vip," : "0 AS is_vip,"

  const [rows] = await db.query(
    `
    SELECT 
      ts.id AS trip_seat_id,
      ts.status,
      ${vipSelect}
      s.id AS seat_id,
      s.seat_number,
      s.floor,
      s.row_index,
      s.col_index,
      s.seat_type,
      t.price AS base_price
    FROM trip_seats ts
    JOIN trips t ON ts.trip_id = t.id
    JOIN buses b ON t.bus_id = b.id
    JOIN seats s ON ts.seat_id = s.id
    WHERE ts.trip_id = ?
      AND b.bus_company_id = ?
    ORDER BY s.floor, s.row_index, s.col_index
    `,
    [tripId, companyId]
  )

  return rows.map((row) => ({
    ...row,
    seat_number: normalizeSeatNumberByFloor(row.seat_number, row.floor)
  }))
}

async function updateTripSeatSettings(tripId, seatId, companyId, { isVip, locked }) {
  const hasVipColumn = await hasTripSeatVipColumn()
  const vipSet = hasVipColumn ? "ts.is_vip = ?," : ""
  const params = hasVipColumn
    ? [isVip ? 1 : 0, locked ? 1 : 0, locked ? 1 : 0, tripId, seatId, companyId]
    : [locked ? 1 : 0, locked ? 1 : 0, tripId, seatId, companyId]

  const [result] = await db.query(
    `
    UPDATE trip_seats ts
    JOIN trips t ON ts.trip_id = t.id
    JOIN buses b ON t.bus_id = b.id
    SET
      ${vipSet}
      ts.status = CASE
        WHEN ? = 1 AND ts.status <> 'booked' THEN 'locked'
        WHEN ? = 0 AND ts.status = 'locked' THEN 'available'
        ELSE ts.status
      END
    WHERE ts.trip_id = ?
      AND ts.seat_id = ?
      AND b.bus_company_id = ?
    `,
    params
  )

  return result
}

module.exports = {
  createBookingWithTickets,
  getBookingsWithTickets,
  getBookingById,
  getBookingDetail,
  getBookingsByTrip,
  getTripSeatsByTrip,
  updateTripSeatSettings
}



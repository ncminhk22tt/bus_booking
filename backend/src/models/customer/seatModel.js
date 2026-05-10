const db = require("../../config/db")
async function hasTripSeatVipColumn() {
  const [rows] = await db.query("SHOW COLUMNS FROM trip_seats LIKE 'is_vip'")
  return rows.length > 0
}

function toDbSelectedStatus() {
  return "locked"
}

function toApiStatus(dbStatus) {
  if (dbStatus === "booked") return "Booked"
  if (dbStatus === "locked") return "Booked"
  return "Available"
}

function normalizeSeatType(value, busTypeName = "") {
  const raw = String(value || "").toLowerCase()
  const busType = String(busTypeName || "").toLowerCase()

  if (busType.includes("cabin")) return "Cabin"
  if (busType.includes("luxury")) return "Luxury"
  // VIP chỉ được xác định theo cờ trip_seats.is_vip (không auto theo loại xe).
  if (raw === "bed") return "Bed"
  return "Standard"
}

function normalizeSeatNumberByFloor(seatNumber, floor) {
  const raw = String(seatNumber || "").trim()
  if (!raw) return raw

  const floorNum = Number(floor)
  const floorPrefix = floorNum === 2 ? "B" : "A"

  // Legacy data may store floor-2 labels starting with A (e.g. A1 on both floors).
  if (floorNum === 2 && /^A/i.test(raw)) return `B${raw.slice(1)}`
  if (floorNum === 1 && /^B/i.test(raw)) return `A${raw.slice(1)}`

  // If no floor prefix exists, prepend A/B based on floor.
  if (!/^[AB]/i.test(raw)) return `${floorPrefix}${raw}`
  return raw
}

function calcSeatPrice(basePrice, seatType, isVipSeat = false) {
  const price = Number(basePrice || 0)
  // Quy tắc giá duy nhất:
  // - Ghế VIP: +50%
  // - Ghế thường: giá gốc của chuyến
  if (isVipSeat) return Math.round(price * 1.5)
  return price
}

async function getSeatsByBus(busId, tripId = null) {
  if (tripId) {
    const hasVipColumn = await hasTripSeatVipColumn()
    const vipSelect = hasVipColumn ? "ts.is_vip," : "0 AS is_vip,"

    const [rows] = await db.query(
      `
      SELECT
        s.id,
        s.bus_id,
        s.seat_number,
        s.row_index AS row_num,
        s.col_index AS col_num,
        s.floor,
        COALESCE(NULLIF(s.seat_type, ''), bt.seat_type) AS seat_type,
        ts.status AS trip_status,
        ${vipSelect}
        ts.id AS trip_seat_id,
        t.price AS trip_price,
        bt.name AS bus_type_name,
        bt.layout,
        bt.floors,
        bt.row_count,
        bt.col_count
      FROM seats s
      JOIN buses b ON b.id = s.bus_id
      JOIN bus_types bt ON bt.id = b.bus_type_id
      LEFT JOIN trip_seats ts
        ON ts.seat_id = s.id
       AND ts.trip_id = ?
      LEFT JOIN trips t
        ON t.id = ts.trip_id
      WHERE s.bus_id = ?
      ORDER BY s.floor, s.row_index, s.col_index
      `,
      [tripId, busId]
    )

    return rows.map((row) => {
      const isVipSeat = Boolean(row.is_vip)
      const type = isVipSeat ? "VIP" : normalizeSeatType(row.seat_type, row.bus_type_name)
      return {
        id: row.id,
        bus_id: row.bus_id,
        trip_seat_id: row.trip_seat_id,
        seat_number: normalizeSeatNumberByFloor(row.seat_number, row.floor),
        row: row.row_num,
        column: row.col_num,
        floor: row.floor,
        type,
        is_vip: isVipSeat,
        status: toApiStatus(row.trip_status || "available"),
        price: calcSeatPrice(row.trip_price, type, isVipSeat),
        busType: row.bus_type_name,
        layout: row.layout,
        floors: row.floors,
        row_count: row.row_count,
        col_count: row.col_count
      }
    })
  }

  const [rows] = await db.query(
    `
    SELECT
      s.id,
      s.bus_id,
      s.seat_number,
      s.row_index AS row_num,
      s.col_index AS col_num,
      s.floor,
      COALESCE(NULLIF(s.seat_type, ''), bt.seat_type) AS seat_type,
      s.status AS seat_status,
      bt.layout,
      bt.name AS bus_type_name,
      bt.floors,
      bt.row_count,
      bt.col_count
    FROM seats s
    JOIN buses b ON b.id = s.bus_id
    JOIN bus_types bt ON bt.id = b.bus_type_id
    WHERE s.bus_id = ?
    ORDER BY s.floor, s.row_index, s.col_index
    `,
    [busId]
  )

  return rows.map((row) => ({
    id: row.id,
    bus_id: row.bus_id,
    seat_number: normalizeSeatNumberByFloor(row.seat_number, row.floor),
    row: row.row_num,
    column: row.col_num,
    floor: row.floor,
    type: normalizeSeatType(row.seat_type, row.bus_type_name),
    status: toApiStatus(row.seat_status || "available"),
    price: 0,
    busType: row.bus_type_name,
    layout: row.layout,
    floors: row.floors,
    row_count: row.row_count,
    col_count: row.col_count
  }))
}

async function selectSeats(tripId, seatIds, action = "select") {
  if (!seatIds.length) return { affectedRows: 0 }

  const dbSelectedStatus = toDbSelectedStatus()
  const placeholders = seatIds.map(() => "?").join(",")

  if (action === "unselect") {
    const [result] = await db.query(
      `
      UPDATE trip_seats
      SET status = 'available'
      WHERE trip_id = ?
        AND seat_id IN (${placeholders})
        AND status = ?
      `,
      [tripId, ...seatIds, dbSelectedStatus]
    )
    return result
  }

  const [result] = await db.query(
    `
    UPDATE trip_seats
    SET status = ?
    WHERE trip_id = ?
      AND seat_id IN (${placeholders})
      AND status = 'available'
    `,
    [dbSelectedStatus, tripId, ...seatIds]
  )

  return result
}

async function getTripSeatStatesForUpdate(connection, tripId, seatIds) {
  const placeholders = seatIds.map(() => "?").join(",")
  const [rows] = await connection.query(
    `
    SELECT id, seat_id, status
    FROM trip_seats
    WHERE trip_id = ?
      AND seat_id IN (${placeholders})
    FOR UPDATE
    `,
    [tripId, ...seatIds]
  )
  return rows
}

async function bookSeats(tripId, seatIds) {
  const connection = await db.getConnection()
  try {
    await connection.beginTransaction()

    const rows = await getTripSeatStatesForUpdate(connection, tripId, seatIds)

    if (rows.length !== seatIds.length) {
      await connection.rollback()
      return {
        ok: false,
        code: "SEAT_NOT_FOUND",
        message: "Một hoặc nhiều ghế không tồn tại trong chuyến"
      }
    }

    const invalid = rows.filter((row) => !["available", toDbSelectedStatus()].includes(row.status))
    if (invalid.length > 0) {
      await connection.rollback()
      return {
        ok: false,
        code: "SEAT_ALREADY_BOOKED",
        message: "Một hoặc nhiều ghế đã được đặt",
        conflict_seat_ids: invalid.map((item) => item.seat_id)
      }
    }

    const placeholders = seatIds.map(() => "?").join(",")
    await connection.query(
      `
      UPDATE trip_seats
      SET status = 'booked'
      WHERE trip_id = ?
        AND seat_id IN (${placeholders})
      `,
      [tripId, ...seatIds]
    )

    await connection.commit()
    return { ok: true }
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

module.exports = {
  getSeatsByBus,
  selectSeats,
  bookSeats
}



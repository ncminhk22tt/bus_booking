const db = require("../../config/db")

function normalizePoints(points) {
  if (!Array.isArray(points)) return []

  return points
    .map((item) => ({
      name: String(item?.name || "").trim(),
      address: String(item?.address || "").trim() || null,
      time_offset_min: Number(item?.time_offset_min || 0)
    }))
    .filter((item) => item.name.length > 0)
    .map((item) => ({
      ...item,
      time_offset_min: Number.isNaN(item.time_offset_min) ? 0 : item.time_offset_min
    }))
}

const createTrip = async (
  bus_id,
  route_id,
  departure_time,
  arrival_time,
  price
) => {
  const [result] = await db.query(
    `INSERT INTO trips
    (bus_id,route_id,departure_time,arrival_time,price)
    VALUES (?,?,?,?,?)`,
    [bus_id, route_id, departure_time, arrival_time, price]
  )

  return result.insertId
}

const syncTripPoints = async (tripId, pickupPoints = [], dropoffPoints = []) => {
  const normalizedPickup = normalizePoints(pickupPoints)
  const normalizedDropoff = normalizePoints(dropoffPoints)

  await db.query("DELETE FROM trip_pickup_points WHERE trip_id = ?", [tripId])
  await db.query("DELETE FROM trip_dropoff_points WHERE trip_id = ?", [tripId])

  if (normalizedPickup.length > 0) {
    const pickupValues = normalizedPickup.map((item) => [tripId, item.name, item.address, item.time_offset_min])
    await db.query(
      `
      INSERT INTO trip_pickup_points (trip_id, name, address, time_offset_min)
      VALUES ?
      `,
      [pickupValues]
    )
  }

  if (normalizedDropoff.length > 0) {
    const dropoffValues = normalizedDropoff.map((item) => [tripId, item.name, item.address, item.time_offset_min])
    await db.query(
      `
      INSERT INTO trip_dropoff_points (trip_id, name, address, time_offset_min)
      VALUES ?
      `,
      [dropoffValues]
    )
  }
}

const getTripSeats = async (tripId) => {
  const [rows] = await db.execute(
    `
    SELECT 
      ts.id AS trip_seat_id,
      s.id AS seat_id,
      s.seat_number,
      s.floor,
      s.row_index,
      s.col_index,
      ts.status
    FROM trip_seats ts
    JOIN seats s ON ts.seat_id = s.id
    WHERE ts.trip_id = ?
    ORDER BY s.floor, s.row_index, s.col_index
    `,
    [tripId]
  )

  return rows
}

const listTrips = async (companyId) => {
  const [rows] = await db.query(
    `
    SELECT 
      t.id,
      t.bus_id,
      t.route_id,
      t.departure_time,
      t.arrival_time,
      t.price,
      t.status,
      t.created_at,
      b.name AS bus_name,
      b.license_plate,
      b.image_url,
      (
        SELECT GROUP_CONCAT(tp.name ORDER BY tp.id SEPARATOR ' | ')
        FROM trip_pickup_points tp
        WHERE tp.trip_id = t.id AND tp.is_active = 1
      ) AS pickup_points_text,
      (
        SELECT GROUP_CONCAT(td.name ORDER BY td.id SEPARATOR ' | ')
        FROM trip_dropoff_points td
        WHERE td.trip_id = t.id AND td.is_active = 1
      ) AS dropoff_points_text,
      r.departure_city_id,
      r.arrival_city_id,
      c1.name AS departure_city,
      c2.name AS arrival_city
    FROM trips t
    JOIN buses b ON t.bus_id = b.id
    JOIN routes r ON t.route_id = r.id
    LEFT JOIN cities c1 ON r.departure_city_id = c1.id
    LEFT JOIN cities c2 ON r.arrival_city_id = c2.id
    WHERE b.bus_company_id = ?
      AND t.status <> 'cancelled'
    ORDER BY t.departure_time DESC
    `,
    [companyId]
  )

  return rows
}

const updateTrip = async (tripId, companyId, data) => {
  const { bus_id, route_id, departure_time, arrival_time, price } = data

  const [result] = await db.query(
    `
    UPDATE trips t
    JOIN buses b ON t.bus_id = b.id
    SET
      t.bus_id = ?,
      t.route_id = ?,
      t.departure_time = ?,
      t.arrival_time = ?,
      t.price = ?
    WHERE t.id = ?
      AND b.bus_company_id = ?
    `,
    [bus_id, route_id, departure_time, arrival_time, price, tripId, companyId]
  )

  return result
}

const deleteTrip = async (tripId, companyId) => {
  const [result] = await db.query(
    `
    UPDATE trips t
    JOIN buses b ON t.bus_id = b.id
    SET t.status = 'cancelled'
    WHERE t.id = ?
      AND b.bus_company_id = ?
    `,
    [tripId, companyId]
  )

  return result
}

const getTripByIdAndCompany = async (tripId, companyId) => {
  const [rows] = await db.query(
    `
    SELECT t.id, t.bus_id, t.route_id, t.status
    FROM trips t
    JOIN buses b ON t.bus_id = b.id
    WHERE t.id = ? AND b.bus_company_id = ?
    LIMIT 1
    `,
    [tripId, companyId]
  )

  return rows[0] || null
}

module.exports = {
  createTrip,
  syncTripPoints,
  getTripSeats,
  listTrips,
  updateTrip,
  deleteTrip,
  getTripByIdAndCompany
}

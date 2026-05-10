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

const createRoute = async (
  bus_company_id,
  departure_city_id,
  arrival_city_id,
  distance_km,
  estimated_time,
  pickup_points = [],
  dropoff_points = []
) => {
  const [result] = await db.query(
    `INSERT INTO routes
    (bus_company_id,departure_city_id,arrival_city_id,distance_km,estimated_time)
    VALUES (?,?,?,?,?)`,
    [bus_company_id, departure_city_id, arrival_city_id, distance_km, estimated_time]
  )

  const routeId = result.insertId
  const pickups = normalizePoints(pickup_points)
  const dropoffs = normalizePoints(dropoff_points)

  if (pickups.length > 0) {
    const values = pickups.map((item) => [routeId, item.name, item.address, item.time_offset_min])
    await db.query(
      `
      INSERT INTO route_pickup_points (route_id, name, address, time_offset_min)
      VALUES ?
      `,
      [values]
    )
  }

  if (dropoffs.length > 0) {
    const values = dropoffs.map((item) => [routeId, item.name, item.address, item.time_offset_min])
    await db.query(
      `
      INSERT INTO route_dropoff_points (route_id, name, address, time_offset_min)
      VALUES ?
      `,
      [values]
    )
  }

  return routeId
}

const updateRoute = async (routeId, companyId, data) => {
  const { departure_city_id, arrival_city_id, distance_km, estimated_time } = data

  const [result] = await db.execute(
    `
    UPDATE routes
    SET departure_city_id = ?, arrival_city_id = ?, distance_km = ?, estimated_time = ?
    WHERE id = ? AND bus_company_id = ?
    `,
    [departure_city_id, arrival_city_id, distance_km, estimated_time, routeId, companyId]
  )

  return result
}

const deleteRoute = async (routeId, companyId) => {
  const [result] = await db.execute(
    `
    UPDATE routes
    SET is_active = 0
    WHERE id = ? AND bus_company_id = ?
    `,
    [routeId, companyId]
  )

  return result
}

const listRoutes = async (companyId) => {
  const [rows] = await db.query(
    `
    SELECT
      r.id,
      r.bus_company_id,
      r.departure_city_id,
      r.arrival_city_id,
      r.distance_km,
      r.estimated_time,
      r.is_active,
      r.created_at,
      c1.name AS departure_city,
      c2.name AS arrival_city,
      (
        SELECT GROUP_CONCAT(rp.name ORDER BY rp.id SEPARATOR ' | ')
        FROM route_pickup_points rp
        WHERE rp.route_id = r.id AND rp.is_active = 1
      ) AS route_pickup_points_text,
      (
        SELECT GROUP_CONCAT(rd.name ORDER BY rd.id SEPARATOR ' | ')
        FROM route_dropoff_points rd
        WHERE rd.route_id = r.id AND rd.is_active = 1
      ) AS route_dropoff_points_text
    FROM routes r
    LEFT JOIN cities c1 ON r.departure_city_id = c1.id
    LEFT JOIN cities c2 ON r.arrival_city_id = c2.id
    WHERE r.is_active = 1
      AND r.bus_company_id = ?
    ORDER BY r.id DESC
    `,
    [companyId]
  )

  return rows
}

const listRoutePoints = async (routeId, companyId) => {
  const [pickups] = await db.query(
    `
    SELECT rp.id, rp.route_id, rp.name, rp.address, rp.time_offset_min, rp.is_active
    FROM route_pickup_points rp
    JOIN routes r ON rp.route_id = r.id
    WHERE rp.route_id = ? AND rp.is_active = 1 AND r.bus_company_id = ?
    ORDER BY rp.id ASC
    `,
    [routeId, companyId]
  )

  const [dropoffs] = await db.query(
    `
    SELECT rd.id, rd.route_id, rd.name, rd.address, rd.time_offset_min, rd.is_active
    FROM route_dropoff_points rd
    JOIN routes r ON rd.route_id = r.id
    WHERE rd.route_id = ? AND rd.is_active = 1 AND r.bus_company_id = ?
    ORDER BY rd.id ASC
    `,
    [routeId, companyId]
  )

  return {
    pickup_points: pickups,
    dropoff_points: dropoffs
  }
}

const createRoutePickupPoint = async (routeId, payload) => {
  const name = String(payload?.name || "").trim()
  const address = String(payload?.address || "").trim() || null
  const time_offset_min = Number(payload?.time_offset_min || 0)

  const [result] = await db.query(
    `
    INSERT INTO route_pickup_points (route_id, name, address, time_offset_min)
    VALUES (?,?,?,?)
    `,
    [routeId, name, address, Number.isNaN(time_offset_min) ? 0 : time_offset_min]
  )

  return result.insertId
}

const createRouteDropoffPoint = async (routeId, payload) => {
  const name = String(payload?.name || "").trim()
  const address = String(payload?.address || "").trim() || null
  const time_offset_min = Number(payload?.time_offset_min || 0)

  const [result] = await db.query(
    `
    INSERT INTO route_dropoff_points (route_id, name, address, time_offset_min)
    VALUES (?,?,?,?)
    `,
    [routeId, name, address, Number.isNaN(time_offset_min) ? 0 : time_offset_min]
  )

  return result.insertId
}

const deleteRoutePickupPoint = async (routeId, pointId, companyId) => {
  const [result] = await db.query(
    `
    UPDATE route_pickup_points rp
    JOIN routes r ON rp.route_id = r.id
    SET rp.is_active = 0
    WHERE rp.id = ? AND rp.route_id = ? AND r.bus_company_id = ?
    `,
    [pointId, routeId, companyId]
  )

  return result
}

const deleteRouteDropoffPoint = async (routeId, pointId, companyId) => {
  const [result] = await db.query(
    `
    UPDATE route_dropoff_points rd
    JOIN routes r ON rd.route_id = r.id
    SET rd.is_active = 0
    WHERE rd.id = ? AND rd.route_id = ? AND r.bus_company_id = ?
    `,
    [pointId, routeId, companyId]
  )

  return result
}

const copyRoutePointsToTrip = async (routeId, tripId) => {
  await db.query("DELETE FROM trip_pickup_points WHERE trip_id = ?", [tripId])
  await db.query("DELETE FROM trip_dropoff_points WHERE trip_id = ?", [tripId])

  const [pickups] = await db.query(
    `
    SELECT name, address, time_offset_min
    FROM route_pickup_points
    WHERE route_id = ? AND is_active = 1
    ORDER BY id ASC
    `,
    [routeId]
  )

  const [dropoffs] = await db.query(
    `
    SELECT name, address, time_offset_min
    FROM route_dropoff_points
    WHERE route_id = ? AND is_active = 1
    ORDER BY id ASC
    `,
    [routeId]
  )

  if (pickups.length > 0) {
    const values = pickups.map((item) => [tripId, item.name, item.address, item.time_offset_min])
    await db.query(
      `
      INSERT INTO trip_pickup_points (trip_id, name, address, time_offset_min)
      VALUES ?
      `,
      [values]
    )
  }

  if (dropoffs.length > 0) {
    const values = dropoffs.map((item) => [tripId, item.name, item.address, item.time_offset_min])
    await db.query(
      `
      INSERT INTO trip_dropoff_points (trip_id, name, address, time_offset_min)
      VALUES ?
      `,
      [values]
    )
  }
}

const getRouteByIdAndCompany = async (routeId, companyId) => {
  const [rows] = await db.query(
    `
    SELECT id, bus_company_id, departure_city_id, arrival_city_id
    FROM routes
    WHERE id = ? AND bus_company_id = ? AND is_active = 1
    LIMIT 1
    `,
    [routeId, companyId]
  )

  return rows[0] || null
}

module.exports = {
  createRoute,
  updateRoute,
  deleteRoute,
  listRoutes,
  listRoutePoints,
  createRoutePickupPoint,
  createRouteDropoffPoint,
  deleteRoutePickupPoint,
  deleteRouteDropoffPoint,
  copyRoutePointsToTrip,
  getRouteByIdAndCompany
}

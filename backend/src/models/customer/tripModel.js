const db = require("../../config/db")

const TIME_SLOT_RANGES = {
  early_morning: { start: 0, end: 6 },
  morning: { start: 6, end: 12 },
  afternoon: { start: 12, end: 18 },
  evening: { start: 18, end: 24 }
}

function normalizeList(value) {
  if (!value) return []

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

function toNumberList(value) {
  return normalizeList(value)
    .map((item) => Number(item))
    .filter((item) => !Number.isNaN(item))
}

function splitIdOrNameList(value) {
  const list = normalizeList(value)
  if (list.length === 0) return { ids: [], names: [] }

  const ids = []
  const names = []
  for (const item of list) {
    const n = Number(item)
    if (!Number.isNaN(n) && /^\d+$/.test(item)) {
      ids.push(n)
    } else {
      names.push(item)
    }
  }
  return { ids, names }
}

function buildTimeSlotClause(timeSlots, params) {
  if (timeSlots.length === 0) return ""

  const clauses = timeSlots
    .map((slot) => TIME_SLOT_RANGES[slot])
    .filter(Boolean)
    .map(({ start, end }) => {
      params.push(start, end)
      return "(HOUR(trips.departure_time) >= ? AND HOUR(trips.departure_time) < ?)"
    })

  if (clauses.length === 0) return ""

  return ` AND (${clauses.join(" OR ")})`
}

function buildInClause(column, values, params) {
  if (values.length === 0) return ""

  params.push(...values)
  return ` AND ${column} IN (${values.map(() => "?").join(",")})`
}

function buildExistsPointClause(tableName, values, params) {
  if (values.length === 0) return ""

  const placeholders = values.map(() => "?").join(",")
  params.push(...values)

  return `
    AND EXISTS (
      SELECT 1 FROM ${tableName} p
      WHERE p.trip_id = trips.id
        AND p.is_active = 1
        AND p.id IN (${placeholders})
    )
  `
}

function buildExistsPointNameClause(tableName, values, params) {
  if (values.length === 0) return ""

  const placeholders = values.map(() => "?").join(",")
  params.push(...values)

  return `
    AND EXISTS (
      SELECT 1 FROM ${tableName} p
      WHERE p.trip_id = trips.id
        AND p.is_active = 1
        AND p.name IN (${placeholders})
    )
  `
}

function buildSearchWhere(fromCity, toCity, date, filters, params) {
  const {
    busCompanyIds,
    busTypeIds,
    seatTypes,
    pickupPointIds,
    pickupPointNames,
    dropoffPointIds,
    dropoffPointNames,
    timeSlots,
    departureHourFrom,
    departureHourTo,
    minPrice,
    maxPrice,
    minRating
  } = filters

  let where = `
    WHERE routes.departure_city_id = ?
    AND routes.arrival_city_id = ?
    AND trips.departure_time >= ?
    AND trips.departure_time < DATE_ADD(?, INTERVAL 1 DAY)
    AND trips.status = 'open'
    AND IFNULL(buses.is_active, 1) = 1
    AND IFNULL(routes.is_active, 1) = 1

  `

  params.push(fromCity, toCity, date, date)

  where += buildInClause("buses.bus_company_id", busCompanyIds, params)
  where += buildInClause("buses.bus_type_id", busTypeIds, params)
  where += buildInClause("bus_types.seat_type", seatTypes, params)
  if (pickupPointNames.length > 0) {
    where += buildExistsPointNameClause("trip_pickup_points", pickupPointNames, params)
  } else {
    where += buildExistsPointClause("trip_pickup_points", pickupPointIds, params)
  }

  if (dropoffPointNames.length > 0) {
    where += buildExistsPointNameClause("trip_dropoff_points", dropoffPointNames, params)
  } else {
    where += buildExistsPointClause("trip_dropoff_points", dropoffPointIds, params)
  }
  where += buildTimeSlotClause(timeSlots, params)

  if (departureHourFrom !== null) {
    where += " AND HOUR(trips.departure_time) >= ?"
    params.push(departureHourFrom)
  }

  if (departureHourTo !== null && departureHourTo < 24) {
    where += " AND HOUR(trips.departure_time) <= ?"
    params.push(departureHourTo)
  }

  if (minPrice !== null) {
    where += " AND trips.price >= ?"
    params.push(minPrice)
  }

  if (maxPrice !== null) {
    where += " AND trips.price <= ?"
    params.push(maxPrice)
  }

  if (minRating !== null) {
    where += " AND (4 + (bus_companies.id % 10) / 10) >= ?"
    params.push(minRating)
  }

  return where
}

function normalizeFilters(rawFilters = {}) {
  const hasPickupNames = rawFilters.pickup_point_names !== undefined && rawFilters.pickup_point_names !== ""
  const hasDropoffNames = rawFilters.dropoff_point_names !== undefined && rawFilters.dropoff_point_names !== ""

  const pickupParsed = hasPickupNames
    ? { ids: [], names: normalizeList(rawFilters.pickup_point_names) }
    : splitIdOrNameList(rawFilters.pickup_point_ids)

  const dropoffParsed = hasDropoffNames
    ? { ids: [], names: normalizeList(rawFilters.dropoff_point_names) }
    : splitIdOrNameList(rawFilters.dropoff_point_ids)

  const departureHourFrom = rawFilters.departure_hour_from !== undefined && rawFilters.departure_hour_from !== ""
    ? Number(rawFilters.departure_hour_from)
    : null
  const departureHourTo = rawFilters.departure_hour_to !== undefined && rawFilters.departure_hour_to !== ""
    ? Number(rawFilters.departure_hour_to)
    : null
  const minPrice = rawFilters.min_price ? Number(rawFilters.min_price) : null
  const maxPrice = rawFilters.max_price ? Number(rawFilters.max_price) : null
  const minRating = rawFilters.min_rating !== undefined && rawFilters.min_rating !== ""
    ? Number(rawFilters.min_rating)
    : null

  return {
    busCompanyIds: toNumberList(rawFilters.bus_company_ids),
    busTypeIds: toNumberList(rawFilters.bus_type_ids),
    seatTypes: normalizeList(rawFilters.seat_types),
    pickupPointIds: pickupParsed.ids,
    pickupPointNames: pickupParsed.names,
    dropoffPointIds: dropoffParsed.ids,
    dropoffPointNames: dropoffParsed.names,
    timeSlots: normalizeList(rawFilters.departure_time_slots),
    departureHourFrom:
      departureHourFrom === null || Number.isNaN(departureHourFrom)
        ? null
        : Math.min(23, Math.max(0, departureHourFrom)),
    departureHourTo:
      departureHourTo === null || Number.isNaN(departureHourTo)
        ? null
        : Math.min(24, Math.max(0, departureHourTo)),
    minPrice: Number.isNaN(minPrice) ? null : minPrice,
    maxPrice: Number.isNaN(maxPrice) ? null : maxPrice,
    minRating:
      minRating === null || Number.isNaN(minRating)
        ? null
        : Math.min(5, Math.max(0, minRating))
  }
}

async function searchTrips(fromCity, toCity, date, rawFilters = {}) {
  const filters = normalizeFilters(rawFilters)
  const params = []
  const where = buildSearchWhere(fromCity, toCity, date, filters, params)

  const [rows] = await db.query(
    `
    SELECT
      trips.id,
      trips.departure_time,
      trips.arrival_time,
      trips.price,
      trips.status,
      routes.id AS route_id,
      c1.name AS from_city,
      c2.name AS to_city,
      buses.id AS bus_id,
      buses.name AS bus_name,
      buses.license_plate,
      buses.image_url AS bus_image_url,
      bus_companies.id AS bus_company_id,
      bus_companies.name AS bus_company_name,
      (4 + (bus_companies.id % 10) / 10) AS rating,
      bus_types.id AS bus_type_id,
      bus_types.name AS bus_type_name,
      bus_types.seat_type,
      bus_types.floors,
      (
        SELECT GROUP_CONCAT(tp.name ORDER BY tp.id SEPARATOR ' | ')
        FROM trip_pickup_points tp
        WHERE tp.trip_id = trips.id AND tp.is_active = 1
      ) AS pickup_points_text,
      (
        SELECT GROUP_CONCAT(td.name ORDER BY td.id SEPARATOR ' | ')
        FROM trip_dropoff_points td
        WHERE td.trip_id = trips.id AND td.is_active = 1
      ) AS dropoff_points_text,
      (
        SELECT COUNT(*)
        FROM trip_seats ts
        WHERE ts.trip_id = trips.id AND ts.status = 'available'
      ) AS available_seats
    FROM trips
    JOIN routes ON trips.route_id = routes.id
    JOIN cities c1 ON routes.departure_city_id = c1.id
    JOIN cities c2 ON routes.arrival_city_id = c2.id
    JOIN buses ON trips.bus_id = buses.id
    JOIN bus_companies ON buses.bus_company_id = bus_companies.id
    JOIN bus_types ON buses.bus_type_id = bus_types.id
    ${where}
    ORDER BY trips.departure_time ASC, trips.price ASC
    `,
    params
  )

  return rows
}

async function getSearchFilters(fromCity, toCity, date) {
  const params = [fromCity, toCity, date, date]
  const baseWhere = `
    WHERE routes.departure_city_id = ?
    AND routes.arrival_city_id = ?
    AND trips.departure_time >= ?
    AND trips.departure_time < DATE_ADD(?, INTERVAL 1 DAY)
    AND trips.status = 'open'
    AND IFNULL(buses.is_active, 1) = 1
    AND IFNULL(routes.is_active, 1) = 1

  `

  const [busCompanies] = await db.query(
    `
    SELECT
      bus_companies.id,
      bus_companies.name,
      COUNT(DISTINCT trips.id) AS trip_count,
      (4 + (bus_companies.id % 10) / 10) AS rating
    FROM trips
    JOIN routes ON trips.route_id = routes.id
    JOIN buses ON trips.bus_id = buses.id
    JOIN bus_companies ON buses.bus_company_id = bus_companies.id
    ${baseWhere}
    GROUP BY bus_companies.id, bus_companies.name
    ORDER BY bus_companies.name ASC
    `,
    params
  )

  const [busTypes] = await db.query(
    `
    SELECT DISTINCT
      bus_types.id,
      bus_types.name,
      bus_types.seat_type,
      bus_types.floors
    FROM trips
    JOIN routes ON trips.route_id = routes.id
    JOIN buses ON trips.bus_id = buses.id
    JOIN bus_companies ON buses.bus_company_id = bus_companies.id
    JOIN bus_types ON buses.bus_type_id = bus_types.id
    ${baseWhere}
    ORDER BY bus_types.name ASC
    `,
    params
  )

  const [pickupPoints] = await db.query(
    `
    SELECT
      MIN(tp.id) AS id,
      tp.name,
      COUNT(DISTINCT trips.id) AS trip_count
    FROM trips
    JOIN routes ON trips.route_id = routes.id
    JOIN buses ON trips.bus_id = buses.id
    JOIN trip_pickup_points tp ON tp.trip_id = trips.id AND tp.is_active = 1
    ${baseWhere}
    GROUP BY tp.name
    ORDER BY tp.name ASC
    `,
    params
  )

  const [dropoffPoints] = await db.query(
    `
    SELECT
      MIN(td.id) AS id,
      td.name,
      COUNT(DISTINCT trips.id) AS trip_count
    FROM trips
    JOIN routes ON trips.route_id = routes.id
    JOIN buses ON trips.bus_id = buses.id
    JOIN trip_dropoff_points td ON td.trip_id = trips.id AND td.is_active = 1
    ${baseWhere}
    GROUP BY td.name
    ORDER BY td.name ASC
    `,
    params
  )

  const [priceStatsRows] = await db.query(
    `
    SELECT
      MIN(trips.price) AS min_price,
      MAX(trips.price) AS max_price
    FROM trips
    JOIN routes ON trips.route_id = routes.id
    JOIN buses ON trips.bus_id = buses.id
    JOIN bus_companies ON buses.bus_company_id = bus_companies.id
    ${baseWhere}
    `,
    params
  )

  const [timeSlotRows] = await db.query(
    `
    SELECT
      SUM(CASE WHEN HOUR(trips.departure_time) >= 0 AND HOUR(trips.departure_time) < 6 THEN 1 ELSE 0 END) AS early_morning,
      SUM(CASE WHEN HOUR(trips.departure_time) >= 6 AND HOUR(trips.departure_time) < 12 THEN 1 ELSE 0 END) AS morning,
      SUM(CASE WHEN HOUR(trips.departure_time) >= 12 AND HOUR(trips.departure_time) < 18 THEN 1 ELSE 0 END) AS afternoon,
      SUM(CASE WHEN HOUR(trips.departure_time) >= 18 AND HOUR(trips.departure_time) < 24 THEN 1 ELSE 0 END) AS evening
    FROM trips
    JOIN routes ON trips.route_id = routes.id
    JOIN buses ON trips.bus_id = buses.id
    JOIN bus_companies ON buses.bus_company_id = bus_companies.id
    ${baseWhere}
    `,
    params
  )

  const seatTypes = Array.from(
    new Set(busTypes.map((item) => item.seat_type).filter(Boolean))
  )

  return {
    departure_time_slots: [
      { key: "early_morning", label: "0h - 6h", count: Number(timeSlotRows[0]?.early_morning || 0) },
      { key: "morning", label: "6h - 12h", count: Number(timeSlotRows[0]?.morning || 0) },
      { key: "afternoon", label: "12h - 18h", count: Number(timeSlotRows[0]?.afternoon || 0) },
      { key: "evening", label: "18h - 24h", count: Number(timeSlotRows[0]?.evening || 0) }
    ],
    bus_companies: busCompanies,
    price_range: {
      min: Number(priceStatsRows[0]?.min_price || 0),
      max: Number(priceStatsRows[0]?.max_price || 0)
    },
    bus_types: busTypes,
    seat_types: seatTypes,
    pickup_points: pickupPoints,
    dropoff_points: dropoffPoints,
    unsupported_filters: [
      "popular_criteria",
      "seat_position"
    ]
  }
}

async function getTripDetail(tripId) {
  const [rows] = await db.query(
    `
    SELECT
      trips.id,
      trips.departure_time,
      trips.arrival_time,
      trips.price,
      trips.status,
      routes.id AS route_id,
      c1.id AS from_city_id,
      c1.name AS from_city,
      c2.id AS to_city_id,
      c2.name AS to_city,
      buses.id AS bus_id,
      buses.name AS bus_name,
      buses.license_plate,
      bus_companies.id AS bus_company_id,
      bus_companies.name AS bus_company,
      bus_types.id AS bus_type_id,
      bus_types.name AS bus_type_name,
      bus_types.seat_type,
      bus_types.floors,
      bus_types.layout
    FROM trips
    JOIN routes ON trips.route_id = routes.id
    JOIN cities c1 ON routes.departure_city_id = c1.id
    JOIN cities c2 ON routes.arrival_city_id = c2.id
    JOIN buses ON trips.bus_id = buses.id
    JOIN bus_companies ON buses.bus_company_id = bus_companies.id
    JOIN bus_types ON buses.bus_type_id = bus_types.id
    WHERE trips.id = ?
    LIMIT 1
    `,
    [tripId]
  )

  const trip = rows[0]
  if (!trip) return null

  const [pickupPoints] = await db.query(
    `
    SELECT id, name, address, time_offset_min
    FROM trip_pickup_points
    WHERE trip_id = ? AND is_active = 1
    ORDER BY id ASC
    `,
    [tripId]
  )

  const [dropoffPoints] = await db.query(
    `
    SELECT id, name, address, time_offset_min
    FROM trip_dropoff_points
    WHERE trip_id = ? AND is_active = 1
    ORDER BY id ASC
    `,
    [tripId]
  )

  return {
    ...trip,
    pickup_points: pickupPoints,
    dropoff_points: dropoffPoints
  }
}

module.exports = {
  searchTrips,
  getSearchFilters,
  getTripDetail
}

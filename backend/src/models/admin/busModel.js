const db = require("../../config/db")

async function hasSeatMapTemplateColumn() {
  const [rows] = await db.query("SHOW COLUMNS FROM bus_types LIKE 'seat_map_template'")
  return rows.length > 0
}

exports.createBus = async (
  bus_company_id,
  bus_type_id,
  name,
  license_plate,
  image_url = null
) => {
  await db.query(
    `
    INSERT INTO buses (bus_company_id, bus_type_id, name, license_plate, image_url)
    VALUES (?,?,?,?,?)
    `,
    [bus_company_id, bus_type_id, name, license_plate, image_url]
  )
}

const getBusById = async (busId, companyId) => {
  const [rows] = await db.query(
    `
    SELECT id, bus_company_id, bus_type_id, name, license_plate, image_url
    FROM buses
    WHERE id = ? AND bus_company_id = ?
    LIMIT 1
    `,
    [busId, companyId]
  )

  return rows[0] || null
}

const hasTripsByBusId = async (busId) => {
  const [rows] = await db.query(
    `
    SELECT id
    FROM trips
    WHERE bus_id = ?
    LIMIT 1
    `,
    [busId]
  )

  return rows.length > 0
}

const updateBus = async (busId, companyId, data, executor = db) => {
  const { name, license_plate, bus_type_id } = data
  const values = [name, license_plate, bus_type_id]

  let setSql = "name = ?, license_plate = ?, bus_type_id = ?"
  if (Object.prototype.hasOwnProperty.call(data, "image_url")) {
    setSql += ", image_url = ?"
    values.push(data.image_url)
  }

  const [result] = await executor.execute(
    `
    UPDATE buses
    SET ${setSql}
    WHERE id = ? AND bus_company_id = ?
    `,
    [...values, busId, companyId]
  )

  return result
}

const clearSeatsByBusId = async (busId, executor = db) => {
  await executor.query(
    `
    DELETE FROM seats
    WHERE bus_id = ?
    `,
    [busId]
  )
}

const deleteBus = async (busId, companyId) => {
  const [result] = await db.execute(
    `
    UPDATE buses
    SET is_active = 0
    WHERE id = ? AND bus_company_id = ?
    `,
    [busId, companyId]
  )

  return result
}

const listBuses = async (companyId) => {
  const [rows] = await db.query(
    `
    SELECT
      b.id,
      b.bus_company_id,
      b.bus_type_id,
      b.name,
      b.license_plate,
      b.image_url,
      b.status,
      b.is_active,
      b.created_at,
      bt.name AS bus_type_name,
      bt.seat_type,
      bt.total_seats,
      bt.layout,
      bt.floors,
      bt.row_count,
      bt.col_count
    FROM buses b
    JOIN bus_types bt ON b.bus_type_id = bt.id
    WHERE b.bus_company_id = ?
      AND b.is_active = 1
    ORDER BY b.id DESC
    `,
    [companyId]
  )

  return rows
}

const listBusTypes = async () => {
  const hasTemplateCol = await hasSeatMapTemplateColumn()
  const templateSelect = hasTemplateCol ? ", seat_map_template" : ""

  const [rows] = await db.query(
    `
    SELECT
      id,
      name,
      description,
      floors,
      row_count,
      col_count,
      total_seats,
      seat_type,
      layout
      ${templateSelect}
    FROM bus_types
    ORDER BY id DESC
    `
  )

  return rows
}

module.exports = {
  getBusById,
  hasTripsByBusId,
  updateBus,
  clearSeatsByBusId,
  deleteBus,
  listBuses,
  listBusTypes
}

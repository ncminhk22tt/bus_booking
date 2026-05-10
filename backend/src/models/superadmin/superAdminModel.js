const db = require("../../config/db")

async function hasSeatMapTemplateColumn() {
  const [rows] = await db.query("SHOW COLUMNS FROM bus_types LIKE 'seat_map_template'")
  return rows.length > 0
}

exports.findByPhone = async (phone) => {
  const [rows] = await db.query(
    "SELECT * FROM admins WHERE phone = ? AND role = 'super_admin'",
    [phone]
  )

  return rows
}

exports.findAnyAdminByPhone = async (phone) => {
  const [rows] = await db.query(
    "SELECT id, phone, role, is_active FROM admins WHERE phone = ? LIMIT 1",
    [phone]
  )
  return rows[0] || null
}

exports.getCompanyByPhone = async (phone) => {
  const [rows] = await db.query(
    "SELECT id, name, phone, address, is_active FROM bus_companies WHERE phone = ? AND deleted_at IS NULL LIMIT 1",
    [phone]
  )
  return rows[0] || null
}

exports.createCompany = async (name, phone, address) => {
  const [result] = await db.query(
    `INSERT INTO bus_companies (name, phone, address)
     VALUES (?, ?, ?)`,
    [name, phone, address]
  )

  return result.insertId
}

exports.createAdmin = async (phone, password, companyId) => {
  await db.query(
    `INSERT INTO admins (phone, password, bus_company_id, role)
     VALUES (?, ?, ?, 'admin')`,
    [phone, password, companyId]
  )
}

exports.listCompanies = async () => {
  const [rows] = await db.query(
    `SELECT bc.*, COUNT(a.id) AS admin_count
     FROM bus_companies bc
     LEFT JOIN admins a ON a.bus_company_id = bc.id AND a.role = 'admin'
     WHERE bc.deleted_at IS NULL
     GROUP BY bc.id
     ORDER BY bc.id DESC`
  )
  return rows
}

exports.getCompanyById = async (id) => {
  const [rows] = await db.query(
    `SELECT * FROM bus_companies WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
    [id]
  )
  return rows[0]
}

exports.updateCompany = async (id, data) => {
  const { name, phone, address } = data
  const [result] = await db.query(
    `UPDATE bus_companies
     SET name = ?, phone = ?, address = ?
     WHERE id = ? AND deleted_at IS NULL`,
    [name, phone, address, id]
  )
  return result
}

exports.setCompanyActive = async (id, isActive) => {
  const [result] = await db.query(
    `UPDATE bus_companies SET is_active = ? WHERE id = ? AND deleted_at IS NULL`,
    [isActive, id]
  )
  return result
}

exports.setAdminsActiveByCompany = async (companyId, isActive) => {
  const [result] = await db.query(
    `
    UPDATE admins
    SET is_active = ?
    WHERE bus_company_id = ?
      AND role = 'admin'
    `,
    [isActive, companyId]
  )
  return result
}

exports.softDeleteCompany = async (id) => {
  const [result] = await db.query(
    `
    UPDATE bus_companies
    SET deleted_at = NOW(),
        is_active = 0
    WHERE id = ? AND deleted_at IS NULL
    `,
    [id]
  )
  return result
}

exports.deactivateAdminsByCompany = async (companyId) => {
  const [result] = await db.query(
    `
    UPDATE admins
    SET is_active = 0
    WHERE bus_company_id = ?
      AND role = 'admin'
    `,
    [companyId]
  )
  return result
}

exports.listAdmins = async () => {
  const [rows] = await db.query(
    `SELECT
      a.id,
      a.phone,
      a.bus_company_id,
      a.role,
      a.created_at,
      a.is_active,
      bc.name AS company_name
    FROM admins a
    LEFT JOIN bus_companies bc ON bc.id = a.bus_company_id
    WHERE a.role IN ('admin', 'super_admin')
    ORDER BY a.id DESC`
  )
  return rows
}

exports.getAdminById = async (id) => {
  const [rows] = await db.query(
    `SELECT id, phone, bus_company_id, role, created_at, is_active
     FROM admins
     WHERE id = ?
     LIMIT 1`,
    [id]
  )
  return rows[0]
}

exports.setAdminActive = async (id, isActive) => {
  const [result] = await db.query(
    `UPDATE admins SET is_active = ? WHERE id = ?`,
    [isActive, id]
  )
  return result
}

exports.setAdminRole = async (id, role) => {
  const [result] = await db.query(
    `UPDATE admins SET role = ? WHERE id = ?`,
    [role, id]
  )
  return result
}

exports.resetAdminPassword = async (id, hashedPassword) => {
  const [result] = await db.query(
    `UPDATE admins SET password = ? WHERE id = ?`,
    [hashedPassword, id]
  )
  return result
}

exports.countAdminsByCompanyId = async (companyId, excludeAdminId = null) => {
  let sql = `
    SELECT COUNT(*) AS total
    FROM admins
    WHERE role = 'admin'
      AND bus_company_id = ?
  `
  const params = [companyId]

  if (excludeAdminId) {
    sql += " AND id <> ?"
    params.push(excludeAdminId)
  }

  const [[row]] = await db.query(sql, params)
  return Number(row?.total || 0)
}

exports.getOverviewStats = async () => {
  const [[admins]] = await db.query(
    `SELECT COUNT(*) AS total_admins
     FROM admins a
     LEFT JOIN bus_companies bc ON bc.id = a.bus_company_id
     WHERE a.role = 'admin'
       AND (a.bus_company_id IS NULL OR bc.deleted_at IS NULL)`
  )
  const [[activeAdmins]] = await db.query(
    `SELECT COUNT(*) AS active_admins
     FROM admins a
     LEFT JOIN bus_companies bc ON bc.id = a.bus_company_id
     WHERE a.role = 'admin'
       AND a.is_active = 1
       AND (a.bus_company_id IS NULL OR bc.deleted_at IS NULL)`
  )
  const [[companies]] = await db.query(
    `SELECT COUNT(*) AS total_companies
     FROM bus_companies
     WHERE deleted_at IS NULL`
  )
  const [[activeCompanies]] = await db.query(
    `SELECT COUNT(*) AS active_companies
     FROM bus_companies
     WHERE is_active = 1
       AND deleted_at IS NULL`
  )

  return {
    total_admins: Number(admins.total_admins || 0),
    active_admins: Number(activeAdmins.active_admins || 0),
    total_companies: Number(companies.total_companies || 0),
    active_companies: Number(activeCompanies.active_companies || 0)
  }
}

exports.listBusTypes = async () => {
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

exports.createBusType = async ({
  name,
  description,
  floors,
  row_count,
  col_count,
  total_seats,
  seat_type,
  layout,
  seat_map_template = null
}) => {
  const hasTemplateCol = await hasSeatMapTemplateColumn()
  let result

  if (hasTemplateCol) {
    ;[result] = await db.query(
      `
      INSERT INTO bus_types (
        name,
        description,
        floors,
        row_count,
        col_count,
        total_seats,
        seat_type,
        layout,
        seat_map_template
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [name, description, floors, row_count, col_count, total_seats, seat_type, layout, seat_map_template]
    )
  } else {
    ;[result] = await db.query(
      `
      INSERT INTO bus_types (
        name,
        description,
        floors,
        row_count,
        col_count,
        total_seats,
        seat_type,
        layout
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [name, description, floors, row_count, col_count, total_seats, seat_type, layout]
    )
  }

  return result.insertId
}

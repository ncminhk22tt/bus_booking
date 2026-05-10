const db = require("../../config/db")

exports.findById = async (id) => {
  const [rows] = await db.query(
    "SELECT * FROM admins WHERE id = ? LIMIT 1",
    [id]
  )
  return rows[0]
}

exports.findCompanyById = async (id) => {
  const [rows] = await db.query(
    "SELECT * FROM bus_companies WHERE id = ? LIMIT 1",
    [id]
  )
  return rows[0]
}

exports.updateAdmin = async (phone, password, id) => {
  await db.query(
    `
    UPDATE admins
    SET phone = ?, password = ?
    WHERE id = ?
    `,
    [phone, password, id]
  )
}

exports.updateCompany = async (name, address, companyId) => {
  await db.query(
    `
    UPDATE bus_companies
    SET name = ?, address = ?
    WHERE id = ?
    `,
    [name, address, companyId]
  )
}

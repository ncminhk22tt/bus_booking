const db = require("../../config/db")

async function createCustomer(name, phone, password) {

  const [result] = await db.query(
    `INSERT INTO customers (name, phone, password)
     VALUES (?,?,?)`,
    [name, phone, password]
  )

  return result.insertId
}

async function findByPhone(phone) {

  const [rows] = await db.query(
    `SELECT * FROM customers WHERE phone = ?`,
    [phone]
  )

  return rows[0]
}

async function findById(id) {
  const [rows] = await db.query(
    `SELECT * FROM customers WHERE id = ?`,
    [id]
  )

  return rows[0]
}

async function updateProfile(id, name, phone) {
  const [result] = await db.query(
    `UPDATE customers
     SET name = ?, phone = ?
     WHERE id = ?`,
    [name, phone, id]
  )

  return result
}

async function updatePassword(id, password) {
  await db.query(
    `UPDATE customers
     SET password = ?
     WHERE id = ?`,
    [password, id]
  )
}

module.exports = {
  createCustomer,
  findByPhone,
  findById,
  updateProfile,
  updatePassword
}

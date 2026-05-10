const db = require("../../config/db")

async function listCities() {
  const [rows] = await db.query(
    `
    SELECT id, name, region
    FROM cities
    ORDER BY name ASC
    `
  )

  return rows
}

module.exports = {
  listCities
}

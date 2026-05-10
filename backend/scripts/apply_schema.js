const path = require("path")
const fs = require("fs")
const dotenv = require("dotenv")
const mysql = require("mysql2/promise")

dotenv.config({ path: path.join(__dirname, "..", ".env") })

async function main() {
  const schemaPath = path.join(__dirname, "..", "schema.sql")
  let sql = fs.readFileSync(schemaPath, "utf8")

  // Remove line comments to avoid MySQL parse issues when running as one batch
  sql = sql.replace(/^\s*--.*$/gm, "")

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 3306,
    multipleStatements: true
  })

  try {
    await connection.query(sql)
    console.log("SCHEMA_APPLIED_OK")
  } finally {
    await connection.end()
  }
}

main().catch((e) => {
  console.error("SCHEMA_APPLY_ERROR", e.message || e)
  process.exit(1)
})

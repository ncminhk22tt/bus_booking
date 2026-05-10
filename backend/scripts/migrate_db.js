const path = require("path")
const fs = require("fs")
const dotenv = require("dotenv")
const mysql = require("mysql2/promise")

dotenv.config({ path: path.join(__dirname, "..", ".env") })

const IGNORE_CODES = new Set([
  "ER_TABLE_EXISTS_ERROR",
  "ER_DUP_FIELDNAME",
  "ER_DUP_KEYNAME",
  "ER_FK_DUP_NAME",
  "ER_CANT_CREATE_TABLE",
  "ER_DUP_ENTRY"
])

function splitStatements(sql) {
  return sql
    .replace(/^\s*--.*$/gm, "")
    .split(";")
    .map(s => s.trim())
    .filter(Boolean)
}

function shouldSkip(stmt) {
  const upper = stmt.toUpperCase()

  if (upper.startsWith("DROP TABLE") || upper.startsWith("SET FOREIGN_KEY_CHECKS")) {
    return true
  }

  if (upper.includes("ADD CONSTRAINT FK_ADMINS_BUS_COMPANY")) {
    return true
  }

  return false
}

async function main() {
  const schemaPath = path.join(__dirname, "..", "schema.sql")
  const sql = fs.readFileSync(schemaPath, "utf8")
  const statements = splitStatements(sql)

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    multipleStatements: false
  })

  try {
    for (const stmt of statements) {
      if (shouldSkip(stmt)) {
        continue
      }

      try {
        await connection.query(stmt)
      } catch (err) {
        if (IGNORE_CODES.has(err.code)) {
          continue
        }
        throw err
      }
    }
    console.log("MIGRATE_OK")
  } finally {
    await connection.end()
  }
}

main().catch((e) => {
  console.error("MIGRATE_ERROR", e.message || e)
  process.exit(1)
})

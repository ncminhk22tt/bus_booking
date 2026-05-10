const path = require("path")
const dotenv = require("dotenv")
const bcrypt = require("bcryptjs")

dotenv.config({ path: path.join(__dirname, "..", ".env") })

const db = require("../src/config/db")

async function ensureCompany() {
  const [rows] = await db.query("SELECT id FROM bus_companies ORDER BY id ASC LIMIT 1")
  if (rows.length > 0) return

  await db.query(
    "INSERT INTO bus_companies (name, phone, address) VALUES (?, ?, ?)",
    ["Nhà xe Demo Admin", "0977000000", "Hồ Chí Minh"]
  )
}

async function main() {
  await ensureCompany()

  const [companies] = await db.query(
    "SELECT id, name FROM bus_companies ORDER BY id ASC LIMIT 5"
  )

  const hashed = await bcrypt.hash("123456", 10)
  const created = []

  for (let i = 0; i < companies.length; i++) {
    const company = companies[i]
    const phone = `0977${String(100000 + i).slice(-6)}`

    const [exists] = await db.query(
      "SELECT id FROM admins WHERE phone = ? LIMIT 1",
      [phone]
    )

    if (exists.length === 0) {
      await db.query(
        "INSERT INTO admins (phone, password, bus_company_id, role) VALUES (?, ?, ?, 'admin')",
        [phone, hashed, company.id]
      )
      created.push({ phone, password: "123456", company: company.name })
    }
  }

  console.log("SEED_ADMIN_OK", {
    note: "Dùng các tài khoản dưới đây để login /admin/login",
    accounts: created.length > 0 ? created : "Đã tồn tại sẵn"
  })
}

main()
  .catch((err) => {
    console.error("SEED_ADMIN_ERROR", err.message || err)
    process.exit(1)
  })
  .finally(async () => {
    await db.end()
  })

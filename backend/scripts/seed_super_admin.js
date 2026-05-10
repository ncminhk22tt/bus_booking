const path = require("path")
const dotenv = require("dotenv")
const bcrypt = require("bcryptjs")

dotenv.config({ path: path.join(__dirname, "..", ".env") })

const db = require("../src/config/db")

async function main() {
  const phone = process.env.SUPER_ADMIN_PHONE || "1900000000"
  const rawPassword = process.env.SUPER_ADMIN_PASSWORD || "123456"
  const hashedPassword = await bcrypt.hash(rawPassword, 10)

  const [exists] = await db.query(
    "SELECT id FROM admins WHERE phone = ? LIMIT 1",
    [phone]
  )

  if (exists.length > 0) {
    await db.query(
      "UPDATE admins SET password = ?, role = 'super_admin', is_active = 1 WHERE id = ?",
      [hashedPassword, exists[0].id]
    )
    console.log("SEED_SUPER_ADMIN_OK", {
      phone,
      password: rawPassword,
      note: "Da cap nhat tai khoan ton tai thanh super_admin"
    })
    return
  }

  await db.query(
    "INSERT INTO admins (phone, password, role, is_active) VALUES (?, ?, 'super_admin', 1)",
    [phone, hashedPassword]
  )

  console.log("SEED_SUPER_ADMIN_OK", {
    phone,
    password: rawPassword,
    note: "Dang nhap API superadmin bang /api/superadmin/login"
  })
}

main()
  .catch((err) => {
    console.error("SEED_SUPER_ADMIN_ERROR", err.message || err)
    process.exit(1)
  })
  .finally(async () => {
    await db.end()
  })

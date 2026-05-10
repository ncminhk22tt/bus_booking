// SECURITY WARNING: This script creates a super admin account
// NEVER commit real credentials to version control
// Always use environment variables for sensitive data
// Run with: SUPER_ADMIN_PHONE=yourphone SUPER_ADMIN_PASSWORD=yourpassword node scripts/seed_super_admin.js

const path = require("path")
const dotenv = require("dotenv")
const bcrypt = require("bcryptjs")

dotenv.config({ path: path.join(__dirname, "..", ".env") })

const db = require("../src/config/db")

async function main() {
  const phone = process.env.SUPER_ADMIN_PHONE || "CHANGE_THIS_PHONE"
  const rawPassword = process.env.SUPER_ADMIN_PASSWORD || "CHANGE_THIS_PASSWORD"

  if (phone === "CHANGE_THIS_PHONE" || rawPassword === "CHANGE_THIS_PASSWORD") {
    console.error("ERROR: Please set SUPER_ADMIN_PHONE and SUPER_ADMIN_PASSWORD environment variables")
    console.error("Example: SUPER_ADMIN_PHONE=yourphone SUPER_ADMIN_PASSWORD=yourpassword node scripts/seed_super_admin.js")
    process.exit(1)
  }
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

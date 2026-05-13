const db = require("../../config/db")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

exports.login = async (req, res) => {
  const { phone, password } = req.body

  try {
    const [rows] = await db.query(
      "SELECT * FROM admins WHERE phone = ? AND role = 'super_admin'",
      [String(phone || "").trim()]
    )

    if (rows.length === 0) {
      return res.status(400).json({ message: "Tài khoản quản trị không tồn tại" })
    }

    const admin = rows[0]
    if (!Number(admin.is_active)) {
      return res.status(403).json({ message: "Tài khoản super admin đã bị khóa" })
    }

    const isMatch = await bcrypt.compare(String(password || ""), admin.password)

    if (!isMatch) {
      return res.status(400).json({ message: "Sai mật khẩu" })
    }

    const token = jwt.sign(
      { id: admin.id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    )

    return res.json({ message: "Đăng nhập thành công", token })
  } catch (error) {
    console.error("Super admin login error:", error)
    return res.status(500).json({ message: "Lỗi server" })
  }
}

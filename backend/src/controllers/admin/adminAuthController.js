const db = require("../../config/db")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

exports.login = async (req, res) => {

  const { phone, password } = req.body

  try {

    const [rows] = await db.query(
      "SELECT * FROM admins WHERE phone = ? AND role = 'admin'",
      [String(phone || "").trim()]
    )

    if (rows.length === 0) {
      return res.status(400).json({
        message: "Tài khoản admin không tồn tại"
      })
    }

    const admin = rows[0]
    if (!Number(admin.is_active)) {
      return res.status(403).json({
        message: "Tài khoản admin đã bị khóa"
      })
    }

    const isMatch = await bcrypt.compare(
      String(password || ""),
      admin.password
    )

    if (!isMatch) {
      return res.status(400).json({
        message: "Sai mật khẩu"
      })
    }

    const token = jwt.sign(
      {
        id: admin.id,
        role: admin.role,
        bus_company_id: admin.bus_company_id
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    )

    res.json({
      message: "Đăng nhập admin thành công",
      token
    })

  } catch (error) {
    console.error("Admin login error:", error)
    res.status(500).json({
      message: "Lỗi server"
    })
  }

}

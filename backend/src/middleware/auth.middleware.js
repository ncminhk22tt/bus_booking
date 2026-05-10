const jwt = require("jsonwebtoken")
const db = require("../config/db")

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader) {
      return res.status(401).json({
        message: "Thiếu token"
      })
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Định dạng token không hợp lệ"
      })
    }

    const token = authHeader.split(" ")[1]

    if (!token) {
      return res.status(401).json({
        message: "Thiếu token"
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    if (decoded.role !== "admin") {
      return res.status(403).json({
        message: "Không có quyền truy cập"
      })
    }

    const [rows] = await db.query(
      "SELECT id, role, is_active, bus_company_id FROM admins WHERE id = ? AND role = 'admin' LIMIT 1",
      [decoded.id]
    )

    if (rows.length === 0) {
      return res.status(401).json({
        message: "Tài khoản admin không tồn tại"
      })
    }

    const admin = rows[0]
    if (!Number(admin.is_active)) {
      return res.status(403).json({
        message: "Tài khoản admin đã bị khóa"
      })
    }

    req.user = {
      id: admin.id,
      role: admin.role,
      bus_company_id: admin.bus_company_id
    }

    next()
  } catch (error) {
    console.error("JWT error:", error.message)

    return res.status(401).json({
      message: "Token không hợp lệ"
    })
  }
}

module.exports = authMiddleware

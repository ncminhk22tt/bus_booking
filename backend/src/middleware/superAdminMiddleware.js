const jwt = require("jsonwebtoken")

module.exports = (req, res, next) => {

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

  try {

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    if (decoded.role !== "super_admin") {
      return res.status(403).json({
        message: "Không có quyền"
      })
    }

    req.user = decoded

    next()

  } catch (error) {

    console.error("Super admin JWT error:", error.message)

    return res.status(401).json({
      message: "Token không hợp lệ"
    })

  }

}

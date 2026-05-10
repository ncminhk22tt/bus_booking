const jwt = require("jsonwebtoken")

function authCustomer(req, res, next) {

  const authHeader = req.headers.authorization

  if (!authHeader) {
    return res.status(401).json({ message: "Chưa đăng nhập" })
  }

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Định dạng token không hợp lệ" })
  }

  const token = authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ message: "Chưa đăng nhập" })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    req.customer = decoded

    next()
  } catch (err) {
    console.error("Customer JWT error:", err.message)
    return res.status(401).json({ message: "Token không hợp lệ" })
  }
}

module.exports = authCustomer

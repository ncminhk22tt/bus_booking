const adminMiddleware = (req, res, next) => {

  if (!req.user) {
    return res.status(401).json({
      message: "Chưa xác thực"
    })
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Cần quyền admin"
    })
  }

  next()
}

module.exports = adminMiddleware

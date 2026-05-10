const express = require("express")
const path = require("path")
require("dotenv").config()
const cors = require("cors")

const db = require("./config/db")

const app = express()

const adminAuthRoutes = require("./routes/admin/adminAuthRoutes")
const superAdminAuthRoutes = require("./routes/superadmin/superAdminAuthRoutes")
const superAdminRoutes = require("./routes/superadmin/superAdminRoutes")
const adminRoutes = require("./routes/admin/adminRoutes")
const busRoutes = require("./routes/admin/busRoutes")
const routeRoutes = require("./routes/admin/routeRoutes")
const adminTripRoutes = require("./routes/admin/tripRoutes")
const bookingAdminRoutes = require("./routes/admin/bookingAdminRoutes")
const customerAuthRoutes = require("./routes/customer/customerAuthRoutes")
const customerRoutes = require("./routes/customer/customerRoutes")
const customerTripRoutes = require("./routes/customer/tripRoutes")
const customerSeatRoutes = require("./routes/customer/seatRoutes")
const bookingRoutes = require("./routes/customer/bookingRoutes")
const cityRoutes = require("./routes/customer/cityRoutes")
const seatBookingRoutes = require("./routes/customer/seatBookingRoutes")

app.use(cors())
app.use(express.json({ limit: "8mb" }))
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")))

app.get("/", (req, res) => {
  res.send("API đặt vé xe đang hoạt động!")
})

app.use("/api/admin/auth", adminAuthRoutes)
app.use("/api/superadmin", superAdminAuthRoutes)
app.use("/api/superadmin", superAdminRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/admin", busRoutes)
app.use("/api/admin", routeRoutes)
app.use("/api/admin", adminTripRoutes)
app.use("/api/admin", bookingAdminRoutes)
app.use("/api/customers", customerAuthRoutes)
app.use("/api/customers", customerRoutes)
app.use("/api/trips", customerTripRoutes)
app.use("/api/trips", customerSeatRoutes)
app.use("/api/bookings", bookingRoutes)
app.use("/api/cities", cityRoutes)
app.use("/api/seats", seatBookingRoutes)

app.get("/test-db", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT 1 as ok")
    res.json({ ok: true, rows })
  } catch (err) {
    console.error("DB ERROR:", err)   // 👈 quan trọng
    res.json({ ok: false, error: err.message })
  }
})

module.exports = app

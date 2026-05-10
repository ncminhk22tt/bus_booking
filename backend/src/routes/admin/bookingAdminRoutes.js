const express = require("express")
const router = express.Router()

const authMiddleware = require("../../middleware/auth.middleware")
const {
  getBookingsByTrip,
  getTripSeatsByTrip,
  updateTripSeatSettings
} = require("../../controllers/admin/bookingAdminController")

router.get("/bookings/trips/:tripId", authMiddleware, getBookingsByTrip)
router.get("/bookings/trips/:tripId/seats", authMiddleware, getTripSeatsByTrip)
router.patch("/bookings/trips/:tripId/seats/:seatId", authMiddleware, updateTripSeatSettings)

module.exports = router

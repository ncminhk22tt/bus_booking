const express = require("express")
const router = express.Router()

const authCustomer = require("../../middleware/authCustomer")

const {
  bookTicket,
  getMyBookings,
  getBookingDetail,
  cancelBooking,
  payBooking
} = require("../../controllers/customer/bookingController")

router.post("/", authCustomer, bookTicket)
router.get("/me", authCustomer, getMyBookings)
router.get("/:id", authCustomer, getBookingDetail)
router.post("/:id/cancel", authCustomer, cancelBooking)
router.post("/:id/pay", authCustomer, payBooking)

module.exports = router

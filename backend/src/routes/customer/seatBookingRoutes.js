const express = require("express")
const router = express.Router()

const authCustomer = require("../../middleware/authCustomer")
const {
  getSeatsByBus,
  selectSeats,
  bookSeats
} = require("../../controllers/customer/seatBookingController")

router.get("/:busId", getSeatsByBus)
router.post("/select", authCustomer, selectSeats)
router.post("/book", authCustomer, bookSeats)

module.exports = router

const express = require("express")
const router = express.Router()

const { getSeats, getSeatMap } = require("../../controllers/customer/seatController")

router.get("/:id/seats", getSeats)
router.get("/:id/seat-map", getSeatMap)

module.exports = router

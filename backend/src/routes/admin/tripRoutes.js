const express = require("express")
const router = express.Router()

const tripController = require("../../controllers/admin/tripController")
const authMiddleware = require("../../middleware/auth.middleware")

router.post(
"/trips",
authMiddleware,
tripController.createTrip
)

router.get("/trips", authMiddleware, tripController.listTrips)
router.put("/trips/:id", authMiddleware, tripController.updateTrip)
router.delete("/trips/:id", authMiddleware, tripController.deleteTrip)

router.get("/trips/:id/seats", authMiddleware, tripController.getTripSeatMap);

module.exports = router

const express = require("express")
const router = express.Router()

const busController = require("../../controllers/admin/busController")
const authMiddleware = require("../../middleware/auth.middleware")

router.post(
"/buses",
authMiddleware,
busController.createBus
)

router.get("/buses", authMiddleware, busController.listBuses)
router.get("/bus-types", authMiddleware, busController.listBusTypes)

router.put("/buses/:id", authMiddleware, busController.updateBus)

router.delete("/buses/:id", authMiddleware, busController.deleteBus)

module.exports = router

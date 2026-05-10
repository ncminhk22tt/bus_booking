const express = require("express")
const router = express.Router()

const routeController = require("../../controllers/admin/routeController")
const authMiddleware = require("../../middleware/auth.middleware")

router.post(
"/routes",
authMiddleware,
routeController.createRoute
)

router.get("/routes", authMiddleware, routeController.listRoutes)
router.get("/routes/:id/points", authMiddleware, routeController.getRoutePoints)
router.post("/routes/:id/pickup-points", authMiddleware, routeController.createRoutePickupPoint)
router.post("/routes/:id/dropoff-points", authMiddleware, routeController.createRouteDropoffPoint)
router.delete("/routes/:id/pickup-points/:pointId", authMiddleware, routeController.deleteRoutePickupPoint)
router.delete("/routes/:id/dropoff-points/:pointId", authMiddleware, routeController.deleteRouteDropoffPoint)

router.put("/routes/:id", authMiddleware, routeController.updateRoute)

router.delete("/routes/:id", authMiddleware, routeController.deleteRoute)

module.exports = router

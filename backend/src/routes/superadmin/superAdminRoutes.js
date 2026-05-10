const express = require("express")
const router = express.Router()

const controller = require("../../controllers/superadmin/superAdminController")
const superAdminMiddleware = require("../../middleware/superAdminMiddleware")

router.post(
"/create-admin",
superAdminMiddleware,
controller.createAdmin
)

router.get("/overview", superAdminMiddleware, controller.getOverview)

router.get("/companies", superAdminMiddleware, controller.listCompanies)
router.put("/companies/:id", superAdminMiddleware, controller.updateCompany)
router.put("/companies/:id/active", superAdminMiddleware, controller.setCompanyActive)
router.delete("/companies/:id", superAdminMiddleware, controller.deleteCompany)
router.get("/companies/:id", superAdminMiddleware, controller.getCompanyDetail)

router.get("/admins", superAdminMiddleware, controller.listAdmins)
router.put("/admins/:id/active", superAdminMiddleware, controller.setAdminActive)
router.put("/admins/:id/role", superAdminMiddleware, controller.setAdminRole)
router.put("/admins/:id/reset-password", superAdminMiddleware, controller.resetAdminPassword)
router.get("/admins/:id", superAdminMiddleware, controller.getAdminDetail)

router.get("/bus-types", superAdminMiddleware, controller.listBusTypes)
router.post("/bus-types", superAdminMiddleware, controller.createBusType)

module.exports = router

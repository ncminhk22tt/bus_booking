const express = require("express")
const router = express.Router()

const controller = require("../../controllers/admin/adminController")
const authMiddleware = require("../../middleware/auth.middleware")

router.put(
"/update-profile",
authMiddleware,
controller.updateProfile
)

module.exports = router

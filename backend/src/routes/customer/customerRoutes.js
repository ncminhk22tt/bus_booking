const express = require("express")
const router = express.Router()

const authCustomer = require("../../middleware/authCustomer")
const { getProfile, updateProfile, changePassword } = require("../../controllers/customer/customerController")

router.get("/me", authCustomer, getProfile)
router.put("/profile", authCustomer, updateProfile)
router.put("/password", authCustomer, changePassword)

module.exports = router

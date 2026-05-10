const express = require("express")
const router = express.Router()

const controller = require("../../controllers/admin/adminAuthController")

router.post("/login",controller.login)

module.exports = router
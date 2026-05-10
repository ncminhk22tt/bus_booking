const express = require("express")

const { getCities } = require("../../controllers/customer/cityController")

const router = express.Router()

router.get("/", getCities)

module.exports = router

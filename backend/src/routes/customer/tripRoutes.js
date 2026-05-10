const express = require("express")
const router = express.Router()

const { search, filters, detail } = require("../../controllers/customer/tripController")

router.get("/search/filters", filters)
router.get("/search", search)
router.get("/:id", detail)

module.exports = router

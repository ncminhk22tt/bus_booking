const { listCities } = require("../../models/customer/cityModel")

async function getCities(req, res) {
  try {
    const cities = await listCities()
    res.json(cities)
  } catch (error) {
    console.error("Get cities error:", error)
    res.status(500).json({
      message: "Lỗi server"
    })
  }
}

module.exports = {
  getCities
}

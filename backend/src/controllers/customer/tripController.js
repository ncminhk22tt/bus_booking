const db = require("../../config/db")
const {
  searchTrips,
  getSearchFilters,
  getTripDetail
} = require("../../models/customer/tripModel")

function normalizeDateInput(rawDate) {
  const value = String(rawDate || "").trim()
  if (!value) return ""

  // Accept yyyy-mm-dd directly
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value

  // Accept dd/mm/yyyy or d/m/yyyy
  const m = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return ""

  const day = Number(m[1])
  const month = Number(m[2])
  const year = Number(m[3])
  if (day < 1 || day > 31 || month < 1 || month > 12) return ""

  const dd = String(day).padStart(2, "0")
  const mm = String(month).padStart(2, "0")
  return `${year}-${mm}-${dd}`
}

async function resolveCityId(rawValue) {
  const value = String(rawValue || "").trim()
  if (!value) return null

  // If frontend sends city id
  if (/^\d+$/.test(value)) return Number(value)

  // Fallback: allow sending city name (e.g. "Cần Thơ")
  const [rows] = await db.query(
    `
    SELECT id
    FROM cities
    WHERE name = ?
    LIMIT 1
    `,
    [value]
  )

  if (rows.length === 0) return null
  return Number(rows[0].id)
}

async function search(req, res) {
  try {
    const from_city = await resolveCityId(req.query.from_city)
    const to_city = await resolveCityId(req.query.to_city)
    const date = normalizeDateInput(req.query.date)

    if (!from_city || !to_city || !date) {
      return res.status(400).json({
        message: "Thiếu tham số tìm kiếm"
      })
    }

    const trips = await searchTrips(from_city, to_city, date, req.query)

    res.json(trips)
  } catch (error) {
    console.error("Search trips error:", error)
    res.status(500).json({
      message: "Lỗi server"
    })
  }
}

async function filters(req, res) {
  try {
    const from_city = await resolveCityId(req.query.from_city)
    const to_city = await resolveCityId(req.query.to_city)
    const date = normalizeDateInput(req.query.date)

    if (!from_city || !to_city || !date) {
      return res.status(400).json({
        message: "Thiếu tham số tìm kiếm"
      })
    }

    const filterData = await getSearchFilters(from_city, to_city, date)
    res.json(filterData)
  } catch (error) {
    console.error("Get trip filters error:", error)
    res.status(500).json({
      message: "Lỗi server"
    })
  }
}

async function detail(req, res) {
  try {
    const { id } = req.params
    const trip = await getTripDetail(id)
    if (!trip) {
      return res.status(404).json({
        message: "Chuyến không tồn tại"
      })
    }
    res.json(trip)
  } catch (error) {
    console.error("Trip detail error:", error)
    res.status(500).json({
      message: "Lỗi server"
    })
  }
}

module.exports = {
  search,
  filters,
  detail
}

const seatModel = require("../../models/customer/seatModel")

function normalizeSeatIds(value) {
  if (!Array.isArray(value)) return []
  return [...new Set(value.map((item) => Number(item)).filter((item) => Number.isInteger(item) && item > 0))]
}

async function getSeatsByBus(req, res) {
  try {
    const busId = Number(req.params.busId)
    const tripId = req.query.trip_id ? Number(req.query.trip_id) : null

    if (!Number.isInteger(busId) || busId <= 0) {
      return res.status(400).json({ message: "busId không hợp lệ" })
    }

    if (req.query.trip_id && (!Number.isInteger(tripId) || tripId <= 0)) {
      return res.status(400).json({ message: "trip_id không hợp lệ" })
    }

    const seats = await seatModel.getSeatsByBus(busId, tripId)
    return res.json(seats)
  } catch (error) {
    console.error("Get seats by bus error:", error)
    return res.status(500).json({ message: "Lỗi server" })
  }
}

async function selectSeats(req, res) {
  try {
    const tripId = Number(req.body.trip_id)
    const seatIds = normalizeSeatIds(req.body.seat_ids)
    const action = req.body.action === "unselect" ? "unselect" : "select"

    if (!Number.isInteger(tripId) || tripId <= 0) {
      return res.status(400).json({ message: "trip_id không hợp lệ" })
    }

    if (seatIds.length === 0) {
      return res.status(400).json({ message: "Danh sách ghế trống" })
    }
    if (seatIds.length > 6) {
      return res.status(400).json({ message: "Bạn chỉ được chọn tối đa 6 ghế" })
    }

    const result = await seatModel.selectSeats(tripId, seatIds, action)
    if (action === "select" && result.affectedRows !== seatIds.length) {
      return res.status(409).json({
        message: "Một hoặc nhiều ghế không còn khả dụng"
      })
    }

    return res.json({
      message: action === "select" ? "Giữ ghế thành công" : "Bỏ chọn ghế thành công",
      affected_rows: result.affectedRows
    })
  } catch (error) {
    console.error("Select seats error:", error)
    return res.status(500).json({ message: "Lỗi server" })
  }
}

async function bookSeats(req, res) {
  try {
    const tripId = Number(req.body.trip_id)
    const seatIds = normalizeSeatIds(req.body.seat_ids)

    if (!Number.isInteger(tripId) || tripId <= 0) {
      return res.status(400).json({ message: "trip_id không hợp lệ" })
    }

    if (seatIds.length === 0) {
      return res.status(400).json({ message: "Danh sách ghế trống" })
    }
    if (seatIds.length > 6) {
      return res.status(400).json({ message: "Bạn chỉ được chọn tối đa 6 ghế" })
    }

    const result = await seatModel.bookSeats(tripId, seatIds)
    if (!result.ok) {
      return res.status(409).json({
        message: result.message,
        conflict_seat_ids: result.conflict_seat_ids || []
      })
    }

    return res.json({
      message: "Đặt ghế thành công",
      seat_ids: seatIds
    })
  } catch (error) {
    console.error("Book seats error:", error)
    return res.status(500).json({ message: "Lỗi server" })
  }
}

module.exports = {
  getSeatsByBus,
  selectSeats,
  bookSeats
}

const db = require("../../config/db")
const bookingModel = require("../../models/customer/bookingModel")

async function getBookingsByTrip(req, res) {
  try {
    const { tripId } = req.params
    const companyId = req.user && req.user.bus_company_id
    if (!companyId) {
      return res.status(403).json({
        message: "Thiếu quyền nhà xe"
      })
    }

    const rows = await bookingModel.getBookingsByTrip(tripId, companyId)
    res.json(rows)
  } catch (error) {
    console.error("Admin bookings by trip error:", error)
    res.status(500).json({
      message: "Lỗi server"
    })
  }
}

async function getTripSeatsByTrip(req, res) {
  try {
    const { tripId } = req.params
    const companyId = req.user && req.user.bus_company_id
    if (!companyId) {
      return res.status(403).json({
        message: "Thiếu quyền nhà xe"
      })
    }

    const seats = await bookingModel.getTripSeatsByTrip(tripId, companyId)
    res.json(seats)
  } catch (error) {
    console.error("Admin trip seats error:", error)
    res.status(500).json({
      message: "Lỗi server"
    })
  }
}

async function updateTripSeatSettings(req, res) {
  try {
    const { tripId, seatId } = req.params
    const companyId = req.user && req.user.bus_company_id
    if (!companyId) {
      return res.status(403).json({
        message: "Thiếu quyền nhà xe"
      })
    }

    const isVip = Boolean(req.body?.is_vip)
    const locked = Boolean(req.body?.locked)

    const result = await bookingModel.updateTripSeatSettings(
      Number(tripId),
      Number(seatId),
      companyId,
      { isVip, locked }
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Không tìm thấy ghế trong chuyến hoặc không thuộc quyền nhà xe"
      })
    }

    res.json({
      message: "Cập nhật trạng thái ghế thành công"
    })
  } catch (error) {
    console.error("Admin update trip seat settings error:", error)
    res.status(500).json({
      message: "Lỗi server"
    })
  }
}

module.exports = {
  getBookingsByTrip,
  getTripSeatsByTrip,
  updateTripSeatSettings
}

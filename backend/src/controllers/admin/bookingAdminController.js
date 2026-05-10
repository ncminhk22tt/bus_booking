const db = require("../../config/db")
const bookingModel = require("../../models/customer/bookingModel")

async function getBookingsByTrip(req, res) {
  try {
    const { tripId } = req.params
    const companyId = req.user && req.user.bus_company_id
    const isSuperAdmin = req.user && req.user.role === 'super_admin'

    // Super admin có thể xem tất cả, admin thường chỉ xem của công ty mình
    if (!isSuperAdmin && !companyId) {
      return res.status(403).json({
        message: "Thiếu quyền nhà xe"
      })
    }

    // Kiểm tra trip có tồn tại không
    const [tripCheck] = await db.query('SELECT id FROM trips WHERE id = ?', [tripId])
    if (tripCheck.length === 0) {
      return res.status(404).json({
        message: "Chuyến đi không tồn tại"
      })
    }

    const rows = await bookingModel.getBookingsByTrip(tripId, isSuperAdmin ? null : companyId)
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
    const isSuperAdmin = req.user && req.user.role === 'super_admin'

    // Super admin có thể xem tất cả, admin thường chỉ xem của công ty mình
    if (!isSuperAdmin && !companyId) {
      return res.status(403).json({
        message: "Thiếu quyền nhà xe"
      })
    }

    const seats = await bookingModel.getTripSeatsByTrip(tripId, isSuperAdmin ? null : companyId)
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

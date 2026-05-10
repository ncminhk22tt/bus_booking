const tripModel = require("../../models/admin/tripModel")
const routeModel = require("../../models/admin/routeModel")
const busModel = require("../../models/admin/busModel")
const { generateTripSeats } = require("../../services/tripSeatService")

function normalizePoints(points) {
  if (!Array.isArray(points)) return []
  return points
    .map((item) => ({
      name: String(item?.name || "").trim(),
      address: String(item?.address || "").trim() || null,
      time_offset_min: Number(item?.time_offset_min || 0)
    }))
    .filter((item) => item.name.length > 0)
}

function parseDateSafe(value) {
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function validateTripTimes(departureTime, arrivalTime) {
  const departureAt = parseDateSafe(departureTime)
  const arrivalAt = parseDateSafe(arrivalTime)
  const now = new Date()

  if (!departureAt || !arrivalAt) {
    return { ok: false, message: "Thời gian đi/đến không hợp lệ" }
  }

  if (departureAt < now) {
    return { ok: false, message: "Giờ đi không được trước thời điểm hiện tại" }
  }

  if (arrivalAt <= departureAt) {
    return { ok: false, message: "Giờ đến phải sau giờ đi" }
  }

  return { ok: true }
}

const createTrip = async (req, res) => {
  try {
    const companyId = Number(req.user?.bus_company_id || 0)
    if (!companyId) {
      return res.status(403).json({ message: "Thiếu quyền nhà xe" })
    }

    const {
      route_id,
      bus_id,
      departure_time,
      arrival_time,
      price,
      pickup_points,
      dropoff_points
    } = req.body

    if (!route_id || !bus_id || !departure_time || !arrival_time || !price) {
      return res.status(400).json({
        message: "Thiếu thông tin bắt buộc"
      })
    }

    const timeCheck = validateTripTimes(departure_time, arrival_time)
    if (!timeCheck.ok) {
      return res.status(400).json({ message: timeCheck.message })
    }

    const targetBusId = Number(bus_id)
    const targetRouteId = Number(route_id)

    const bus = await busModel.getBusById(targetBusId, companyId)
    if (!bus) {
      return res.status(404).json({ message: "Xe không tồn tại hoặc không thuộc nhà xe của bạn" })
    }

    const route = await routeModel.getRouteByIdAndCompany(targetRouteId, companyId)
    if (!route) {
      return res.status(404).json({ message: "Tuyến không tồn tại hoặc không thuộc nhà xe của bạn" })
    }

    const tripId = await tripModel.createTrip(
      targetBusId,
      targetRouteId,
      departure_time,
      arrival_time,
      price
    )

    const normalizedPickup = normalizePoints(pickup_points)
    const normalizedDropoff = normalizePoints(dropoff_points)

    if (normalizedPickup.length > 0 || normalizedDropoff.length > 0) {
      await tripModel.syncTripPoints(tripId, normalizedPickup, normalizedDropoff)
    } else {
      await routeModel.copyRoutePointsToTrip(targetRouteId, tripId)
    }

    await generateTripSeats(tripId, targetBusId)

    res.json({
      message: "Tạo chuyến thành công",
      trip_id: tripId
    })
  } catch (error) {
    console.error("Create trip error:", error)
    res.status(500).json({
      message: "Lỗi server",
      error: error.message
    })
  }
}

const getTripSeatMap = async (req, res) => {
  try {
    const tripId = req.params.id
    const companyId = Number(req.user?.bus_company_id || 0)
    if (!companyId) {
      return res.status(403).json({ message: "Thiếu quyền nhà xe" })
    }

    const trip = await tripModel.getTripByIdAndCompany(tripId, companyId)
    if (!trip) {
      return res.status(404).json({ message: "Chuyến không tồn tại hoặc không thuộc nhà xe của bạn" })
    }

    const seats = await tripModel.getTripSeats(tripId)

    res.json({
      trip_id: tripId,
      seats: seats
    })
  } catch (error) {
    console.error("Get trip seats error:", error)
    res.status(500).json({
      message: "Lỗi server"
    })
  }
}

const listTrips = async (req, res) => {
  try {
    const companyId = req.user && req.user.bus_company_id
    if (!companyId) {
      return res.status(403).json({
        message: "Thiếu quyền nhà xe"
      })
    }

    const rows = await tripModel.listTrips(companyId)
    res.json(rows)
  } catch (error) {
    console.error("List trips error:", error)
    res.status(500).json({
      message: "Lỗi server"
    })
  }
}

const updateTrip = async (req, res) => {
  try {
    const companyId = Number(req.user?.bus_company_id || 0)
    if (!companyId) {
      return res.status(403).json({
        message: "Thiếu quyền nhà xe"
      })
    }

    const tripId = req.params.id
    const targetBusId = Number(req.body?.bus_id)
    const targetRouteId = Number(req.body?.route_id)

    if (!targetBusId || !targetRouteId) {
      return res.status(400).json({
        message: "Thiếu xe hoặc tuyến"
      })
    }

    const timeCheck = validateTripTimes(req.body?.departure_time, req.body?.arrival_time)
    if (!timeCheck.ok) {
      return res.status(400).json({ message: timeCheck.message })
    }

    const existedTrip = await tripModel.getTripByIdAndCompany(tripId, companyId)
    if (!existedTrip) {
      return res.status(404).json({
        message: "Chuyến không tồn tại hoặc không thuộc nhà xe của bạn"
      })
    }

    const bus = await busModel.getBusById(targetBusId, companyId)
    if (!bus) {
      return res.status(404).json({ message: "Xe không tồn tại hoặc không thuộc nhà xe của bạn" })
    }

    const route = await routeModel.getRouteByIdAndCompany(targetRouteId, companyId)
    if (!route) {
      return res.status(404).json({ message: "Tuyến không tồn tại hoặc không thuộc nhà xe của bạn" })
    }

    const result = await tripModel.updateTrip(tripId, companyId, req.body)

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Chuyến không tồn tại hoặc không thuộc nhà xe của bạn"
      })
    }

    const normalizedPickup = normalizePoints(req.body?.pickup_points)
    const normalizedDropoff = normalizePoints(req.body?.dropoff_points)

    if (normalizedPickup.length > 0 || normalizedDropoff.length > 0) {
      await tripModel.syncTripPoints(tripId, normalizedPickup, normalizedDropoff)
    } else {
      await routeModel.copyRoutePointsToTrip(targetRouteId, tripId)
    }

    res.json({
      message: "Cập nhật chuyến thành công"
    })
  } catch (error) {
    console.error("Update trip error:", error)
    res.status(500).json({
      message: "Lỗi server"
    })
  }
}

const deleteTrip = async (req, res) => {
  try {
    const companyId = req.user && req.user.bus_company_id
    if (!companyId) {
      return res.status(403).json({
        message: "Thiếu quyền nhà xe"
      })
    }

    const tripId = req.params.id
    const result = await tripModel.deleteTrip(tripId, companyId)

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Chuyến không tồn tại hoặc không thuộc nhà xe của bạn"
      })
    }

    res.json({
      message: "Đã hủy chuyến thành công"
    })
  } catch (error) {
    console.error("Delete trip error:", error)
    res.status(500).json({
      message: "Lỗi server"
    })
  }
}

module.exports = {
  createTrip,
  getTripSeatMap,
  listTrips,
  updateTrip,
  deleteTrip
}

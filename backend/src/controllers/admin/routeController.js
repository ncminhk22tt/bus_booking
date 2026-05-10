const routeModel = require("../../models/admin/routeModel")

function toNumber(value) {
  const num = Number(value)
  return Number.isNaN(num) ? 0 : num
}

const createRoute = async (req, res) => {
  try {
    const companyId = Number(req.user?.bus_company_id || 0)
    if (!companyId) {
      return res.status(403).json({ message: "Thiếu quyền nhà xe" })
    }

    const {
      departure_city_id,
      arrival_city_id,
      distance_km,
      estimated_time,
      pickup_points,
      dropoff_points
    } = req.body

    const routeId = await routeModel.createRoute(
      companyId,
      departure_city_id,
      arrival_city_id,
      distance_km,
      estimated_time,
      pickup_points,
      dropoff_points
    )

    res.json({
      message: "Tạo tuyến xe thành công",
      route_id: routeId
    })
  } catch (error) {
    console.error("Create route error:", error)
    res.status(500).json({
      message: "Lỗi server",
      error: error.message
    })
  }
}

const updateRoute = async (req, res) => {
  try {
    const companyId = Number(req.user?.bus_company_id || 0)
    if (!companyId) {
      return res.status(403).json({ message: "Thiếu quyền nhà xe" })
    }

    const routeId = req.params.id

    const result = await routeModel.updateRoute(routeId, companyId, req.body)

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Tuyến xe không tồn tại hoặc không thuộc nhà xe của bạn"
      })
    }

    res.json({
      message: "Cập nhật tuyến xe thành công"
    })
  } catch (error) {
    console.error("Update route error:", error)
    res.status(500).json({
      message: "Lỗi server"
    })
  }
}

const deleteRoute = async (req, res) => {
  try {
    const companyId = Number(req.user?.bus_company_id || 0)
    if (!companyId) {
      return res.status(403).json({ message: "Thiếu quyền nhà xe" })
    }

    const routeId = req.params.id

    const result = await routeModel.deleteRoute(routeId, companyId)

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Tuyến xe không tồn tại hoặc không thuộc nhà xe của bạn"
      })
    }

    res.json({
      message: "Ngừng hoạt động tuyến xe thành công"
    })
  } catch (error) {
    console.error("Delete route error:", error)
    res.status(500).json({
      message: "Lỗi server"
    })
  }
}

const listRoutes = async (req, res) => {
  try {
    const companyId = Number(req.user?.bus_company_id || 0)
    if (!companyId) {
      return res.status(403).json({ message: "Thiếu quyền nhà xe" })
    }

    const rows = await routeModel.listRoutes(companyId)
    res.json(rows)
  } catch (error) {
    console.error("List routes error:", error)
    res.status(500).json({
      message: "Lỗi server"
    })
  }
}

const getRoutePoints = async (req, res) => {
  try {
    const routeId = Number(req.params.id)
    const companyId = Number(req.user?.bus_company_id || 0)

    if (!routeId) {
      return res.status(400).json({ message: "Thiếu route_id" })
    }
    if (!companyId) {
      return res.status(403).json({ message: "Thiếu quyền nhà xe" })
    }

    const points = await routeModel.listRoutePoints(routeId, companyId)
    res.json(points)
  } catch (error) {
    console.error("Get route points error:", error)
    res.status(500).json({ message: "Lỗi server" })
  }
}

const createRoutePickupPoint = async (req, res) => {
  try {
    const routeId = Number(req.params.id)
    const companyId = Number(req.user?.bus_company_id || 0)
    const name = String(req.body?.name || "").trim()

    if (!routeId || !name) {
      return res.status(400).json({ message: "Thiếu thông tin điểm đón" })
    }
    if (!companyId) {
      return res.status(403).json({ message: "Thiếu quyền nhà xe" })
    }

    const route = await routeModel.getRouteByIdAndCompany(routeId, companyId)
    if (!route) {
      return res.status(404).json({ message: "Tuyến không tồn tại hoặc không thuộc nhà xe của bạn" })
    }

    await routeModel.createRoutePickupPoint(routeId, {
      name,
      address: req.body?.address,
      time_offset_min: toNumber(req.body?.time_offset_min)
    })

    res.json({ message: "Thêm điểm đón thành công" })
  } catch (error) {
    console.error("Create route pickup point error:", error)
    res.status(500).json({ message: "Lỗi server" })
  }
}

const createRouteDropoffPoint = async (req, res) => {
  try {
    const routeId = Number(req.params.id)
    const companyId = Number(req.user?.bus_company_id || 0)
    const name = String(req.body?.name || "").trim()

    if (!routeId || !name) {
      return res.status(400).json({ message: "Thiếu thông tin điểm trả" })
    }
    if (!companyId) {
      return res.status(403).json({ message: "Thiếu quyền nhà xe" })
    }

    const route = await routeModel.getRouteByIdAndCompany(routeId, companyId)
    if (!route) {
      return res.status(404).json({ message: "Tuyến không tồn tại hoặc không thuộc nhà xe của bạn" })
    }

    await routeModel.createRouteDropoffPoint(routeId, {
      name,
      address: req.body?.address,
      time_offset_min: toNumber(req.body?.time_offset_min)
    })

    res.json({ message: "Thêm điểm trả thành công" })
  } catch (error) {
    console.error("Create route dropoff point error:", error)
    res.status(500).json({ message: "Lỗi server" })
  }
}

const deleteRoutePickupPoint = async (req, res) => {
  try {
    const routeId = Number(req.params.id)
    const pointId = Number(req.params.pointId)
    const companyId = Number(req.user?.bus_company_id || 0)

    if (!routeId || !pointId) {
      return res.status(400).json({ message: "Thiếu thông tin điểm đón" })
    }
    if (!companyId) {
      return res.status(403).json({ message: "Thiếu quyền nhà xe" })
    }

    const result = await routeModel.deleteRoutePickupPoint(routeId, pointId, companyId)
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy điểm đón hoặc không có quyền" })
    }

    res.json({ message: "Đã xóa điểm đón" })
  } catch (error) {
    console.error("Delete route pickup point error:", error)
    res.status(500).json({ message: "Lỗi server" })
  }
}

const deleteRouteDropoffPoint = async (req, res) => {
  try {
    const routeId = Number(req.params.id)
    const pointId = Number(req.params.pointId)
    const companyId = Number(req.user?.bus_company_id || 0)

    if (!routeId || !pointId) {
      return res.status(400).json({ message: "Thiếu thông tin điểm trả" })
    }
    if (!companyId) {
      return res.status(403).json({ message: "Thiếu quyền nhà xe" })
    }

    const result = await routeModel.deleteRouteDropoffPoint(routeId, pointId, companyId)
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy điểm trả hoặc không có quyền" })
    }

    res.json({ message: "Đã xóa điểm trả" })
  } catch (error) {
    console.error("Delete route dropoff point error:", error)
    res.status(500).json({ message: "Lỗi server" })
  }
}

module.exports = {
  createRoute,
  updateRoute,
  deleteRoute,
  listRoutes,
  getRoutePoints,
  createRoutePickupPoint,
  createRouteDropoffPoint,
  deleteRoutePickupPoint,
  deleteRouteDropoffPoint
}

const bcrypt = require("bcryptjs")
const superAdminModel = require("../../models/superadmin/superAdminModel")
const { parseLayoutGroups } = require("../../services/seatService")

function normalizePhone(value) {
  return String(value || "").trim()
}

function parseFlag(value) {
  return Number(value) ? 1 : 0
}

exports.createAdmin = async (req, res) => {
  const { phone, password, company_name, address } = req.body

  try {
    const normalizedPhone = normalizePhone(phone)
    if (!normalizedPhone || !password) {
      return res.status(400).json({ message: "Thiếu số điện thoại hoặc mật khẩu" })
    }

    const existedAdmin = await superAdminModel.findAnyAdminByPhone(normalizedPhone)
    if (existedAdmin) {
      return res.status(400).json({ message: "Số điện thoại đã tồn tại ở tài khoản admin khác" })
    }

    const existedCompany = await superAdminModel.getCompanyByPhone(normalizedPhone)
    if (existedCompany) {
      return res.status(400).json({ message: "Số điện thoại đã tồn tại ở nhà xe khác" })
    }

    const hashedPassword = await bcrypt.hash(String(password), 10)
    const companyId = await superAdminModel.createCompany(
      String(company_name || `Nhà xe ${normalizedPhone}`).trim(),
      normalizedPhone,
      String(address || "").trim() || null
    )

    await superAdminModel.createAdmin(normalizedPhone, hashedPassword, companyId)

    return res.json({ message: "Tạo admin và nhà xe thành công" })
  } catch (error) {
    console.error("Create admin error:", error)
    return res.status(500).json({ message: "Lỗi server", error: error.message })
  }
}

exports.getOverview = async (req, res) => {
  try {
    const overview = await superAdminModel.getOverviewStats()
    return res.json(overview)
  } catch (error) {
    console.error("Overview error:", error)
    return res.status(500).json({ message: "Lỗi server" })
  }
}

exports.listCompanies = async (req, res) => {
  try {
    const rows = await superAdminModel.listCompanies()
    return res.json(rows)
  } catch (error) {
    console.error("List companies error:", error)
    return res.status(500).json({ message: "Lỗi server" })
  }
}

exports.getCompanyDetail = async (req, res) => {
  try {
    const { id } = req.params
    const company = await superAdminModel.getCompanyById(id)
    if (!company) {
      return res.status(404).json({ message: "Không tìm thấy nhà xe" })
    }
    return res.json(company)
  } catch (error) {
    console.error("Get company detail error:", error)
    return res.status(500).json({ message: "Lỗi server" })
  }
}

exports.updateCompany = async (req, res) => {
  try {
    const { id } = req.params
    const payload = {
      name: String(req.body?.name || "").trim(),
      phone: normalizePhone(req.body?.phone),
      address: String(req.body?.address || "").trim() || null
    }

    if (!payload.name || !payload.phone) {
      return res.status(400).json({ message: "Thiếu tên nhà xe hoặc số điện thoại" })
    }

    const result = await superAdminModel.updateCompany(id, payload)
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy nhà xe" })
    }
    return res.json({ message: "Cập nhật nhà xe thành công" })
  } catch (error) {
    console.error("Update company error:", error)
    return res.status(500).json({ message: "Lỗi server" })
  }
}

exports.setCompanyActive = async (req, res) => {
  try {
    const { id } = req.params
    const isActive = parseFlag(req.body?.is_active)
    const result = await superAdminModel.setCompanyActive(id, isActive)
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy nhà xe" })
    }
    await superAdminModel.setAdminsActiveByCompany(id, isActive)
    return res.json({ message: "Cập nhật trạng thái nhà xe thành công" })
  } catch (error) {
    console.error("Set company active error:", error)
    return res.status(500).json({ message: "Lỗi server" })
  }
}

exports.deleteCompany = async (req, res) => {
  try {
    const { id } = req.params
    const company = await superAdminModel.getCompanyById(id)
    if (!company) {
      return res.status(404).json({ message: "Không tìm thấy nhà xe" })
    }

    const result = await superAdminModel.softDeleteCompany(id)
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy nhà xe" })
    }

    await superAdminModel.deactivateAdminsByCompany(id)

    return res.json({ message: "Xóa nhà xe thành công" })
  } catch (error) {
    console.error("Delete company error:", error)
    return res.status(500).json({ message: "Lỗi server" })
  }
}

exports.listAdmins = async (req, res) => {
  try {
    const rows = await superAdminModel.listAdmins()
    return res.json(rows)
  } catch (error) {
    console.error("List admins error:", error)
    return res.status(500).json({ message: "Lỗi server" })
  }
}

exports.getAdminDetail = async (req, res) => {
  try {
    const { id } = req.params
    const admin = await superAdminModel.getAdminById(id)
    if (!admin) {
      return res.status(404).json({ message: "Không tìm thấy admin" })
    }
    return res.json(admin)
  } catch (error) {
    console.error("Get admin detail error:", error)
    return res.status(500).json({ message: "Lỗi server" })
  }
}

exports.setAdminActive = async (req, res) => {
  try {
    const { id } = req.params
    const result = await superAdminModel.setAdminActive(id, parseFlag(req.body?.is_active))
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy admin" })
    }
    return res.json({ message: "Cập nhật trạng thái admin thành công" })
  } catch (error) {
    console.error("Set admin active error:", error)
    return res.status(500).json({ message: "Lỗi server" })
  }
}

exports.setAdminRole = async (req, res) => {
  try {
    const { id } = req.params
    const role = String(req.body?.role || "")

    if (role !== "admin") {
      return res.status(400).json({
        message: "Admin là tài khoản quản lý nhà xe, không thể đổi lên super_admin"
      })
    }

    const targetAdmin = await superAdminModel.getAdminById(id)
    if (!targetAdmin) {
      return res.status(404).json({ message: "Không tìm thấy admin" })
    }
    if (!targetAdmin.bus_company_id) {
      return res.status(400).json({ message: "Tài khoản này chưa gắn nhà xe nên không thể đặt role admin" })
    }

    const existed = await superAdminModel.countAdminsByCompanyId(
      targetAdmin.bus_company_id,
      targetAdmin.id
    )
    if (existed > 0) {
      return res.status(400).json({
        message: "Mỗi nhà xe chỉ được có 1 tài khoản admin quản lý"
      })
    }

    const result = await superAdminModel.setAdminRole(id, role)
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy admin" })
    }

    return res.json({ message: "Đổi quyền thành công" })
  } catch (error) {
    console.error("Set admin role error:", error)
    return res.status(500).json({ message: "Lỗi server" })
  }
}

exports.resetAdminPassword = async (req, res) => {
  try {
    const { id } = req.params
    const newPassword = String(req.body?.new_password || "")

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Mật khẩu mới phải có ít nhất 6 ký tự" })
    }

    const hashed = await bcrypt.hash(newPassword, 10)
    const result = await superAdminModel.resetAdminPassword(id, hashed)
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy admin" })
    }

    return res.json({ message: "Reset mật khẩu thành công" })
  } catch (error) {
    console.error("Reset admin password error:", error)
    return res.status(500).json({ message: "Lỗi server" })
  }
}

exports.listBusTypes = async (req, res) => {
  try {
    const rows = await superAdminModel.listBusTypes()
    return res.json(rows)
  } catch (error) {
    console.error("List bus types error:", error)
    return res.status(500).json({ message: "Lỗi server" })
  }
}

exports.createBusType = async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim()
    const description = String(req.body?.description || "").trim() || null
    const floors = Number(req.body?.floors)
    const rowCount = Number(req.body?.row_count)
    const seatType = String(req.body?.seat_type || "").trim().toLowerCase()
    const layout = String(req.body?.layout || "").trim()
    const seatMapTemplate = req.body?.seat_map_template || null

    if (!name || !layout || !Number.isInteger(floors) || !Number.isInteger(rowCount) || floors <= 0 || rowCount <= 0) {
      return res.status(400).json({ message: "Thiếu hoặc sai dữ liệu loại xe" })
    }

    if (!["seat", "bed", "vip"].includes(seatType)) {
      return res.status(400).json({ message: "seat_type phải là seat, bed hoặc vip" })
    }

    let colCount = 0
    let totalSeats = 0
    let normalizedTemplate = null

    if (seatMapTemplate && Array.isArray(seatMapTemplate.floors)) {
      const requestedColCount = Math.max(1, Number(req.body?.col_count || layout || 0))
      normalizedTemplate = {
        floors: seatMapTemplate.floors.map((floorItem) => ({
          floor: Number(floorItem.floor),
          rows: Array.isArray(floorItem.rows)
            ? floorItem.rows.map((rowItem) => ({
                row: Number(rowItem.row),
                seat_cols: Array.isArray(rowItem.seat_cols)
                  ? rowItem.seat_cols.map((n) => Number(n)).filter((n) => Number.isInteger(n) && n > 0)
                  : []
              }))
            : []
        }))
      }

      for (const floorItem of normalizedTemplate.floors) {
        for (const rowItem of floorItem.rows) {
          for (const col of rowItem.seat_cols) {
            colCount = Math.max(colCount, col)
          }
          totalSeats += rowItem.seat_cols.length
        }
      }

      if (totalSeats <= 0 || colCount <= 0) {
        return res.status(400).json({ message: "Template sơ đồ ghế không hợp lệ" })
      }

      // Giữ nguyên số cột gốc khi render sơ đồ để ô không chọn hiện thành khoảng trống.
      colCount = Math.max(colCount, requestedColCount)
    } else {
      const groups = parseLayoutGroups(layout)
      if (!groups || groups.length === 0) {
        return res.status(400).json({ message: "Layout không hợp lệ. Ví dụ: 2-2 hoặc 1-1-1" })
      }
      colCount = groups.reduce((sum, n) => sum + n, 0) + Math.max(groups.length - 1, 0)
      const seatsPerRow = groups.reduce((sum, n) => sum + n, 0)
      totalSeats = floors * rowCount * seatsPerRow
    }

    const insertId = await superAdminModel.createBusType({
      name,
      description,
      floors,
      row_count: rowCount,
      col_count: colCount,
      total_seats: totalSeats,
      seat_type: seatType,
      layout,
      seat_map_template: normalizedTemplate ? JSON.stringify(normalizedTemplate) : null
    })

    return res.json({
      message: "Tạo loại xe thành công",
      bus_type_id: insertId,
      computed: {
        col_count: colCount,
        total_seats: totalSeats
      }
    })
  } catch (error) {
    console.error("Create bus type error:", error)
    return res.status(500).json({ message: "Lỗi server" })
  }
}

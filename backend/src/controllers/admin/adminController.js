const bcrypt = require("bcryptjs")
const adminModel = require("../../models/admin/adminModel")

exports.updateProfile = async (req, res) => {
  const adminId = req.user.id
  const companyId = req.user.bus_company_id

  const { phone, password, company_name, address } = req.body

  try {
    if (!phone && !password && !company_name && !address) {
      return res.status(400).json({
        message: "Không có dữ liệu để cập nhật"
      })
    }

    const admin = await adminModel.findById(adminId)
    if (!admin) {
      return res.status(404).json({
        message: "Admin không tồn tại"
      })
    }

    const company = await adminModel.findCompanyById(companyId)

    const newPhone = phone || admin.phone
    const newPassword = password ? await bcrypt.hash(password, 10) : admin.password
    const newCompanyName = company_name || company?.name || null
    const newCompanyAddress = address || company?.address || null

    await adminModel.updateAdmin(newPhone, newPassword, adminId)

    if (companyId) {
      await adminModel.updateCompany(newCompanyName, newCompanyAddress, companyId)
    }

    res.json({
      message: "Cập nhật thông tin thành công"
    })
  } catch (error) {
    res.status(500).json({
      message: "Lỗi server",
      error: error.message
    })
  }
}

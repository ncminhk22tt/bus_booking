const bcrypt = require("bcryptjs")
const customerModel = require("../../models/customer/customerModel")

const getProfile = async (req, res) => {
  try {
    const customerId = req.customer && req.customer.id

    if (!customerId) {
      return res.status(401).json({
        message: "Chưa đăng nhập"
      })
    }

    const customer = await customerModel.findById(customerId)

    if (!customer) {
      return res.status(404).json({
        message: "Khách hàng không tồn tại"
      })
    }

    res.json({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      created_at: customer.created_at
    })
  } catch (error) {
    console.error("Get customer profile error:", error)
    res.status(500).json({
      message: "Lỗi server"
    })
  }
}

const updateProfile = async (req, res) => {
  try {
    const customerId = req.customer && req.customer.id

    if (!customerId) {
      return res.status(401).json({
        message: "Chưa đăng nhập"
      })
    }

    const { name, phone } = req.body

    if (!name && !phone) {
      return res.status(400).json({
        message: "Không có dữ liệu để cập nhật"
      })
    }

    const current = await customerModel.findById(customerId)

    if (!current) {
      return res.status(404).json({
        message: "Khách hàng không tồn tại"
      })
    }

    if (phone) {
      const existing = await customerModel.findByPhone(phone)
      if (existing && existing.id !== customerId) {
        return res.status(409).json({
          message: "Số điện thoại đã tồn tại"
        })
      }
    }

    const newName = name || current.name
    const newPhone = phone || current.phone

    const result = await customerModel.updateProfile(
      customerId,
      newName,
      newPhone
    )

    if (result.affectedRows === 0) {
      return res.status(400).json({
        message: "Cập nhật thất bại"
      })
    }

    res.json({
      message: "Cập nhật thông tin thành công",
      customer: {
        id: customerId,
        name: newName,
        phone: newPhone
      }
    })
  } catch (error) {
    console.error("Update customer profile error:", error)
    res.status(500).json({
      message: "Lỗi server"
    })
  }
}

const changePassword = async (req, res) => {
  try {
    const customerId = req.customer && req.customer.id
    if (!customerId) {
      return res.status(401).json({
        message: "Chưa đăng nhập"
      })
    }

    const { current_password, new_password } = req.body

    if (!current_password || !new_password) {
      return res.status(400).json({
        message: "Thiếu mật khẩu"
      })
    }

    const current = await customerModel.findById(customerId)
    if (!current) {
      return res.status(404).json({
        message: "Khách hàng không tồn tại"
      })
    }

    const match = await bcrypt.compare(current_password, current.password)
    if (!match) {
      return res.status(400).json({
        message: "Mật khẩu hiện tại không đúng"
      })
    }

    const hashed = await bcrypt.hash(new_password, 10)
    await customerModel.updatePassword(customerId, hashed)

    res.json({
      message: "Đổi mật khẩu thành công"
    })
  } catch (error) {
    console.error("Change password error:", error)
    res.status(500).json({
      message: "Lỗi server"
    })
  }
}

module.exports = {
  getProfile,
  updateProfile,
  changePassword
}

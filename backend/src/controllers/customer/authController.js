const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const customerModel = require("../../models/customer/customerModel")

async function register(req, res) {
  try {
    const { name, phone, password } = req.body

    if (!name || !phone || !password) {
      return res.status(400).json({
        message: "Thiếu các trường bắt buộc"
      })
    }

    const existing = await customerModel.findByPhone(phone)
    if (existing) {
      return res.status(409).json({
        message: "Số điện thoại đã tồn tại"
      })
    }

    const hashed = await bcrypt.hash(password, 10)

    const customerId = await customerModel.createCustomer(
      name,
      phone,
      hashed
    )

    res.json({
      message: "Đăng ký thành công",
      customer_id: customerId
    })
  } catch (error) {
    console.error("Customer register error:", error)
    res.status(500).json({
      message: "Lỗi server"
    })
  }
}

async function login(req, res) {
  try {
    const { phone, password } = req.body

    const customer = await customerModel.findByPhone(phone)

    if (!customer) {
      return res.status(400).json({ message: "Sai tài khoản" })
    }

    const match = await bcrypt.compare(password, customer.password)

    if (!match) {
      return res.status(400).json({ message: "Sai mật khẩu" })
    }

    const token = jwt.sign(
      {
        id: customer.id,
        phone: customer.phone
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    )

    res.json({
      message: "Đăng nhập thành công",
      token
    })
  } catch (error) {
    console.error("Customer login error:", error)
    res.status(500).json({
      message: "Lỗi server"
    })
  }
}

module.exports = {
  register,
  login
}

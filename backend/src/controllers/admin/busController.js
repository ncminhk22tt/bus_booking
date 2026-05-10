const fs = require("fs")
const path = require("path")
const crypto = require("crypto")

const db = require("../../config/db")
const seatService = require("../../services/seatService")
const busModel = require("../../models/admin/busModel")

const MAX_IMAGE_SIZE = 5 * 1024 * 1024

function parseBase64Image(imageBase64) {
  const match = String(imageBase64 || "").match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)
  if (!match) return null

  const mime = match[1]
  const base64Data = match[2]
  const buffer = Buffer.from(base64Data, "base64")

  if (buffer.length > MAX_IMAGE_SIZE) {
    throw new Error("Ảnh vượt quá dung lượng cho phép (5MB)")
  }

  const extMap = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif"
  }

  const ext = extMap[mime]
  if (!ext) {
    throw new Error("Định dạng ảnh không hỗ trợ")
  }

  return { buffer, ext }
}

function saveBusImage(imageBase64, imageName = "") {
  const parsed = parseBase64Image(imageBase64)
  if (!parsed) return null

  const uploadDir = path.join(__dirname, "..", "..", "..", "uploads", "buses")
  fs.mkdirSync(uploadDir, { recursive: true })

  const safeBaseName = String(path.parse(imageName).name || "bus")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 30) || "bus"

  const fileName = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}-${safeBaseName}.${parsed.ext}`
  const filePath = path.join(uploadDir, fileName)

  fs.writeFileSync(filePath, parsed.buffer)

  return `/uploads/buses/${fileName}`
}

function removeUploadedImage(imageUrl) {
  if (!imageUrl) return
  const localPath = path.join(__dirname, "..", "..", "..", imageUrl.replace(/^\//, ""))
  if (fs.existsSync(localPath)) {
    fs.unlinkSync(localPath)
  }
}

const createBus = async (req, res) => {
  let uploadedImageUrl = null

  try {
    const payload = req.body || {}

    if (!req.body) {
      return res.status(400).json({
        message: "Thiếu dữ liệu gửi lên. Hãy kiểm tra Content-Type: application/json"
      })
    }

    const busTypeId = Number(payload.bus_type_id)
    const name = payload.name ? String(payload.name).trim() : null
    const licensePlate = payload.license_plate ? String(payload.license_plate).trim() : ""
    const imageBase64 = payload.image_base64
    const imageName = payload.image_name || ""

    if (!busTypeId || !licensePlate) {
      return res.status(400).json({
        message: "Thiếu thông tin bắt buộc"
      })
    }

    const companyId = req.user && req.user.bus_company_id
    if (!companyId) {
      return res.status(403).json({
        message: "Thiếu quyền nhà xe"
      })
    }

    const [dupRows] = await db.query(
      "SELECT id FROM buses WHERE license_plate = ? LIMIT 1",
      [licensePlate]
    )
    if (dupRows.length > 0) {
      return res.status(409).json({
        message: "Biển số xe đã tồn tại"
      })
    }

    const [types] = await db.query("SELECT * FROM bus_types WHERE id = ? LIMIT 1", [busTypeId])
    const busType = types[0]

    if (!busType) {
      return res.status(404).json({
        message: "Loại xe không tồn tại"
      })
    }

    if (!busType.layout || !seatService.parseLayoutGroups(busType.layout)) {
      return res.status(400).json({
        message: "Loại xe chưa có layout ghế hợp lệ"
      })
    }

    if (imageBase64) {
      try {
        uploadedImageUrl = saveBusImage(imageBase64, imageName)
      } catch (imgErr) {
        return res.status(400).json({ message: imgErr.message })
      }
    }

    const [result] = await db.query(
      `
      INSERT INTO buses (bus_company_id, bus_type_id, name, license_plate, image_url)
      VALUES (?,?,?,?,?)
      `,
      [companyId, busTypeId, name, licensePlate, uploadedImageUrl]
    )

    const busId = result.insertId

    try {
      await seatService.createSeatMap(busId, busType)
    } catch (seatErr) {
      await db.query("DELETE FROM buses WHERE id = ?", [busId])
      removeUploadedImage(uploadedImageUrl)
      return res.status(500).json({
        message: "Không thể tạo sơ đồ ghế cho xe mới"
      })
    }

    res.json({
      message: "Thêm xe và tạo sơ đồ ghế thành công",
      bus_id: busId,
      image_url: uploadedImageUrl
    })
  } catch (error) {
    console.error("Create bus error:", error)

    if (uploadedImageUrl) {
      removeUploadedImage(uploadedImageUrl)
    }

    if (error && error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Biển số xe đã tồn tại"
      })
    }

    res.status(500).json({
      message: "Lỗi server"
    })
  }
}

const updateBus = async (req, res) => {
  let connection
  let uploadedImageUrl = null
  let oldImageUrlToDelete = null

  try {
    const busId = Number(req.params.id)
    const companyId = Number(req.user.bus_company_id)
    const payload = req.body || {}

    const existingBus = await busModel.getBusById(busId, companyId)
    if (!existingBus) {
      return res.status(404).json({
        message: "Xe không tồn tại hoặc không thuộc nhà xe của bạn"
      })
    }

    const nextName = payload.name !== undefined ? String(payload.name || "").trim() : existingBus.name
    const nextLicensePlate = payload.license_plate !== undefined
      ? String(payload.license_plate || "").trim()
      : existingBus.license_plate
    const nextBusTypeId = payload.bus_type_id !== undefined
      ? Number(payload.bus_type_id)
      : Number(existingBus.bus_type_id)
    const imageBase64 = payload.image_base64
    const imageName = payload.image_name || ""

    if (!nextLicensePlate) {
      return res.status(400).json({
        message: "Biển số xe không được để trống"
      })
    }

    if (!nextBusTypeId) {
      return res.status(400).json({
        message: "Loại xe không hợp lệ"
      })
    }

    if (nextLicensePlate !== existingBus.license_plate) {
      const [dupRows] = await db.query(
        "SELECT id FROM buses WHERE license_plate = ? AND id <> ? LIMIT 1",
        [nextLicensePlate, busId]
      )
      if (dupRows.length > 0) {
        return res.status(409).json({
          message: "Biển số xe đã tồn tại"
        })
      }
    }

    const busTypeChanged = Number(existingBus.bus_type_id) !== Number(nextBusTypeId)
    let nextBusType = null

    if (busTypeChanged) {
      const [types] = await db.query("SELECT * FROM bus_types WHERE id = ? LIMIT 1", [nextBusTypeId])
      nextBusType = types[0]

      if (!nextBusType) {
        return res.status(404).json({
          message: "Loại xe không tồn tại"
        })
      }

      if (!nextBusType.layout || !seatService.parseLayoutGroups(nextBusType.layout)) {
        return res.status(400).json({
          message: "Loại xe chưa có sơ đồ ghế hợp lệ"
        })
      }

      const hasTrips = await busModel.hasTripsByBusId(busId)
      if (hasTrips) {
        return res.status(409).json({
          message: "Xe đã có chuyến, không thể đổi loại xe"
        })
      }
    }

    const updateData = {
      name: nextName,
      license_plate: nextLicensePlate,
      bus_type_id: nextBusTypeId
    }

    if (imageBase64) {
      try {
        uploadedImageUrl = saveBusImage(imageBase64, imageName)
      } catch (imgErr) {
        return res.status(400).json({ message: imgErr.message })
      }
      updateData.image_url = uploadedImageUrl
      oldImageUrlToDelete = existingBus.image_url || null
    }

    connection = await db.getConnection()
    await connection.beginTransaction()

    const result = await busModel.updateBus(
      busId,
      companyId,
      updateData,
      connection
    )

    if (result.affectedRows === 0) {
      await connection.rollback()
      return res.status(404).json({
        message: "Xe không tồn tại hoặc không thuộc nhà xe của bạn"
      })
    }

    if (busTypeChanged && nextBusType) {
      await busModel.clearSeatsByBusId(busId, connection)
      await seatService.createSeatMap(busId, nextBusType, connection)
    }

    await connection.commit()

    if (oldImageUrlToDelete && oldImageUrlToDelete !== uploadedImageUrl) {
      removeUploadedImage(oldImageUrlToDelete)
    }

    res.json({
      message: busTypeChanged
        ? "Cập nhật xe thành công và đã đồng bộ lại sơ đồ ghế"
        : "Cập nhật xe thành công"
    })
  } catch (error) {
    if (connection) {
      await connection.rollback()
    }
    if (uploadedImageUrl) {
      removeUploadedImage(uploadedImageUrl)
    }
    console.error("Update bus error:", error)

    if (error && error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Biển số xe đã tồn tại"
      })
    }

    res.status(500).json({
      message: "Lỗi server"
    })
  } finally {
    if (connection) {
      connection.release()
    }
  }
}

const deleteBus = async (req, res) => {
  try {
    const busId = req.params.id
    const companyId = req.user.bus_company_id

    const result = await busModel.deleteBus(busId, companyId)

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Xe không tồn tại hoặc không thuộc nhà xe của bạn"
      })
    }

    res.json({
      message: "Ngừng hoạt động xe thành công"
    })
  } catch (error) {
    console.error("Delete bus error:", error)
    res.status(500).json({
      message: "Lỗi server"
    })
  }
}

const listBuses = async (req, res) => {
  try {
    const companyId = req.user && req.user.bus_company_id

    if (!companyId) {
      return res.status(403).json({
        message: "Thiếu quyền nhà xe"
      })
    }

    const rows = await busModel.listBuses(companyId)
    res.json(rows)
  } catch (error) {
    console.error("List buses error:", error)
    res.status(500).json({
      message: "Lỗi server"
    })
  }
}

const listBusTypes = async (req, res) => {
  try {
    const rows = await busModel.listBusTypes()
    res.json(rows)
  } catch (error) {
    console.error("List bus types error:", error)
    res.status(500).json({
      message: "Lỗi server"
    })
  }
}

module.exports = {
  createBus,
  updateBus,
  deleteBus,
  listBuses,
  listBusTypes
}

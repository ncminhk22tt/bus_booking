const path = require("path")
const dotenv = require("dotenv")

dotenv.config({ path: path.join(__dirname, "..", ".env") })
const db = require("../src/config/db")

function seatCode(prefix, n, suffix = "") {
  return `${prefix}${String(n).padStart(2, "0")}${suffix}`
}

function addSeat(seats, busId, seatNumber, floor, row, col, seatType = "seat") {
  seats.push([busId, seatNumber, floor, row, col, false, seatType, "available"])
}

function buildXeGheNgoi45(busId) {
  const seats = []
  let n = 1

  for (let row = 1; row <= 10; row++) {
    ;[1, 2, 4, 5].forEach((col) => addSeat(seats, busId, seatCode("A", n++), 1, row, col, "seat"))
  }

  ;[1, 2, 3, 4, 5].forEach((col) => addSeat(seats, busId, seatCode("A", n++), 1, 11, col, "seat"))
  return seats
}

function buildXeGiuongNam40(busId) {
  const seats = []

  for (let floor = 1; floor <= 2; floor++) {
    const prefix = floor === 1 ? "A" : "B"
    let n = 1

    for (let row = 1; row <= 6; row++) {
      ;[1, 3, 5].forEach((col) => addSeat(seats, busId, `${prefix}${String(n++).padStart(2, "0")}`, floor, row, col, "bed"))
    }

    ;[1, 2, 3, 4, 5].forEach((col) => addSeat(seats, busId, `${prefix}${String(n++).padStart(2, "0")}`, floor, 7, col, "bed"))
  }

  return seats
}

function buildXeGiuongLuxury34(busId) {
  const seats = []

  for (let floor = 1; floor <= 2; floor++) {
    const prefix = floor === 1 ? "A" : "B"
    let n = 1

    for (let row = 1; row <= 5; row++) {
      addSeat(seats, busId, `${prefix}${String(n++).padStart(2, "0")}L`, floor, row, 1, "vip")
      addSeat(seats, busId, `${prefix}${String(n++).padStart(2, "0")}M`, floor, row, 3, "vip")
      addSeat(seats, busId, `${prefix}${String(n++).padStart(2, "0")}R`, floor, row, 5, "vip")
    }

    addSeat(seats, busId, `${prefix}${String(n++).padStart(2, "0")}L`, floor, 6, 1, "vip")
    addSeat(seats, busId, `${prefix}${String(n++).padStart(2, "0")}M`, floor, 6, 2, "vip")
    addSeat(seats, busId, `${prefix}${String(n++).padStart(2, "0")}R`, floor, 6, 4, "vip")
    addSeat(seats, busId, `${prefix}${String(n++).padStart(2, "0")}R`, floor, 6, 5, "vip")
  }

  return seats
}
function buildXeCabin22(busId) {
  const seats = []
  let n = 1

  // 2 floors, 2 columns (left/right), wide aisle in middle (col=2)
  for (let floor = 1; floor <= 2; floor++) {
    const maxRows = floor === 1 ? 6 : 5
    for (let row = 1; row <= maxRows; row++) {
      ;[1, 3].forEach((col) => addSeat(seats, busId, seatCode("P", n++, floor === 2 ? "U" : "L"), floor, row, col, "vip"))
    }
  }

  return seats
}

function buildXeLimousine9(busId) {
  const seats = []

  // Sơ đồ chuẩn Limousine 9: 1 ghế tài + 8 ghế khách
  // [Tài] [ ] [A1]
  // [A2]  [ ] [A3]
  // [A4]  [ ] [A5]
  // [A6] [A7] [A8]
  addSeat(seats, busId, "A1", 1, 1, 3, "vip")
  addSeat(seats, busId, "A2", 1, 2, 1, "vip")
  addSeat(seats, busId, "A3", 1, 2, 3, "vip")
  addSeat(seats, busId, "A4", 1, 3, 1, "vip")
  addSeat(seats, busId, "A5", 1, 3, 3, "vip")
  addSeat(seats, busId, "A6", 1, 4, 1, "vip")
  addSeat(seats, busId, "A7", 1, 4, 2, "vip")
  addSeat(seats, busId, "A8", 1, 4, 3, "vip")

  return seats
}

async function ensureBusType({ name, layout, totalSeats, seatType, floors, rowCount, colCount }) {
  const [rows] = await db.query("SELECT id FROM bus_types WHERE name = ? LIMIT 1", [name])
  if (rows.length) return rows[0].id

  const [result] = await db.query(
    `
    INSERT INTO bus_types (name, description, floors, row_count, col_count, total_seats, seat_type, layout)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [name, name, floors, rowCount, colCount, totalSeats, seatType, layout]
  )
  return result.insertId
}

async function ensureCompany() {
  const [rows] = await db.query("SELECT id FROM bus_companies ORDER BY id ASC LIMIT 1")
  if (rows.length) return rows[0].id

  const [result] = await db.query(
    "INSERT INTO bus_companies (name, phone, address) VALUES (?, ?, ?)",
    ["Nhà xe Seed Demo", "0900000009", "TP. Hồ Chí Minh"]
  )
  return result.insertId
}

async function ensureBus(companyId, busTypeId, name, plate) {
  const [rows] = await db.query("SELECT id FROM buses WHERE license_plate = ? LIMIT 1", [plate])
  if (rows.length) return rows[0].id

  const [result] = await db.query(
    "INSERT INTO buses (bus_company_id, bus_type_id, name, license_plate, status, is_active) VALUES (?, ?, ?, ?, 'active', 1)",
    [companyId, busTypeId, name, plate]
  )
  return result.insertId
}

async function replaceBusSeats(busId, seats) {
  await db.query("DELETE FROM seats WHERE bus_id = ?", [busId])
  if (!seats.length) return

  await db.query(
    `
    INSERT INTO seats (bus_id, seat_number, floor, row_index, col_index, is_aisle, seat_type, status)
    VALUES ?
    `,
    [seats]
  )
}

async function main() {
  try {
    console.log("Đang tạo dữ liệu mẫu 5 loại xe...")

    const companyId = await ensureCompany()

    const busTypes = [
      {
        name: "Xe Ghế Ngồi 45 Chỗ",
        layout: "2-2",
        totalSeats: 45,
        seatType: "seat",
        floors: 1,
        rowCount: 11,
        colCount: 5,
        busName: "Universe 45 Demo",
        plate: "51B-45045",
        build: buildXeGheNgoi45
      },
      {
        name: "Xe Giường Nằm 40 Chỗ",
        layout: "1-1-1",
        totalSeats: 40,
        seatType: "bed",
        floors: 2,
        rowCount: 7,
        colCount: 5,
        busName: "Sleeper 40 Demo",
        plate: "51B-40040",
        build: buildXeGiuongNam40
      },
      {
        name: "Xe Giường Nằm Luxury 34 Chỗ",
        layout: "1-1-1",
        totalSeats: 34,
        seatType: "vip",
        floors: 2,
        rowCount: 6,
        colCount: 5,
        busName: "Luxury 34 Demo",
        plate: "51B-34034",
        build: buildXeGiuongLuxury34
      },
      {
        name: "Xe Cabin Limousine 22 Phòng",
        layout: "1-1",
        totalSeats: 22,
        seatType: "vip",
        floors: 2,
        rowCount: 11,
        colCount: 3,
        busName: "Cabin 22 Demo",
        plate: "51B-22022",
        build: buildXeCabin22
      },
      {
        name: "Xe Limousine 9 Chỗ",
        layout: "2-2-3",
        totalSeats: 9,
        seatType: "vip",
        floors: 1,
        rowCount: 4,
        colCount: 3,
        busName: "Dcar 9 Demo",
        plate: "51B-09009",
        build: buildXeLimousine9
      }
    ]

    let total = 0

    for (const item of busTypes) {
      const busTypeId = await ensureBusType(item)
      const busId = await ensureBus(companyId, busTypeId, item.busName, item.plate)
      const seats = item.build(busId)
      await replaceBusSeats(busId, seats)
      total += seats.length
      console.log(`Đã seed ${item.name}: ${seats.length} ghế`) 
    }

    console.log(`Hoàn tất seed sơ đồ ghế. Còn trống: ${total} ghế`)
  } catch (error) {
    console.error("Lỗi seed dữ liệu ghế:", error.message)
    process.exit(1)
  } finally {
    await db.end()
  }
}

main()





